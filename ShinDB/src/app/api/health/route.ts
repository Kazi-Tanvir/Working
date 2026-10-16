import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const startTime = Date.now();
  let dbStatus: "healthy" | "unhealthy" = "unhealthy";
  let dbLatencyMs: number | null = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = "healthy";
  } catch (error) {
    console.error("[HEALTH_CHECK_DB_ERROR]:", error);
    dbStatus = "unhealthy";
  }

  const testHeader = request.headers.get("x-test-allow-registration");
  const isRegistrationOpen = testHeader !== null
    ? testHeader === "true" || testHeader === "1"
    : process.env.ALLOW_REGISTRATION !== "false" && process.env.ALLOW_REGISTRATION !== "0";

  const isHealthy = dbStatus === "healthy";
  const payload = {
    status: isHealthy ? "ok" : "degraded",
    service: "shindb",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
    },
    registrationOpen: isRegistrationOpen,
    responseTimeMs: Date.now() - startTime,
  };

  return NextResponse.json(payload, { status: isHealthy ? 200 : 503 });
}
