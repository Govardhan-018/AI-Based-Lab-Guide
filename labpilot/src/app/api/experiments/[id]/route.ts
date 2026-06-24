import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exp = db.getExperiment(id);
  if (!exp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ experiment: exp });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = db.getExperiment(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = { ...existing, ...body, id };
  db.saveExperiment(updated);
  return NextResponse.json({ experiment: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  db.deleteExperiment(id);
  return NextResponse.json({ ok: true });
}
