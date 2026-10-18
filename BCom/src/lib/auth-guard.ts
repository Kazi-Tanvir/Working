// src/lib/auth-guard.ts
// Fail-Closed Staff Authorization Guard for Route Handlers and Server Components

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { StaffRole } from '@prisma/client';

export async function requireStaffRole(allowedRoles: StaffRole[]) {
  const session = await auth();
  const userId = session.userId;

  if (!userId) {
    throw new Error('UNAUTHORIZED_401');
  }

  const staffUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!staffUser || !staffUser.isActive || !allowedRoles.includes(staffUser.role)) {
    throw new Error('FORBIDDEN_403');
  }

  return staffUser;
}
