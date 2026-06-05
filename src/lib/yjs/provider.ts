import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const YWS_URL = process.env.NEXT_PUBLIC_YWS_URL || "ws://localhost:1234";

export type User = {
  name: string | null;
  color: string;
};

export function createYProvider(roomId: string, user: User) {
  const ydoc = new Y.Doc();
  // `connect: false` keeps construction side-effect-free so it can run in a
  // `useMemo`; the caller opens the socket from an effect.
  const provider = new WebsocketProvider(YWS_URL, roomId, ydoc, { connect: false });

  provider.awareness.setLocalStateField("user", {
    name: user.name || "Anonymous",
    color: user.color,
  });

  return { ydoc, provider };
}
