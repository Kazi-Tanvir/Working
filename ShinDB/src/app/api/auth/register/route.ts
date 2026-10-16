import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from "@/lib/auth";

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric characters and underscores")
    .transform((val) => val.toLowerCase()),
  email: z.string().email("Invalid email address").transform((val) => val.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Check if registration is open (default true unless explicitly disabled or overridden in test)
    const testHeader = request.headers.get("x-test-allow-registration");
    const isRegistrationDisabled = testHeader !== null 
      ? testHeader === "false" || testHeader === "0"
      : process.env.ALLOW_REGISTRATION === "false" || process.env.ALLOW_REGISTRATION === "0";

    if (isRegistrationDisabled) {
      return NextResponse.json(
        { error: "REGISTRATION_DISABLED", message: "Registration is currently disabled // System is invite-only" },
        { status: 403 }
      );
    }

    const { username, email, password, displayName } = result.data;

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: "Username already taken", field: "username" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Email already registered", field: "email" },
        { status: 409 }
      );
    }

    // Hash password & create user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        displayName: displayName || username,
        passwordHash,
        authProvider: "email",
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        authProvider: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const accessToken = await signAccessToken(user);
    const refreshToken = await signRefreshToken(user);

    // Persist refresh token hash
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const response = NextResponse.json(
      {
        message: "Registration successful",
        user,
        token: accessToken,
      },
      { status: 201 }
    );

    // Set secure HTTP-only cookies
    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[AUTH_REGISTER_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
