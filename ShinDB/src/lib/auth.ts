import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACCESS_COOKIE_NAME = "shindb_access_token";
export const REFRESH_COOKIE_NAME = "shindb_refresh_token";
export const GOOGLE_ONBOARDING_COOKIE = "shindb_google_onboarding";

const JWT_SECRET = process.env.JWT_SECRET || "shindb_cyber_neobrutalist_secret_key_2026_dev_seed";
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  type: "access" | "refresh";
}

export interface GoogleOnboardingPayload {
  email: string;
  name: string;
  avatarUrl: string | null;
  providerId: string;
  type: "google_onboarding";
}

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  customBadge: string | null;
  authProvider: string;
  createdAt: Date;
}

// ----------------------------------------------------
// Password Helpers
// ----------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ----------------------------------------------------
// JWT Helpers using jose (Edge & Node compatible)
// ----------------------------------------------------
export async function signAccessToken(user: {
  id: string;
  username: string;
  email: string;
  displayName: string;
}): Promise<string> {
  return new SignJWT({
    userId: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    type: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encodedKey);
}

export async function signRefreshToken(user: {
  id: string;
  username: string;
  email: string;
  displayName: string;
}): Promise<string> {
  return new SignJWT({
    userId: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    type: "refresh",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedKey);
}

export async function signGoogleOnboardingToken(data: {
  email: string;
  name: string;
  avatarUrl: string | null;
  providerId: string;
}): Promise<string> {
  return new SignJWT({
    ...data,
    type: "google_onboarding",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("20m")
    .sign(encodedKey);
}

export async function verifyGoogleOnboardingToken(
  token: string
): Promise<GoogleOnboardingPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    if (payload.type !== "google_onboarding") return null;
    return payload as unknown as GoogleOnboardingPayload;
  } catch {
    return null;
  }
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

import { currentUser, auth } from "@clerk/nextjs/server";
import { cache } from "react";

// Fast in-memory cache for user sessions to prevent repeated external network calls
const userCache = new Map<string, { user: SafeUser; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export function invalidateUserCache(userId?: string) {
  if (userId) {
    userCache.delete(userId);
  } else {
    userCache.clear();
  }
}

// ----------------------------------------------------
// Clerk & Prisma User Synchronization
// ----------------------------------------------------
export async function syncClerkUserWithPrisma(clerkUser: any): Promise<SafeUser | null> {
  if (!clerkUser) return null;

  const clerkId = clerkUser.id;
  const primaryEmail = clerkUser.emailAddresses?.[0]?.emailAddress;
  const username =
    clerkUser.username ||
    (primaryEmail ? primaryEmail.split("@")[0] : `user_${clerkId.slice(-6)}`);
  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || username;
  const avatarUrl = clerkUser.imageUrl || null;

  try {
    // 1. Search for existing user with clerkId or email
    let user = await (prisma.user as any).findFirst({
      where: {
        OR: [
          { clerkId },
          ...(primaryEmail ? [{ email: primaryEmail }] : []),
        ],
      },
    });

    if (!user) {
      // Create user in database
      let finalUsername = username;
      const existingUsername = await (prisma.user as any).findUnique({
        where: { username: finalUsername },
      });
      if (existingUsername) {
        finalUsername = `${username}_${Math.floor(Math.random() * 8999 + 1000)}`;
      }

      user = await (prisma.user as any).create({
        data: {
          username: finalUsername,
          email: primaryEmail || `${clerkId}@clerk.shindb.internal`,
          clerkId: clerkId,
          displayName: displayName,
          avatarUrl: avatarUrl,
          authProvider: "clerk",
          customBadge: "[SYS_OPERATOR::RECRUIT]",
        },
      });
    } else if (!user.clerkId || user.clerkId !== clerkId) {
      // Link clerkId if not yet linked
      user = await (prisma.user as any).update({
        where: { id: user.id },
        data: {
          clerkId: clerkId,
          authProvider: user.authProvider === "email" ? "clerk" : user.authProvider,
        },
      });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      customBadge: user.customBadge,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };
  } catch (err) {
    console.error("[AUTH] Error syncing Clerk user with Prisma:", err);
    return null;
  }
}

export async function resolveClerkUser(userId: string): Promise<SafeUser | null> {
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.user;
  }

  // 1. Fast local Prisma DB check (~1ms query, NO Clerk API round-trip)
  try {
    const user = await (prisma.user as any).findFirst({
      where: { clerkId: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        customBadge: true,
        authProvider: true,
        createdAt: true,
      },
    });

    if (user) {
      userCache.set(userId, { user, expiresAt: Date.now() + CACHE_TTL_MS });
      return user;
    }
  } catch (err) {
    console.error("[AUTH] Error checking local Prisma user by clerkId:", err);
  }

  // 2. Only if not yet in local DB, fetch from Clerk API for initial profile sync
  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      const syncedUser = await syncClerkUserWithPrisma(clerkUser);
      if (syncedUser) {
        userCache.set(userId, { user: syncedUser, expiresAt: Date.now() + CACHE_TTL_MS });
        return syncedUser;
      }
    }
  } catch (err) {
    console.error("[AUTH] Error during first-time Clerk user sync:", err);
  }

  return null;
}

// ----------------------------------------------------
// Cookie & Session Resolvers
// ----------------------------------------------------
export const getSessionUser = cache(async function getSessionUser(): Promise<SafeUser | null> {
  // 1. Fast local check via auth() (JWT verification only, 0ms network time)
  try {
    const { userId } = await auth();
    if (userId) {
      const user = await resolveClerkUser(userId);
      if (user) return user;
    }
  } catch {
    // Fall back to legacy token check if Clerk is not active
  }

  // 2. Legacy JWT cookie session fallback
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || payload.type !== "access") return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        customBadge: true,
        authProvider: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    console.error("[AUTH] Failed to get session user:", err);
    return null;
  }
});

export async function getUserFromRequest(request: Request): Promise<SafeUser | null> {
  // 1. Fast local check via auth() (JWT verification only, 0ms network time)
  try {
    const { userId } = await auth();
    if (userId) {
      const user = await resolveClerkUser(userId);
      if (user) return user;
    }
  } catch {
    // Fall back to legacy header/cookie check
  }

  // 2. Fallback to Bearer token or legacy Cookie
  try {
    const authHeader = request.headers.get("authorization");
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    if (!token) {
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(new RegExp(`(?:^|; )${ACCESS_COOKIE_NAME}=([^;]*)`));
        if (match) {
          token = decodeURIComponent(match[1]);
        }
      }
    }

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || payload.type !== "access") return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        customBadge: true,
        authProvider: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    console.error("[AUTH] Failed to get user from request:", err);
    return null;
  }
}
