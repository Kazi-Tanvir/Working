import { createKafkaClient, createConsumer, createProducer } from "@repo/kafka"

const kafkaClient = createKafkaClient("order-service");

export const producer = await createProducer(kafkaClient);
export const consumer = await createConsumer(kafkaClient, "order-group");
