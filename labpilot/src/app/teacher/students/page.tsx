"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Student { id: string; name: string; email: string; totalXp?: number; level?: number; streakDays?: number }

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch("/api/users?role=student").then((r) => r.json()).then((d) => setStudents(d.users || []));
    fetch("/api/sessions").then((r) => r.json()).then((d) => setSessions(d.sessions || []));
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Students</h1>
      <p className="text-sm text-neutral-500 mb-8">{students.length} students enrolled</p>

      <div className="space-y-3">
        {students.map((st) => {
          const sSessions = sessions.filter((s) => s.studentId === st.id);
          const completed = sSessions.filter((s) => s.status === "completed");
          const avg = completed.length ? Math.round(completed.reduce((a, s) => a + s.scores.overall, 0) / completed.length) : null;
          return (
            <Link key={st.id} href={`/teacher/students/${st.id}`}>
              <Card className="p-5 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-sm font-bold">
                      {st.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{st.name}</h3>
                      <p className="text-xs text-neutral-400 font-mono">{st.id} · {st.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center"><p className="text-sm font-bold">{(st.totalXp || 0).toLocaleString()}</p><p className="text-[10px] text-neutral-400">XP</p></div>
                    <div className="text-center"><p className="text-sm font-bold">Lvl {st.level || 1}</p><p className="text-[10px] text-neutral-400">Level</p></div>
                    <div className="text-center"><p className="text-sm font-bold">{completed.length}</p><p className="text-[10px] text-neutral-400">Done</p></div>
                    <div className="text-center">
                      {avg !== null ? <Badge variant="secondary" className="font-bold">{avg}%</Badge> : <span className="text-xs text-neutral-300">—</span>}
                      <p className="text-[10px] text-neutral-400 mt-0.5">Avg</p>
                    </div>
                    <span className="text-neutral-300">→</span>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
