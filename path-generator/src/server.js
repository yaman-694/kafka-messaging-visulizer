import { createExpressServer } from "./http/expressServer.js";
import { createWebSocketServer } from "./websocket/wsServer.js";
import { setupKafkaConsumer } from "./kafka/kafkaConsumer.js";
import { setupGracefulShutdown } from "./utils/gracefulShutdown.js";

const PORT = 8080;

// Create Express server
const server = createExpressServer(PORT);

// Create WebSocket server
const wss = createWebSocketServer(server);

// Start Kafka consumer
setupKafkaConsumer().catch((error) => {
  console.error("Fatal error setting up Kafka consumer:", error);
});

// Setup graceful shutdown
setupGracefulShutdown(server, wss);
