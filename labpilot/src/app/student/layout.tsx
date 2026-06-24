"use client";

import { Sidebar } from "@/components/layouts/sidebar";
import { AuthGuard } from "@/components/layouts/auth-guard";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard role="student">
      <div className="flex h-screen bg-neutral-50">
        <Sidebar role="student" />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </AuthGuard>
  );
}
