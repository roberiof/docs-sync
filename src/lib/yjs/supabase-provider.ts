import * as Y from "yjs";
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";
const toBase64 = (buf: Uint8Array): string =>
  btoa(String.fromCharCode(...buf));
const fromBase64 = (str: string): Uint8Array =>
  new Uint8Array(
    atob(str)
      .split("")
      .map((c) => c.charCodeAt(0)),
  );
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

export type User = {
  name: string | null;
  color: string;
  avatarUrl?: string | null;
};

// Mirrors y-websocket's "sync" event, which fires the listener with a boolean.
type SyncListener = (synced: boolean) => void;

// Broadcast event names on the per-document channel.
const EVENT_DOC = "doc"; // an incremental Y.Doc update
const EVENT_AWARENESS = "awareness"; // a y-protocols awareness update
const EVENT_SYNC_REQUEST = "sync-request"; // a late joiner asking for state
const EVENT_SYNC_REPLY = "sync-reply"; // a peer's full-state response

// How long to wait for peers to reply with state before declaring "synced".
// The DB seed in Editor.tsx covers the empty-room case, so this only bridges
// the "joining a room others are already editing" gap.
const SYNC_TIMEOUT_MS = 1000;

/**
 * A Yjs network provider that transports document + awareness updates over a
 * Supabase Realtime channel instead of a dedicated y-websocket server.
 *
 * It implements the small slice of the y-websocket `WebsocketProvider` API the
 * app relies on — `awareness`, `synced`, the `"sync"` event, and
 * `connect()` / `destroy()` — so it is a drop-in replacement.
 *
 * Clients are peers (Yjs's native model): there is no authoritative server doc.
 * A late joiner broadcasts a sync-request and any peer replies with the full
 * encoded state.
 *
 * Lifecycle note: the channel and its Y.Doc/awareness listeners are created in
 * `connect()` and fully torn down in `destroy()`, so the provider survives a
 * connect→destroy→connect cycle (e.g. React StrictMode's double-invoked effects
 * in dev). The `awareness` instance, by contrast, lives for the whole provider
 * lifetime because `CollaborationCaret` captures it once at editor init.
 */
export class SupabaseProvider {
  readonly awareness: Awareness;
  synced = false;

  private readonly supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private subscribed = false;
  private readonly syncListeners = new Set<SyncListener>();
  private syncTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly roomId: string,
    private readonly ydoc: Y.Doc,
    user: User,
  ) {
    this.awareness = new Awareness(ydoc);
    this.awareness.setLocalStateField("user", {
      name: user.name || "Anonymous",
      color: user.color,
      avatarUrl: user.avatarUrl ?? null,
    });
  }

  // --- minimal "sync" event emitter -------------------------------------------

  on(event: "sync", listener: SyncListener) {
    if (event === "sync") this.syncListeners.add(listener);
  }

  off(event: "sync", listener: SyncListener) {
    if (event === "sync") this.syncListeners.delete(listener);
  }

  private emitSync() {
    if (this.synced) return;
    this.synced = true;
    this.syncListeners.forEach((l) => l(true));
  }

  // --- lifecycle --------------------------------------------------------------

  connect() {
    if (this.channel) return; // already connected (idempotent)

    const channel = this.supabase.channel(`yjs:${this.roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: String(this.awareness.clientID) },
        private: true,
      },
    });
    this.channel = channel;

    channel
      .on("broadcast", { event: EVENT_DOC }, ({ payload }) =>
        this.applyRemoteUpdate(payload as { update?: string }),
      )
      .on("broadcast", { event: EVENT_SYNC_REPLY }, ({ payload }) =>
        this.applyRemoteUpdate(payload as { update?: string }),
      )
      .on("broadcast", { event: EVENT_SYNC_REQUEST }, () => this.replyWithState())
      .on("broadcast", { event: EVENT_AWARENESS }, ({ payload }) =>
        this.applyRemoteAwareness(payload as { update?: string }),
      )
      .on("presence", { event: "leave" }, ({ key }) => this.handlePresenceLeave(key));

    this.ydoc.on("update", this.handleDocUpdate);
    this.awareness.on("update", this.handleAwarenessUpdate);

    channel.subscribe((status) => {
      if (status !== "SUBSCRIBED") return;
      this.subscribed = true;
      // Ask peers for current state, then declare synced after a short grace
      // period whether or not anyone answers (empty room → DB seed handles it).
      void channel.send({ type: "broadcast", event: EVENT_SYNC_REQUEST, payload: {} });
      void channel.track({ at: Date.now() });
      // Push our current awareness so peers already in the room see us.
      this.broadcastAwareness([this.awareness.clientID]);
      this.syncTimer = setTimeout(() => this.emitSync(), SYNC_TIMEOUT_MS);
    });
  }

  destroy() {
    if (!this.channel) return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.ydoc.off("update", this.handleDocUpdate);
    this.awareness.off("update", this.handleAwarenessUpdate);
    // Detached above, so this clears our local presence without broadcasting;
    // peers learn we left via the channel's presence "leave" event.
    removeAwarenessStates(this.awareness, [this.awareness.clientID], this);
    void this.supabase.removeChannel(this.channel);
    this.channel = null;
    this.subscribed = false;
    this.synced = false;
  }

  // --- document updates -------------------------------------------------------

  private handleDocUpdate = (update: Uint8Array, origin: unknown) => {
    // Skip updates we just applied from the network (origin === this), or this
    // would echo them straight back out. Skip until the socket has joined to
    // avoid the REST-fallback path (peers back-fill via sync-reply anyway).
    if (origin === this || !this.subscribed || !this.channel) return;
    void this.channel.send({
      type: "broadcast",
      event: EVENT_DOC,
      payload: { update: toBase64(update) },
    });
  };

  private applyRemoteUpdate(payload: { update?: string }) {
    if (!payload?.update) return;
    Y.applyUpdate(this.ydoc, fromBase64(payload.update), this);
    // Receiving real state from a peer also means we're synced.
    this.emitSync();
  }

  private replyWithState() {
    if (!this.subscribed || !this.channel) return;
    void this.channel.send({
      type: "broadcast",
      event: EVENT_SYNC_REPLY,
      payload: { update: toBase64(Y.encodeStateAsUpdate(this.ydoc)) },
    });
  }

  // --- awareness --------------------------------------------------------------

  private handleAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    if (origin === this) return;
    this.broadcastAwareness(added.concat(updated, removed));
  };

  private broadcastAwareness(clients: number[]) {
    if (!this.subscribed || !this.channel || clients.length === 0) return;
    void this.channel.send({
      type: "broadcast",
      event: EVENT_AWARENESS,
      payload: { update: toBase64(encodeAwarenessUpdate(this.awareness, clients)) },
    });
  }

  private applyRemoteAwareness(payload: { update?: string }) {
    if (!payload?.update) return;
    applyAwarenessUpdate(this.awareness, fromBase64(payload.update), this);
  }

  private handlePresenceLeave(key: string) {
    const clientID = Number(key);
    if (Number.isNaN(clientID)) return;
    removeAwarenessStates(this.awareness, [clientID], this);
  }
}
