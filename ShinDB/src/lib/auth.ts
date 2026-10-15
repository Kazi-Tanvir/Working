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

// ----------------------------------------------------
// Cookie & Session Resolvers
// ----------------------------------------------------
export async function getSessionUser(): Promise<SafeUser | null> {
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
}

export async function getUserFromRequest(request: Request): Promise<SafeUser | null> {
  try {
    // 1. Check Authorization header (Bearer token)
    const authHeader = request.headers.get("authorization");
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // 2. Fallback to Cookie header
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
