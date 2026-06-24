"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Experiment, Session } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

interface Subject { id: string; name: string; code: string; icon: string; color: string }
interface Student { id: string; name: string; email: string }

export default function TeacherSubjectPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignFor, setAssignFor] = useState<Experiment | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    fetch("/api/subjects").then((r) => r.json()).then((d) => {
      setSubject((d.subjects || []).find((s: Subject) => s.id === subjectId) || null);
    });
    fetch(`/api/experiments?subjectId=${subjectId}`).then((r) => r.json()).then((d) => setExperiments(d.experiments || []));
    fetch(`/api/sessions`).then((r) => r.json()).then((d) => setSessions((d.sessions || []).filter((s: Session) => s.subjectId === subjectId)));
    fetch(`/api/users?role=student`).then((r) => r.json()).then((d) => setStudents(d.users || []));
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  async function assign(experimentId: string, studentId: string) {
    const resp = await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experimentId, studentId, assignedBy: "teacher" }),
    });
    const data = await resp.json();
    setToast(data.duplicate ? "Already assigned to that student." : "Assigned ✓");
    setTimeout(() => setToast(""), 2500);
  }

  if (!subject) return <div className="p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/teacher/subjects" className="text-sm text-neutral-400 hover:text-neutral-600 font-medium">
        ← Back to Subjects
      </Link>

      <div className="flex items-center justify-between mt-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: subject.color + "15" }}>
            {subject.icon}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{subject.name}</h1>
            <p className="text-sm text-neutral-500">{subject.code}</p>
          </div>
        </div>
        <Link href={`/teacher/subjects/${subjectId}/experiments/new`}>
          <Button>+ Add Experiment</Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-5 text-center">
          <p className="text-2xl font-bold">{experiments.length}</p>
          <p className="text-xs text-neutral-400">Experiments</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-2xl font-bold">{students.length}</p>
          <p className="text-xs text-neutral-400">Students</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-2xl font-bold">{sessions.length}</p>
          <p className="text-xs text-neutral-400">Sessions Run</p>
        </Card>
      </div>

      <h2 className="text-lg font-bold mb-4">Experiments</h2>
      <div className="space-y-3 mb-8">
        {experiments.map((exp) => (
          <Card key={exp.id} className="p-5">
            <div className="flex items-start justify-between">
              <Link href={`/teacher/subjects/${subjectId}/experiments/${exp.id}`} className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold hover:underline">{exp.title}</h3>
                  <DifficultyBadge level={exp.difficulty} />
                  {exp.isPublished ? (
                    <Badge variant="secondary" className="text-[11px] text-emerald-700 bg-emerald-50">Published</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px]">Draft</Badge>
                  )}
                </div>
                <p className="text-sm text-neutral-500 line-clamp-1">{exp.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                  <span>{exp.estimatedMinutes} min</span>
                  <span>{exp.steps.length} steps</span>
                  <span>Created {exp.createdAt}</span>
                </div>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setAssignFor(exp)}>Assign →</Button>
            </div>
          </Card>
        ))}
        {experiments.length === 0 && (
          <Card className="p-8 text-center text-neutral-400"><p>No experiments yet. Create your first one!</p></Card>
        )}
      </div>

      <h2 className="text-lg font-bold mb-4">Recent Sessions</h2>
      {sessions.length === 0 ? (
        <p className="text-sm text-neutral-400">No sessions run yet.</p>
      ) : (
        <div className="space-y-3">
          {[...sessions].reverse().slice(0, 6).map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{s.experimentTitle}</p>
                <p className="text-xs text-neutral-400">{s.studentName} · {new Date(s.startedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                {s.status === "completed" && <span className="text-sm font-bold">{s.scores.overall}%</span>}
                <Badge variant="outline" className="text-[11px] capitalize">{s.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assign dialog */}
      {assignFor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6" onClick={() => setAssignFor(null)}>
          <Card className="max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">Assign Experiment</h3>
            <p className="text-sm text-neutral-500 mb-4">{assignFor.title}</p>
            <p className="text-xs font-semibold text-neutral-400 mb-2">SELECT STUDENT</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {students.map((st) => (
                <div key={st.id} className="flex items-center justify-between p-3 rounded-lg border hover:border-neutral-300">
                  <div>
                    <p className="text-sm font-medium">{st.name}</p>
                    <p className="text-xs text-neutral-400 font-mono">{st.id}</p>
                  </div>
                  <Button size="sm" onClick={() => assign(assignFor.id, st.id)}>Assign</Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => setAssignFor(null)}>Done</Button>
          </Card>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-black text-white text-sm px-4 py-2.5 rounded-lg shadow-lg z-50">{toast}</div>
      )}
    </div>
  );
}
