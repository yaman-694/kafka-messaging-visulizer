import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import kafka from "./kafka/kafka.js";

const app = express();
const PORT = 8080;
const KAFKA_TOPIC = "results_topic";
const CONSUMER_GROUP = "collector-group";

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store connected WebSocket clients
const clients = new Set();

// WebSocket connection handler
wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("WebSocket client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

// Broadcast message to all connected WebSocket clients
function broadcast(message) {
  const data = typeof message === "string" ? message : JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === 1) {
      // 1 = OPEN state
      client.send(data);
    }
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Kafka consumer setup
async function setupKafkaConsumer() {
  const consumer = kafka.consumer({
    groupId: CONSUMER_GROUP,
    retry: {
      initialRetryTime: 300,
      retries: 10,
      maxRetryTime: 30000,
      multiplier: 2,
    },
  });

  // Handle consumer events
  consumer.on("consumer.connect", () => {
    console.log("Kafka consumer connected");
  });

  consumer.on("consumer.disconnect", () => {
    console.log("Kafka consumer disconnected");
  });

  consumer.on("consumer.crash", async (event) => {
    console.error("Kafka consumer crashed:", event.payload.error);
    console.log("Attempting to reconnect...");
    // KafkaJS will automatically attempt to reconnect based on retry configuration
  });

  async function connect() {
    try {
      await consumer.connect();
      console.log("Connected to Kafka broker");

      await consumer.subscribe({
        topic: KAFKA_TOPIC,
        fromBeginning: false,
      });
      console.log(`Subscribed to topic: ${KAFKA_TOPIC}`);

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const value = message.value?.toString();
          console.log(`Received message from ${topic}:`, value);

          // Broadcast the message to all WebSocket clients
          if (value) {
            broadcast(value);
          }
        },
      });
    } catch (error) {
      console.error("Error connecting to Kafka:", error);
      console.log("Retrying connection in 5 seconds...");
      setTimeout(() => connect(), 5000);
    }
  }

  // Initial connection
  await connect();

  // Handle process termination
  const errorTypes = ["unhandledRejection", "uncaughtException"];
  const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

  errorTypes.forEach((type) => {
    process.on(type, async (error) => {
      try {
        console.log(`process.on ${type}`);
        console.error(error);
        await consumer.disconnect();
        process.exit(0);
      } catch (_) {
        process.exit(1);
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async () => {
      try {
        console.log(`process.once ${type}`);
        await consumer.disconnect();
      } finally {
        process.kill(process.pid, type);
      }
    });
  });

  return consumer;
}

// Start the server
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);

  // Initialize Kafka consumer
  try {
    await setupKafkaConsumer();
  } catch (error) {
    console.error("Failed to setup Kafka consumer:", error);
  }
});

export default app;
