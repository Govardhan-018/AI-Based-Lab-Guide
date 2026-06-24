import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/users?role=student — list users (without passwords)
export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role");
  let users = db.getUsers();
  if (role) users = users.filter((u) => u.role === role);
  const safe = users.map(({ password, ...u }) => { void password; return u; });
  return NextResponse.json({ users: safe });
}
