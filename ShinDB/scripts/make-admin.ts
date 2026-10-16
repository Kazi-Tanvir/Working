import { prisma } from "../src/lib/prisma";

async function main() {
  const clerkId = "user_3KjvBQvoVMGS9aJICGSqGBIHqRP";
  const email = "notjohanliebert7780@gmail.com";

  console.log("Searching for user with clerkId:", clerkId, "or email:", email);

  // 1. Check existing user in Prisma DB
  let user = await (prisma.user as any).findFirst({
    where: {
      OR: [
        { clerkId: clerkId },
        { email: email },
      ],
    },
  });

  if (user) {
    console.log("Found existing user in DB:", {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      clerkId: user.clerkId,
      customBadge: user.customBadge,
    });

    // Update user to admin
    const updated = await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        role: "admin",
        clerkId: clerkId,
        customBadge: user.customBadge === "[SYS_OPERATOR::RECRUIT]" || !user.customBadge ? "[SYS_OPERATOR::ADMIN]" : user.customBadge,
      },
    });

    console.log("Successfully updated user to admin in DB:", {
      id: updated.id,
      username: updated.username,
      email: updated.email,
      role: updated.role,
      clerkId: updated.clerkId,
      customBadge: updated.customBadge,
    });
  } else {
    console.log("User not found in DB. Creating user in Prisma DB directly...");
    const username = email.split("@")[0];
    const created = await (prisma.user as any).create({
      data: {
        username: username,
        email: email,
        clerkId: clerkId,
        displayName: username,
        role: "admin",
        authProvider: "clerk",
        customBadge: "[SYS_OPERATOR::ADMIN]",
      },
    });

    console.log("Successfully created user as admin in DB:", {
      id: created.id,
      username: created.username,
      email: created.email,
      role: created.role,
      clerkId: created.clerkId,
      customBadge: created.customBadge,
    });
  }

  // 2. Also update Clerk publicMetadata via Clerk API using CLERK_SECRET_KEY
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (clerkSecretKey) {
    console.log("Updating Clerk user publicMetadata via Clerk REST API...");
    try {
      const res = await fetch(`https://api.clerk.com/v1/users/${clerkId}/metadata`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${clerkSecretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_metadata: {
            role: "admin",
          },
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Clerk API update failed:", res.status, errorText);
      } else {
        const clerkUser = await res.json();
        console.log("Successfully updated Clerk user metadata:", clerkUser.public_metadata);
      }
    } catch (err) {
      console.error("Error updating Clerk API:", err);
    }
  } else {
    console.warn("CLERK_SECRET_KEY not found in environment.");
  }
}

main()
  .catch((e) => {
    console.error("Error running make-admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
