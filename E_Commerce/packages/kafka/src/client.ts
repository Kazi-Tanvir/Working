import { Kafka } from "kafkajs";

export const createKafkaClient = (services: string) => {
    const kafka = new Kafka({
        clientId: 'kafka',
        brokers: ["localhost:9094", "localhost:9095", "localhost:9096"]
    });
    return kafka;
}