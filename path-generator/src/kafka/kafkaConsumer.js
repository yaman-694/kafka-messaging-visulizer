import logger from "../config/logger.js";
import kafka from "../kafka/kafka.js";
import { broadcastMessage } from "../websocket/wsManager.js";

async function connectConsumer(consumer) {
  try {
    logger.log("Connecting to Kafka...");
    await consumer.connect();
    logger.log("Successfully connected to Kafka");
    return true;
  } catch (error) {
    logger.error("Failed to connect to Kafka:", error.message);
    logger.log("Retrying in 5 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectConsumer(consumer);
  }
}

async function subscribeToTopic(consumer) {
  let subscribed = false;
  let retries = 0;
  const maxRetries = 15;

  while (!subscribed && retries < maxRetries) {
    try {
      await consumer.subscribe({
        topic: "path-coordinates",
        fromBeginning: false,
      });
      logger.log("Subscribed to topic: path-coordinates");
      subscribed = true;
    } catch (error) {
      retries++;
      logger.error(`Subscription attempt ${retries} failed:`, error.message);
      if (retries < maxRetries) {
        logger.log(`Retrying in ${retries * 2} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retries * 2000));
      }
    }
  }

  if (!subscribed) {
    throw new Error("Failed to subscribe after maximum retries");
  }
}

async function startConsumerRunner(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString();
        logger.log(`Received message from ${topic} [${partition}]:`, value);

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
        logger.error("Error processing message:", error);
      }
    },
  });
}

async function handleConsumerError(consumer) {
  consumer.on(consumer.events.CRASH, async (event) => {
    logger.error("Consumer crashed:", event.payload.error);
    logger.log("Attempting to reconnect...");
    try {
      await consumer.disconnect();
    } catch (e) {
      logger.error("Error during disconnect:", e);
    }
    setTimeout(() => setupKafkaConsumer(), 5000);
  });

  consumer.on(consumer.events.DISCONNECT, () => {
    logger.log("Consumer disconnected");
    logger.log("Attempting to reconnect...");
    setTimeout(() => setupKafkaConsumer(), 5000);
  });
}

export async function setupKafkaConsumer() {
  const consumer = kafka.consumer({ groupId: "collector-group" });

  try {
    const connected = await connectConsumer(consumer);
    if (!connected) return;

    await subscribeToTopic(consumer);
    await startConsumerRunner(consumer);
    logger.log("Kafka consumer is running...");

    handleConsumerError(consumer);
  } catch (error) {
    logger.error("Error setting up Kafka consumer:", error);
    logger.log("Attempting to reconnect...");
    try {
      await consumer.disconnect();
    } catch (e) {
      logger.error("Error during disconnect:", e);
    }
    setTimeout(() => setupKafkaConsumer(), 5000);
  }
}
