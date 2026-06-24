import { NextRequest, NextResponse } from "next/server";
import { db, type Session, type StepResult } from "@/lib/db";

// GET /api/sessions?studentId=&experimentId=&filter=active
export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get("studentId");
  const experimentId = req.nextUrl.searchParams.get("experimentId");
  const filter = req.nextUrl.searchParams.get("filter");

  let sessions = db.getSessions();
  if (studentId) sessions = sessions.filter((s) => s.studentId === studentId);
  if (experimentId) sessions = sessions.filter((s) => s.experimentId === experimentId);
  if (filter === "active") sessions = sessions.filter((s) => s.status === "active");

  return NextResponse.json({ sessions });
}

// POST /api/sessions — start a session
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { studentId, experimentId, assignmentId } = body;

  const student = db.getUser(studentId);
  const experiment = db.getExperiment(experimentId);
  if (!student || !experiment) {
    return NextResponse.json({ error: "Student or experiment not found" }, { status: 404 });
  }

  const stepResults: StepResult[] = experiment.steps.map((s, i) => ({
    stepIndex: i,
    stepId: s.id,
    completed: false,
    mistakes: 0,
    hintsUsed: 0,
    timeSpentSec: 0,
  }));

  const session: Session = {
    id: `sess-${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    experimentId: experiment.id,
    experimentTitle: experiment.title,
    subjectId: experiment.subjectId,
    assignmentId,
    startedAt: new Date().toISOString(),
    status: "active",
    currentStep: 0,
    totalSteps: experiment.steps.length,
    stepResults,
    totalMistakes: 0,
    totalHints: 0,
    durationSec: 0,
    scores: { understanding: 0, safety: 100, engagement: 0, overall: 0 },
    xpEarned: 0,
    chatLog: [],
    alerts: [],
  };

  db.saveSession(session);

  // Mark assignment in progress
  if (assignmentId) {
    const asg = db.getAssignments().find((a) => a.id === assignmentId);
    if (asg && asg.status === "assigned") {
      asg.status = "in_progress";
      db.saveAssignment(asg);
    }
  }

  return NextResponse.json({ session }, { status: 201 });
}
