import {getAuth} from '@clerk/fastify'
import { FastifyRequest, FastifyReply } from 'fastify';
import type { CustomJWTSessionClaims } from '@repo/types';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string; // Add userId as an optional property to the request object
  }
}
export const shouldBeUser = async (request: FastifyRequest, reply: FastifyReply) => {
      const { userId } = getAuth(request);

  if (!userId) {
    return reply.status(401).send({ message: "You are not logged in" });
  }
    request.userId = userId; // Attach userId to the request object for later use

}

export const shouldBeAdmin  = async (request: FastifyRequest, reply: FastifyReply) => {
      const auth = getAuth(request);

  if (!auth.userId) {
    return reply.status(401).send({ message: "You are not logged in" });
  }
  const claims = auth.sessionClaims as CustomJWTSessionClaims;
  if(claims.metadata?.role !== "admin"){
    return reply.status(403).send({ message: "You are not an admin" });
  }
    request.userId = auth.userId; // Attach userId to the request object for later use

}