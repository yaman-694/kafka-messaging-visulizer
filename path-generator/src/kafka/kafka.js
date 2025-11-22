import { Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "collector-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 30000,
    multiplier: 2,
    restartOnFailure: async (error) => {
      console.error("Kafka connection failed:", error);
      return true;
    },
  },
});

export default kafka;
