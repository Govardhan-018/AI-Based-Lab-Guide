"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/**
 * Client-side route guard. Redirects to /login if no user, or to the correct
 * dashboard if the logged-in user's role doesn't match the required role.
 */
export function AuthGuard({ role, children }: { role: "student" | "teacher"; children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/");
      return;
    }
    if (user.role !== role) {
      // Teacher can view instructor/live pages; otherwise bounce to own dashboard.
      router.replace(user.role === "teacher" ? "/teacher" : "/student");
      return;
    }
    setOk(true);
  }, [role, router]);

  if (!ok) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
