import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "collector-service",
  brokers: ["kafka:9092"],
  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 30000,
    multiplier: 2,
    factor: 0.2,
  },
});

export default kafka;
