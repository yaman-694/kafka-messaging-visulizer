import express from "express";
import { WebSocketServer } from "ws";
import kafka from "./kafka/kafka.js";

const app = express();
const PORT = 8080;

// Store all connected WebSocket clients
const wsClients = new Set();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");
  wsClients.add(ws);

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    wsClients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    wsClients.delete(ws);
  });
});

// Broadcast message to all connected WebSocket clients
function broadcastMessage(message) {
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

// Setup Kafka consumer with reconnect logic
async function setupKafkaConsumer() {
  const consumer = kafka.consumer({ groupId: "collector-group" });

  const connectWithRetry = async () => {
    try {
      console.log("Connecting to Kafka...");
      await consumer.connect();
      console.log("Successfully connected to Kafka");
    } catch (error) {
      console.error("Failed to connect to Kafka:", error.message);
      console.log("Retrying in 5 seconds...");
      setTimeout(connectWithRetry, 5000);
      return false;
    }
    return true;
  };

  // Initial connection
  const connected = await connectWithRetry();
  if (!connected) return;

  try {
    // Subscribe to the results topic with retry logic
    let subscribed = false;
    let retries = 0;
    const maxRetries = 15;

    while (!subscribed && retries < maxRetries) {
      try {
        await consumer.subscribe({
          topic: "results_topic",
          fromBeginning: false,
        });
        console.log("Subscribed to topic: results_topic");
        subscribed = true;
      } catch (error) {
        retries++;
        console.error(`Subscription attempt ${retries} failed:`, error.message);
        if (retries < maxRetries) {
          console.log(`Retrying in ${retries * 2} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retries * 2000));
        }
      }
    }

    if (!subscribed) {
      console.error("Failed to subscribe after maximum retries");
      return;
    }

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const value = message.value?.toString();
          console.log(`Received message from ${topic} [${partition}]:`, value);

          // Broadcast the message to all WebSocket clients
          if (value) {
            broadcastMessage({
              topic,
              partition,
              offset: message.offset,
              key: message.key?.toString(),
              value: value,
              timestamp: message.timestamp,
            });
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      },
    });

    console.log("Kafka consumer is running...");
  } catch (error) {
    console.error("Error setting up Kafka consumer:", error);
    // Attempt to reconnect
    console.log("Attempting to reconnect...");
    await consumer.disconnect();
    setTimeout(() => setupKafkaConsumer(), 5000);
  }

  // Handle consumer errors and reconnect
  consumer.on(consumer.events.CRASH, async (event) => {
    console.error("Consumer crashed:", event.payload.error);
    console.log("Attempting to reconnect...");
    try {
      await consumer.disconnect();
    } catch (e) {
      console.error("Error during disconnect:", e);
    }
    setTimeout(() => setupKafkaConsumer(), 5000);
  });

  consumer.on(consumer.events.DISCONNECT, () => {
    console.log("Consumer disconnected");
    console.log("Attempting to reconnect...");
    setTimeout(() => setupKafkaConsumer(), 5000);
  });
}

// Start Kafka consumer
setupKafkaConsumer().catch((error) => {
  console.error("Fatal error setting up Kafka consumer:", error);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  wss.close();
  server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nShutting down gracefully...");
  wss.close();
  server.close();
  process.exit(0);
});
