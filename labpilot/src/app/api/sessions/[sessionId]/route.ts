import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeScores, difficultyMultiplier, levelForXp } from "@/lib/scoring";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = db.getSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  return NextResponse.json({ session });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const session = db.getSession(sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const body = await req.json();
  const { action } = body;

  switch (action) {
    case "step_complete": {
      const { stepIndex, mistakes = 0, hintsUsed = 0, timeSpentSec = 0, capturedImage, validationMethod } = body;
      const sr = session.stepResults[stepIndex];
      if (sr) {
        sr.completed = true;
        sr.mistakes = mistakes;
        sr.hintsUsed = hintsUsed;
        sr.timeSpentSec = timeSpentSec;
        if (capturedImage) sr.capturedImage = capturedImage;
        if (validationMethod) sr.validationMethod = validationMethod;
      }
      session.currentStep = Math.min(stepIndex + 1, session.totalSteps);
      session.totalMistakes = session.stepResults.reduce((s, r) => s + r.mistakes, 0);
      session.totalHints = session.stepResults.reduce((s, r) => s + r.hintsUsed, 0);
      db.saveSession(session);
      return NextResponse.json({ session });
    }

    case "add_mistake": {
      const sr = session.stepResults[body.stepIndex];
      if (sr) sr.mistakes += 1;
      session.totalMistakes = session.stepResults.reduce((s, r) => s + r.mistakes, 0);
      db.saveSession(session);
      return NextResponse.json({ ok: true });
    }

    case "add_hint": {
      const sr = session.stepResults[body.stepIndex];
      if (sr) sr.hintsUsed += 1;
      session.totalHints = session.stepResults.reduce((s, r) => s + r.hintsUsed, 0);
      db.saveSession(session);
      return NextResponse.json({ ok: true });
    }

    case "chat": {
      session.chatLog.push({ role: body.role || "student", text: body.text || "", at: new Date().toISOString() });
      db.saveSession(session);
      return NextResponse.json({ ok: true });
    }

    case "alert": {
      session.alerts.push({ severity: body.severity || "info", message: body.message || "", at: new Date().toISOString() });
      db.saveSession(session);
      return NextResponse.json({ ok: true });
    }

    case "complete":
    case "end": {
      const status = action === "complete" ? "completed" : (body.status || "abandoned");
      session.status = status;
      session.completedAt = new Date().toISOString();
      session.durationSec = body.durationSec ?? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000);

      const experiment = db.getExperiment(session.experimentId);
      const estMin = experiment?.estimatedMinutes || 20;

      const scores = computeScores({
        stepResults: session.stepResults,
        totalSteps: session.totalSteps,
        estimatedMinutes: estMin,
        durationSec: session.durationSec,
        alertCount: session.alerts.length,
        chatCount: session.chatLog.filter((c) => c.role === "student").length,
      });

      const mult = difficultyMultiplier(experiment?.difficulty || "beginner");
      const xpEarned = status === "completed" ? Math.round(scores.xpEarned * mult) : 0;

      session.scores = {
        understanding: scores.understanding,
        safety: scores.safety,
        engagement: scores.engagement,
        overall: scores.overall,
      };
      session.xpEarned = xpEarned;
      db.saveSession(session);

      if (status === "completed") {
        // Update assignment
        if (session.assignmentId) {
          const asg = db.getAssignments().find((a) => a.id === session.assignmentId);
          if (asg) {
            asg.status = "completed";
            db.saveAssignment(asg);
          }
        }
        // Award XP + update level/streak
        const student = db.getUser(session.studentId);
        if (student) {
          student.totalXp = (student.totalXp || 0) + xpEarned;
          student.level = levelForXp(student.totalXp);
          const today = new Date().toISOString().slice(0, 10);
          if (student.lastActiveDate !== today) {
            student.streakDays = (student.streakDays || 0) + 1;
            student.lastActiveDate = today;
          }
          db.saveUser(student);
        }
      }

      return NextResponse.json({ session });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
