import { NextRequest, NextResponse } from "next/server";
import { db, type Experiment } from "@/lib/db";

// GET /api/experiments?subjectId=&createdBy=
export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const createdBy = req.nextUrl.searchParams.get("createdBy");
  let exps = db.getExperiments();
  if (subjectId) exps = exps.filter((e) => e.subjectId === subjectId);
  if (createdBy) exps = exps.filter((e) => e.createdBy === createdBy);
  return NextResponse.json({ experiments: exps });
}

// POST /api/experiments — create a new experiment
export async function POST(req: NextRequest) {
  const body = await req.json();

  const subjects = db.getSubjects();
  const subject = subjects.find((s) => s.id === body.subjectId) || subjects[0];

  const exp: Experiment = {
    id: body.id || `exp-${Date.now()}`,
    title: body.title || "Untitled Experiment",
    subjectId: subject.id,
    subjectName: subject.name,
    description: body.description || "",
    difficulty: body.difficulty || "beginner",
    estimatedMinutes: Number(body.estimatedMinutes) || 20,
    purpose: body.purpose || "",
    theory: body.theory || "",
    learningObjectives: body.learningObjectives || [],
    materials: body.materials || [],
    safetyRules: body.safetyRules || [],
    steps: (body.steps || []).map((s: Record<string, unknown>, i: number) => ({
      id: (s.id as string) || `step_${i + 1}`,
      title: (s.title as string) || `Step ${i + 1}`,
      instruction: (s.instruction as string) || "",
      whyItWorks: (s.whyItWorks as string) || "",
      expectedObservation: (s.expectedObservation as string) || "",
      safetyNotes: (s.safetyNotes as string[]) || [],
      hints: (s.hints as string[]) || [],
      commonErrors: (s.commonErrors as string[]) || [],
      verificationType: (s.verificationType as string) || "camera",
      testTubeNumber: s.testTubeNumber != null ? Number(s.testTubeNumber) : undefined,
      testTubeName: (s.testTubeName as string) || "",
      testTubeColor: (s.testTubeColor as string) || undefined,
      colorValidation: s.colorValidation || undefined,
      valueValidation: s.valueValidation || undefined,
    })),
    calculations: body.calculations || undefined,
    createdBy: body.createdBy || "teacher",
    createdAt: new Date().toISOString().slice(0, 10),
    isPublished: body.isPublished ?? true,
  };

  db.saveExperiment(exp);
  return NextResponse.json({ experiment: exp }, { status: 201 });
}
