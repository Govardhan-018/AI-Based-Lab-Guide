import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/auth/login — { id, password }
export async function POST(req: NextRequest) {
  const { id, password } = await req.json();
  if (!id || !password) {
    return NextResponse.json({ error: "ID and password required" }, { status: 400 });
  }

  const user = db.getUser(String(id).trim().toLowerCase());
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid ID or password" }, { status: 401 });
  }

  // Return a safe user object (no password)
  const { password: _pw, ...safe } = user;
  void _pw;
  return NextResponse.json({ user: safe });
}
