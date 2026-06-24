import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/live — snapshot of active sessions for the live monitor (reads real db).
export async function GET() {
  const sessions = db.getSessions().filter((s) => s.status === "active");
  const alerts = sessions.flatMap((s) =>
    s.alerts.map((a, i) => ({
      id: `${s.id}-${i}`,
      sessionId: s.id,
      studentId: s.studentId,
      studentName: s.studentName,
      severity: a.severity,
      message: a.message,
      timestamp: a.at,
    }))
  );

  return NextResponse.json({
    activeSessions: sessions.length,
    studentsInLab: sessions.length,
    openAlerts: alerts.length,
    avgSafetyScore: sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + s.scores.safety, 0) / sessions.length)
      : 100,
    sessions,
    alerts,
  });
}
