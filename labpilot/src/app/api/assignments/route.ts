import { NextRequest, NextResponse } from "next/server";
import { db, type Assignment } from "@/lib/db";

// GET /api/assignments?studentId=&experimentId=
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const experimentId = req.nextUrl.searchParams.get("experimentId");
  let all = db.getAssignments();
  if (studentId) all = all.filter((a) => a.studentId === studentId);
  if (experimentId) all = all.filter((a) => a.experimentId === experimentId);

  // Enrich with experiment + student details
  const enriched = all.map((a) => {
    const exp = db.getExperiment(a.experimentId);
    const student = db.getUser(a.studentId);
    return {
      ...a,
      experimentTitle: exp?.title || "Unknown",
      experimentDifficulty: exp?.difficulty,
      estimatedMinutes: exp?.estimatedMinutes,
      subjectId: exp?.subjectId,
      studentName: student?.name || a.studentId,
    };
  });

  return NextResponse.json({ assignments: enriched });
}

// POST /api/assignments — assign an experiment to a student
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { experimentId, studentId, assignedBy, dueDate } = body;

  if (!experimentId || !studentId) {
    return NextResponse.json({ error: "experimentId and studentId required" }, { status: 400 });
  }
  if (!db.getExperiment(experimentId)) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }
  if (!db.getUser(studentId)) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Avoid duplicate active assignments
  const existing = db.getAssignments().find(
    (a) => a.experimentId === experimentId && a.studentId === studentId && a.status !== "completed"
  );
  if (existing) {
    return NextResponse.json({ assignment: existing, duplicate: true });
  }

  const assignment: Assignment = {
    id: `asg-${Date.now()}`,
    experimentId,
    studentId,
    assignedBy: assignedBy || "teacher",
    assignedAt: new Date().toISOString().slice(0, 10),
    dueDate,
    status: "assigned",
  };
  db.saveAssignment(assignment);
  return NextResponse.json({ assignment }, { status: 201 });
}
