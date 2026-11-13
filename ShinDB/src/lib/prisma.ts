import dns from "node:dns";
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {}
import { PrismaClient } from "@prisma/client";

// PrismaClient singleton instance for Next.js App Router
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
