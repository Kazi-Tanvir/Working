import Fastify from "fastify";
import { clerkPlugin, getAuth } from "@clerk/fastify";
import { shouldBeUser } from "./middleware/authMiddleware";
import { connectOrderDB } from "@repo/order-db";
import { orderRoute } from "./routes/order";
import { producer,consumer } from "./utils/kafka";

const fastify = Fastify();
fastify.register(clerkPlugin);

fastify.post("/", (request, reply) => {
  reply.send("Order service received a request");
});

fastify.get("/test", { preHandler: shouldBeUser }, async (request, reply) => {

  console.log("Auth info in order service:", request.userId);
  return reply.send({ message: "Order service test endpoint", userId: request.userId });
});

fastify.register(orderRoute);

const start = async () => {
  try {
    Promise.all([
      await connectOrderDB(),
      await producer.connect(),
      await consumer.connect()
      ]
    )
    await fastify.listen({ port: 8001 })
    console.log("Order service is running on port 8001")
  } catch (err) {
    console.log(err)
    process.exit(1) 
  }
}
start()