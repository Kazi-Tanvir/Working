import { NextResponse } from "next/server";
import { getUserFromRequest, SafeUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function isAdmin(request: Request): Promise<boolean> {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return false;
    return user.role === "admin";
  } catch {
    return false;
  }
}

export type AdminAuthResult =
  | { authorized: true; user: SafeUser }
  | { authorized: false; response: NextResponse };

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Authentication required to access admin operations" },
          { status: 401 }
        ),
      };
    }

    if (user.role !== "admin") {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Administrative privileges required" },
          { status: 403 }
        ),
      };
    }

    return { authorized: true, user };
  } catch (error) {
    console.error("[ADMIN_AUTH_ERROR]:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Internal security authorization failure" },
        { status: 500 }
      ),
    };
  }
}

export async function logAuditEvent(params: {
  userId?: string | null;
  action: string;
  target?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        target: params.target || null,
        details: params.details ? (params.details as any) : undefined,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Failed to record audit event:", error);
  }
}
