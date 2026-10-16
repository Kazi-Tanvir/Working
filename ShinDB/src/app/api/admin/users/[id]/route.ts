import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAuditEvent } from "@/lib/admin";
import { invalidateUserCache } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
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
        clerkId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            library: true,
            sentFriendships: true,
            receivedFriendships: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [entriesByType, entriesByStatus, recentEntries] = await Promise.all([
      prisma.userMediaEntry.groupBy({
        by: ["status"],
        where: { userId: id },
        _count: { id: true },
      }),
      prisma.media.groupBy({
        by: ["type"],
        where: { userEntries: { some: { userId: id } } },
        _count: { id: true },
      }),
      prisma.userMediaEntry.findMany({
        where: { userId: id },
        include: {
          media: {
            select: {
              id: true,
              title: true,
              type: true,
              coverImage: true,
              releaseYear: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      user,
      stats: {
        byStatus: entriesByType.reduce((acc, curr) => {
          acc[curr.status] = curr._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: entriesByStatus.reduce((acc, curr) => {
          acc[curr.type] = curr._count.id;
          return acc;
        }, {} as Record<string, number>),
        recentEntries: recentEntries.map((e) => ({
          id: e.id,
          mediaId: e.mediaId,
          title: e.media.title,
          type: e.media.type,
          coverImage: e.media.coverImage,
          status: e.status,
          rating: e.rating,
          progressCurrent: e.progressCurrent,
          updatedAt: e.updatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("[ADMIN_USER_GET_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to load user profile" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { role, customBadge, displayName, bio } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (role === "admin" || role === "user") {
      updateData.role = role;
    }
    if (typeof customBadge === "string") {
      updateData.customBadge = customBadge;
    }
    if (typeof displayName === "string" && displayName.trim().length > 0) {
      updateData.displayName = displayName.trim();
    }
    if (typeof bio === "string") {
      updateData.bio = bio;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
      },
    });

    invalidateUserCache(id);
    if (existing.clerkId) {
      invalidateUserCache(existing.clerkId);
    }

    await logAuditEvent({
      userId: authCheck.user.id,
      action: "admin.user.update",
      target: `user:${id}`,
      details: {
        updatedFields: Object.keys(updateData),
        previousRole: existing.role,
        newRole: updatedUser.role,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: "User security credentials and attributes updated",
    });
  } catch (error) {
    console.error("[ADMIN_USER_PUT_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to update user records" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(request);
  if (!authCheck.authorized) {
    return authCheck.response;
  }

  const { id } = await params;

  if (id === authCheck.user.id) {
    return NextResponse.json(
      { error: "Self-deletion prohibited. Cannot terminate current active admin session." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, email: true, clerkId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    invalidateUserCache(id);
    if (existing.clerkId) {
      invalidateUserCache(existing.clerkId);
    }

    await logAuditEvent({
      userId: authCheck.user.id,
      action: "admin.user.delete",
      target: `user:${id}`,
      details: {
        username: existing.username,
        email: existing.email,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User ${existing.username} purged completely from database with cascades.`,
    });
  } catch (error) {
    console.error("[ADMIN_USER_DELETE_ERROR]:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
