import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

const PORT = process.env.PORT || 1234;

// y-websocket message types (must match the client protocol).
const messageSync = 0;
const messageAwareness = 1;

// Map: roomName -> { ydoc, awareness, conns: Set<WebSocket> }
const docs = new Map();

function send(conn, message) {
  if (conn.readyState === WebSocket.OPEN) {
    conn.send(message, { binary: true });
  }
}

function broadcast(conns, message) {
  conns.forEach((conn) => send(conn, message));
}

function getOrCreateDoc(roomName) {
  let entry = docs.get(roomName);
  if (entry) return entry;

  const ydoc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(ydoc);
  awareness.setLocalState(null);
  const conns = new Set();

  // Authoritative doc state: rebroadcast every applied update to all clients.
  ydoc.on("update", (update) => {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    broadcast(conns, encoding.toUint8Array(encoder));
  });

  awareness.on("update", ({ added, updated, removed }) => {
    const changed = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changed),
    );
    broadcast(conns, encoding.toUint8Array(encoder));
  });

  entry = { ydoc, awareness, conns };
  docs.set(roomName, entry);
  return entry;
}

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (conn, req) => {
  conn.binaryType = "arraybuffer";
  const roomName = new URL(`http://x${req.url}`).pathname.slice(1) || "default";
  const { ydoc, awareness, conns } = getOrCreateDoc(roomName);

  conns.add(conn);
  console.log(`[ws] connected to "${roomName}", clients: ${conns.size}`);

  // Track which awareness clientIDs this connection owns, so we can clear them
  // when it drops.
  const controlledIds = new Set();
  const awarenessChange = ({ added, updated, removed }, origin) => {
    if (origin !== conn) return;
    added.forEach((id) => controlledIds.add(id));
    updated.forEach((id) => controlledIds.add(id));
    removed.forEach((id) => controlledIds.delete(id));
  };
  awareness.on("update", awarenessChange);

  conn.on("message", (data) => {
    const message = new Uint8Array(data);
    const decoder = decoding.createDecoder(message);
    const messageType = decoding.readVarUint(decoder);

    if (messageType === messageSync) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      // Applies the update to the room doc AND writes any reply (e.g. syncStep2)
      // the client needs. `conn` is the transaction origin → not echoed back.
      syncProtocol.readSyncMessage(decoder, encoder, ydoc, conn);
      if (encoding.length(encoder) > 1) {
        send(conn, encoding.toUint8Array(encoder));
      }
    } else if (messageType === messageAwareness) {
      awarenessProtocol.applyAwarenessUpdate(awareness, decoding.readVarUint8Array(decoder), conn);
    }
  });

  conn.on("close", () => {
    conns.delete(conn);
    awareness.off("update", awarenessChange);
    awarenessProtocol.removeAwarenessStates(awareness, [...controlledIds], null);
    console.log(`[ws] disconnected from "${roomName}", clients: ${conns.size}`);
    if (conns.size === 0) {
      ydoc.destroy();
      docs.delete(roomName);
    }
  });

  conn.on("error", (err) => console.error(`[ws] error in "${roomName}":`, err.message));

  // Handshake: ask the client for its state (syncStep1), then push current
  // awareness so the new client sees who else is editing.
  {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, ydoc);
    send(conn, encoding.toUint8Array(encoder));
  }
  const states = awareness.getStates();
  if (states.size > 0) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, [...states.keys()]),
    );
    send(conn, encoding.toUint8Array(encoder));
  }
});

server.listen(PORT, () => {
  console.log(`[ws] y-websocket server listening on ws://localhost:${PORT}`);
});
