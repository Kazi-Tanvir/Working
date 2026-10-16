import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const actionFilter = searchParams.get("action");
  const userIdFilter = searchParams.get("userId");
  const query = searchParams.get("q")?.trim() || "";

  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (actionFilter) {
    whereClause.action = actionFilter;
  }
  if (userIdFilter) {
    whereClause.userId = userIdFilter;
  }
  if (query) {
    whereClause.OR = [
      { action: { contains: query } },
      { target: { contains: query } },
      { userId: { contains: query } },
    ];
  }

  try {
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    // Fetch user details for those logs that have userId
    const userIds = Array.from(
      new Set(logs.map((l) => l.userId).filter(Boolean) as string[])
    );

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      target: log.target,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
      user: log.userId ? userMap.get(log.userId) || { id: log.userId, username: "unknown" } : null,
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_AUDIT_LOG_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to retrieve security audit trail" },
      { status: 500 }
    );
  }
}
