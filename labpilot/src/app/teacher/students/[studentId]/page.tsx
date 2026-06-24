"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Session } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/score-ring";

interface Student { id: string; name: string; email: string; totalXp?: number; level?: number; streakDays?: number }

export default function TeacherStudentDetail() {
  const params = useParams();
  const studentId = params.studentId as string;
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users?role=student").then((r) => r.json()).then((d) => {
      setStudent((d.users || []).find((u: Student) => u.id === studentId) || null);
    });
    fetch(`/api/sessions?studentId=${studentId}`).then((r) => r.json()).then((d) => setSessions(d.sessions || []));
  }, [studentId]);

  if (!student) return <div className="p-8 text-neutral-400">Loading...</div>;

  const completed = sessions.filter((s) => s.status === "completed");
  const totalMistakes = sessions.reduce((a, s) => a + s.totalMistakes, 0);
  const avg = (key: "understanding" | "safety" | "engagement" | "overall") =>
    completed.length ? Math.round(completed.reduce((a, s) => a + s.scores[key], 0) / completed.length) : 0;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/teacher/students" className="text-sm text-neutral-400 hover:text-neutral-600 font-medium">← Back to Students</Link>

      <div className="flex items-center gap-4 mt-4 mb-8">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center text-xl font-bold">
          {student.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{student.name}</h1>
          <p className="text-sm text-neutral-500 font-mono">{student.id} · {student.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{(student.totalXp || 0).toLocaleString()}</p><p className="text-xs text-neutral-400 mt-1">Total XP</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">Lvl {student.level || 1}</p><p className="text-xs text-neutral-400 mt-1">Level</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-neutral-400 mt-1">Completed</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{totalMistakes}</p><p className="text-xs text-neutral-400 mt-1">Total Mistakes</p></Card>
      </div>

      {completed.length > 0 && (
        <Card className="p-6 mb-8">
          <h3 className="font-bold mb-4">Average Skill Breakdown</h3>
          <div className="grid grid-cols-4 gap-6">
            {(["understanding", "safety", "engagement", "overall"] as const).map((k) => (
              <div key={k} className="text-center">
                <ScoreRing score={avg(k)} size={64} strokeWidth={5} />
                <p className="text-xs text-neutral-500 mt-1 capitalize">{k}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="text-lg font-bold mb-4">Session History & Mistakes</h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-neutral-400">No sessions yet.</p>
      ) : (
        <div className="space-y-3">
          {[...sessions].reverse().map((s) => (
            <Card key={s.id} className="p-4">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                <div>
                  <p className="text-sm font-semibold">{s.experimentTitle}</p>
                  <p className="text-xs text-neutral-400">
                    {new Date(s.startedAt).toLocaleString()} · {s.totalMistakes} mistakes · {s.totalHints} hints · {Math.round(s.durationSec / 60)}m
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {s.status === "completed" ? (
                    <ScoreRing score={s.scores.overall} size={40} strokeWidth={4} />
                  ) : (
                    <Badge variant="outline" className="text-[11px] capitalize">{s.status}</Badge>
                  )}
                  <span className="text-neutral-300 text-xs">{expanded === s.id ? "▲" : "▼"}</span>
                </div>
              </div>

              {expanded === s.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  {s.status === "completed" && (
                    <div className="flex gap-6 text-xs">
                      <span>Understanding: <b>{s.scores.understanding}</b></span>
                      <span>Safety: <b>{s.scores.safety}</b></span>
                      <span>Engagement: <b>{s.scores.engagement}</b></span>
                      <span>XP: <b>+{s.xpEarned}</b></span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 mb-1.5">PER-STEP BREAKDOWN</p>
                    <div className="space-y-1">
                      {s.stepResults.map((r) => (
                        <div key={r.stepIndex} className="bg-neutral-50 rounded-lg px-3 py-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span>{r.completed ? "✓" : "○"} Step {r.stepIndex + 1}
                              {r.validationMethod && <span className="ml-1.5 text-violet-500 text-[10px]">({r.validationMethod.replace("_", " ")})</span>}
                            </span>
                            <span className="text-neutral-500">
                              {r.mistakes > 0 && <span className="text-red-500 mr-3">{r.mistakes} mistake{r.mistakes > 1 ? "s" : ""}</span>}
                              {r.hintsUsed > 0 && <span className="text-amber-600 mr-3">{r.hintsUsed} hint{r.hintsUsed > 1 ? "s" : ""}</span>}
                              <span>{r.timeSpentSec}s</span>
                            </span>
                          </div>
                          {r.capturedImage && (
                            <div className="mt-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={String(r.capturedImage)} alt={`Step ${r.stepIndex + 1} capture`} className="w-32 h-24 object-cover rounded border" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {s.alerts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-500 mb-1.5">SAFETY ALERTS</p>
                      {s.alerts.map((a, i) => (
                        <p key={i} className="text-xs text-red-700">• [{a.severity}] {a.message}</p>
                      ))}
                    </div>
                  )}
                  {s.chatLog.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-neutral-400 mb-1.5">QUESTIONS ASKED ({s.chatLog.filter((c) => c.role === "student").length})</p>
                      {s.chatLog.filter((c) => c.role === "student").map((c, i) => (
                        <p key={i} className="text-xs text-neutral-600">“{c.text}”</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
