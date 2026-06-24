"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Experiment, Session } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { ScoreRing } from "@/components/shared/score-ring";

export default function TeacherExperimentDetail() {
  const params = useParams();
  const { subjectId, experimentId } = params as { subjectId: string; experimentId: string };
  const [exp, setExp] = useState<Experiment | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch(`/api/experiments/${experimentId}`).then((r) => r.json()).then((d) => setExp(d.experiment || null));
    fetch(`/api/sessions?experimentId=${experimentId}`).then((r) => r.json()).then((d) => setSessions(d.sessions || []));
  }, [experimentId]);

  if (!exp) return <div className="p-8 text-neutral-400">Loading...</div>;

  const completed = sessions.filter((s) => s.status === "completed");
  const avgScore = completed.length ? Math.round(completed.reduce((a, s) => a + s.scores.overall, 0) / completed.length) : 0;

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`/teacher/subjects/${subjectId}`} className="text-sm text-neutral-400 hover:text-neutral-600 font-medium">← Back to Subject</Link>

      <div className="flex items-center gap-3 mt-4 mb-2">
        <h1 className="text-2xl font-bold">{exp.title}</h1>
        <DifficultyBadge level={exp.difficulty} />
        {exp.isPublished ? (
          <Badge variant="secondary" className="text-[11px] text-emerald-700 bg-emerald-50">Published</Badge>
        ) : <Badge variant="outline" className="text-[11px]">Draft</Badge>}
      </div>
      <p className="text-neutral-500 mb-8">{exp.description}</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{sessions.length}</p><p className="text-xs text-neutral-400">Runs</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-neutral-400">Completed</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{completed.length ? `${avgScore}%` : "—"}</p><p className="text-xs text-neutral-400">Avg Score</p></Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card className="p-5">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-neutral-400">Theory</h3>
          <p className="text-sm leading-relaxed">{exp.theory}</p>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50/50">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-amber-700">Safety Rules</h3>
          <ul className="space-y-2">
            {exp.safetyRules.map((r, i) => <li key={i} className="text-sm text-amber-800">• {r}</li>)}
          </ul>
        </Card>
      </div>

      <h2 className="text-lg font-bold mb-4">Procedure ({exp.steps.length} steps)</h2>
      <div className="space-y-3 mb-8">
        {exp.steps.map((s, i) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="text-sm text-neutral-600 mt-0.5">{s.instruction}</p>
                {s.expectedObservation && <p className="text-xs text-blue-600 mt-1">Expected: {s.expectedObservation}</p>}
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{s.verificationType}</Badge>
                  {s.hints.length > 0 && <Badge variant="secondary" className="text-[10px]">{s.hints.length} hints</Badge>}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">Student Runs</h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-neutral-400">No students have run this experiment yet.</p>
      ) : (
        <div className="space-y-3">
          {[...sessions].reverse().map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{s.studentName}</p>
                <p className="text-xs text-neutral-400">{new Date(s.startedAt).toLocaleString()} · {s.totalMistakes} mistakes · {s.totalHints} hints</p>
              </div>
              <div className="flex items-center gap-3">
                {s.status === "completed" ? <ScoreRing score={s.scores.overall} size={40} strokeWidth={4} /> : <Badge variant="outline" className="text-[11px] capitalize">{s.status}</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
