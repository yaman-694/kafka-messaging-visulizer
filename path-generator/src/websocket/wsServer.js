import { WebSocketServer } from "ws";
import { addClient, removeClient } from "./wsManager.js";

export function createWebSocketServer(server) {
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    addClient(ws);

    ws.on("close", () => {
    removeClient(ws);
    });

    ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    removeClient(ws);
    });
});

return wss;
}
