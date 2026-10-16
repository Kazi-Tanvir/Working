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
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  const query = searchParams.get("q")?.trim() || "";
  const roleFilter = searchParams.get("role");

  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { username: { contains: query } },
      { email: { contains: query } },
      { displayName: { contains: query } },
    ];
  }
  if (roleFilter === "admin" || roleFilter === "user") {
    whereClause.role = roleFilter;
  }

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          customBadge: true,
          role: true,
          authProvider: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              library: true,
              sentFriendships: { where: { status: "accepted" } },
              receivedFriendships: { where: { status: "accepted" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      bio: u.bio,
      customBadge: u.customBadge,
      role: u.role,
      authProvider: u.authProvider,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      entriesCount: u._count.library,
      friendsCount: u._count.sentFriendships + u._count.receivedFriendships,
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[ADMIN_USERS_GET_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to fetch user directory" },
      { status: 500 }
    );
  }
}
