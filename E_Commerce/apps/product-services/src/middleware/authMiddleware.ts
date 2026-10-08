import { NextFunction, Request, Response } from "express";
import { getAuth } from '@clerk/express'
import type { CustomJWTSessionClaims } from '@repo/types';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}

export const shouldBeUser = (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
        return res.status(401).json({ message: "You are not logged in" });
    }

    req.userId = auth.userId;
    return next();
}
export const shouldBeAdmin = (req: Request, res: Response, next: NextFunction) => {
    const auth = getAuth(req)
    const userId = auth.userId

    if (!userId) {
        return res.status(401).json({ message: "You are not logged in" });
    }
      const claims = auth.sessionClaims as CustomJWTSessionClaims;
      if(claims.metadata?.role !== "admin"){
        return res.status(403).send({ message: "You are not an admin" });
      }


    req.userId = auth.userId;
    return next();
}