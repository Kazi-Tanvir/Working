import React from "react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Console // ShinDB",
  description: "Administrative telemetry, user management, and catalog controls.",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-65px)] bg-black text-white font-mono">
      <AdminSidebar
        adminUser={{
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          customBadge: user.customBadge,
        }}
      />
      <main className="flex-1 overflow-x-hidden p-4 md:p-8 bg-[#0a0a0c]">
        {children}
      </main>
    </div>
  );
}
