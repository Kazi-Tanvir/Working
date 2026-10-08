import { createKafkaClient, createConsumer, createProducer } from "@repo/kafka"

const kafkaClient = createKafkaClient("product-service");

export const producer = await createProducer(kafkaClient);
export const consumer = await createConsumer(kafkaClient, "product-group");
