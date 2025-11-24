// Store all connected WebSocket clients
const wsClients = new Set();

// Broadcast message to all connected WebSocket clients
export function broadcastMessage(message) {
  const payload = JSON.stringify(message);
  let successCount = 0;
  let failureCount = 0;

  wsClients.forEach((client) => {
    if (client.readyState === 1) {
      // WebSocket.OPEN
      try {
        client.send(payload);
        successCount++;
      } catch (error) {
        console.error("Error sending message to client:", error);
        failureCount++;
      }
    }
  });

  console.log(
    `Broadcasted to ${successCount} clients (${failureCount} failed)`
  );
}

// Add a WebSocket client
export function addClient(ws) {
  wsClients.add(ws);
  console.log("New WebSocket client connected");
}

// Remove a WebSocket client
export function removeClient(ws) {
  wsClients.delete(ws);
  console.log("WebSocket client disconnected");
}

// Get total connected clients
export function getClientCount() {
  return wsClients.size;
}
