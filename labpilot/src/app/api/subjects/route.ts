import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  return NextResponse.json({ subjects: db.getSubjects() });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "Subject name is required" }, { status: 400 });
  }
  const subject = db.saveSubject({
    id: body.id || `subj-${Date.now()}`,
    name: body.name,
    code: body.code || "",
    icon: body.icon || "◎",
    color: body.color || "#000000",
  });
  return NextResponse.json({ subject }, { status: 201 });
}
