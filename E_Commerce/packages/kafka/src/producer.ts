import type { Kafka, Producer } from "kafkajs";

export const createProducer = async (kafka: Kafka) => {
    const producer: Producer = kafka.producer();

    const connect = async() =>{
        await producer.connect();
    };

    const send = async(topic:string ,message:any) => {
        await producer.send({
            topic,
            messages: [
                {
                    value: JSON.stringify(message)
                }
            ]
        })
    };

    const disconnect = async() =>{
        await producer.disconnect();
    };

    return{
        connect,
        send,
        disconnect
    }
}