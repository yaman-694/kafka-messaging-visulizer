import { createExpressServer } from "./http/expressServer.js";
import { createWebSocketServer } from "./websocket/wsServer.js";
import { setupKafkaConsumer } from "./kafka/kafkaConsumer.js";
import { KafkaProducer } from "./kafka/kafkaProducer.js";
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

// Start Kafka producer (for demonstration)
const producer = new KafkaProducer();
producer
  .connect()
  .then(() => {
    // Start producing sample data every 3 seconds
    producer.startProducing(3000);
  })
  .catch((error) => {
    console.error("Failed to start Kafka producer:", error);
  });

// Setup graceful shutdown
setupGracefulShutdown(server, wss, () => {
  producer.stopProducing();
  producer.disconnect();
});
