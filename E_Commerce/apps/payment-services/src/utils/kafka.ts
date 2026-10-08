import { createKafkaClient, createConsumer, createProducer } from "@repo/kafka"

const kafkaClient = createKafkaClient("payment-service");

export const producer = await createProducer(kafkaClient);
export const consumer = await createConsumer(kafkaClient, "payment-group");
