"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Experiment, Session } from "@/lib/db";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Subject { id: string; name: string; code: string; icon: string; color: string }
interface Student { id: string; name: string; totalXp?: number; level?: number }

export default function TeacherDashboard() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/experiments").then((r) => r.json()),
      fetch("/api/sessions").then((r) => r.json()),
      fetch("/api/users?role=student").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
    ]).then(([e, s, u, sub]) => {
      setExperiments(e.experiments || []);
      setSessions(s.sessions || []);
      setStudents(u.users || []);
      setSubjects(sub.subjects || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;

  const completed = sessions.filter((s) => s.status === "completed");
  const active = sessions.filter((s) => s.status === "active");
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, s) => sum + (s.scores?.overall || 0), 0) / completed.length)
    : 0;
  const leaderboard = [...students].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0)).slice(0, 5);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Full overview of your laboratory program</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Experiments" value={experiments.length} />
        <StatCard label="Students" value={students.length} />
        <StatCard label="Sessions Run" value={sessions.length} />
        <StatCard label="Avg Score" value={completed.length ? `${avgScore}%` : "—"} />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            {active.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {active.length} live now
              </span>
            )}
          </div>
          {sessions.length === 0 ? (
            <Card className="p-8 text-center text-neutral-400 text-sm">No sessions yet. Assign an experiment to a student to get started.</Card>
          ) : (
            <div className="space-y-3">
              {[...sessions].reverse().slice(0, 6).map((s) => (
                <Card key={s.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{s.experimentTitle}</p>
                    <p className="text-xs text-neutral-400">{s.studentName} · {new Date(s.startedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.status === "completed" && <span className="text-sm font-bold">{s.scores?.overall ?? 0}%</span>}
                    <Badge variant="outline" className={`text-[11px] capitalize ${s.status === "active" ? "text-emerald-700 border-emerald-200 bg-emerald-50" : ""}`}>
                      {s.status}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">Top Students</h2>
          <Card className="p-2">
            {leaderboard.map((st, i) => (
              <Link key={st.id} href={`/teacher/students/${st.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50">
                <span className="font-bold text-neutral-300 text-sm w-5">{i + 1}</span>
                <div className="w-7 h-7 bg-neutral-100 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {st.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{st.name}</p>
                </div>
                <span className="text-xs font-bold">{(st.totalXp || 0).toLocaleString()} XP</span>
              </Link>
            ))}
          </Card>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Subjects</h2>
      <div className="grid grid-cols-2 gap-4">
        {subjects.map((sub) => {
          const count = experiments.filter((e) => e.subjectId === sub.id).length;
          return (
            <Link key={sub.id} href={`/teacher/subjects/${sub.id}`}>
              <Card className="p-5 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: sub.color + "15" }}>
                  {sub.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{sub.name}</h3>
                  <p className="text-xs text-neutral-400">{sub.code} · {count} experiments</p>
                </div>
                <span className="text-neutral-300">→</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
