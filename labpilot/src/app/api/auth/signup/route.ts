import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { id, name, email, password, role } = await req.json();
  if (!id || !name || !password || !role) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (role !== "student" && role !== "teacher") {
    return NextResponse.json({ error: "Role must be student or teacher" }, { status: 400 });
  }
  const existing = db.getUser(String(id).trim().toLowerCase());
  if (existing) {
    return NextResponse.json({ error: "An account with this ID already exists" }, { status: 409 });
  }
  const user = db.saveUser({
    id: String(id).trim().toLowerCase(),
    name,
    email: email || "",
    role,
    password,
    ...(role === "student" ? { totalXp: 0, level: 1, streakDays: 0 } : {}),
  });
  const { password: _pw, ...safe } = user;
  void _pw;
  return NextResponse.json({ user: safe }, { status: 201 });
}
