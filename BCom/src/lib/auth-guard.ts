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

  let staffUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // JIT Auto-Sync: If user has valid staff role in Clerk metadata but not yet in DB
  const claimRole = (session.sessionClaims?.metadata as { role?: StaffRole } | undefined)?.role;

  if (!staffUser && claimRole && allowedRoles.includes(claimRole)) {
    try {
      staffUser = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {
          role: claimRole,
          isActive: true,
        },
        create: {
          clerkId: userId,
          email: `${userId}@clerk.user`,
          name: 'Staff Member',
          role: claimRole,
          isActive: true,
        },
      });
    } catch (e) {
      console.warn('JIT user provisioning fallback warning:', e);
    }
  }

  if (!staffUser || !staffUser.isActive || !allowedRoles.includes(staffUser.role)) {
    throw new Error('FORBIDDEN_403');
  }

  return staffUser;
}
