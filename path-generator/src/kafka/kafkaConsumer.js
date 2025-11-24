import kafka from "../kafka/kafka.js";
import { broadcastMessage } from "../websocket/wsManager.js";

async function connectConsumer(consumer) {
  try {
    console.log("Connecting to Kafka...");
    await consumer.connect();
    console.log("Successfully connected to Kafka");
    return true;
  } catch (error) {
    console.error("Failed to connect to Kafka:", error.message);
    console.log("Retrying in 5 seconds...");
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
    throw new Error("Failed to subscribe after maximum retries");
  }
}

async function startConsumerRunner(consumer) {
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = message.value?.toString();
        console.log(`Received message from ${topic} [${partition}]:`, value);

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
}

async function handleConsumerError(consumer) {
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

export async function setupKafkaConsumer() {
  const consumer = kafka.consumer({ groupId: "collector-group" });

  try {
    const connected = await connectConsumer(consumer);
    if (!connected) return;

    await subscribeToTopic(consumer);
    await startConsumerRunner(consumer);
    console.log("Kafka consumer is running...");

    handleConsumerError(consumer);
  } catch (error) {
    console.error("Error setting up Kafka consumer:", error);
    console.log("Attempting to reconnect...");
    try {
      await consumer.disconnect();
    } catch (e) {
      console.error("Error during disconnect:", e);
    }
    setTimeout(() => setupKafkaConsumer(), 5000);
  }
}
