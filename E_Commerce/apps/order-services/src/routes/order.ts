import fastify, { FastifyInstance } from "fastify";
import { shouldBeUser , shouldBeAdmin } from "../middleware/authMiddleware";
import { Order } from "@repo/order-db";

export const orderRoute = async (fastify: FastifyInstance) => {
    fastify.get('/user-orders', { preHandler: shouldBeUser }, async (request, reply) => {
        const order = await Order.find({ userId: request.userId });
        reply.send(order);
    }
    );
    fastify.get('/orders', { preHandler: shouldBeAdmin }, async (request, reply) => {       
        const order = await Order.find();
        reply.send(order);
    }
    );
};