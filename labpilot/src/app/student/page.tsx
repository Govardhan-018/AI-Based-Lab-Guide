"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { StatCard } from "@/components/shared/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/shared/score-ring";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

interface Assignment {
  id: string;
  experimentId: string;
  experimentTitle: string;
  experimentDifficulty?: "beginner" | "intermediate" | "advanced";
  estimatedMinutes?: number;
  subjectId?: string;
  status: string;
}

interface Session {
  id: string;
  experimentTitle: string;
  status: string;
  completedAt?: string;
  scores: { understanding: number; safety: number; engagement: number; overall: number };
  xpEarned: number;
}

export default function StudentDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) return;
    setUser(u);
    Promise.all([
      fetch(`/api/assignments?studentId=${u.id}`).then((r) => r.json()),
      fetch(`/api/sessions?studentId=${u.id}`).then((r) => r.json()),
      fetch(`/api/users/`).then((r) => r.json()), // refresh user xp/level
    ]).then(([asg, sess, usersResp]) => {
      setAssignments(asg.assignments || []);
      setSessions(sess.sessions || []);
      const fresh = (usersResp.users || []).find((x: AuthUser) => x.id === u.id);
      if (fresh) setUser({ ...u, ...fresh });
      setLoading(false);
    });
  }, []);

  if (loading || !user) {
    return <div className="p-8 text-neutral-400">Loading...</div>;
  }

  const level = user.level || 1;
  const totalXp = user.totalXp || 0;
  const xpFloor = (level - 1) * 1000;
  const xpInLevel = totalXp - xpFloor;
  const xpProgress = Math.min(100, (xpInLevel / 1000) * 100);

  const completed = sessions.filter((s) => s.status === "completed");
  const pending = assignments.filter((a) => a.status !== "completed");
  const recentCompleted = [...completed].reverse().slice(0, 4);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{user.name.split(" ")[0]}&apos;s Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">Lab overview and assignments</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total XP" value={totalXp.toLocaleString()} />
        <StatCard label="Level" value={level} />
        <StatCard label="Streak" value={`${user.streakDays || 0} days`} />
        <StatCard label="Completed" value={completed.length} />
      </div>

      <Card className="p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Level {level} → Level {level + 1}</span>
          <span className="text-xs text-neutral-400">{xpInLevel} / 1000 XP</span>
        </div>
        <Progress value={xpProgress} className="h-2" />
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Assigned Experiments</h2>
        <span className="text-sm text-neutral-400">{pending.length} pending</span>
      </div>
      {pending.length === 0 ? (
        <Card className="p-8 text-center text-neutral-400 mb-8">
          <p className="text-sm">No pending experiments.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {pending.map((a) => (
            <Link key={a.id} href={`/lab/${a.experimentId}?assignment=${a.id}`}>
              <Card className="p-5 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-sm">{a.experimentTitle}</h3>
                  {a.experimentDifficulty && <DifficultyBadge level={a.experimentDifficulty} />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">~{a.estimatedMinutes || 20} min</span>
                  {a.status === "in_progress" ? (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">In Progress</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px]">Start →</Badge>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <h2 className="text-lg font-bold mb-4">Recent Results</h2>
      {recentCompleted.length === 0 ? (
        <p className="text-sm text-neutral-400">No completed experiments yet.</p>
      ) : (
        <div className="space-y-3">
          {recentCompleted.map((s) => (
            <Card key={s.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{s.experimentTitle}</p>
                <p className="text-xs text-neutral-400">
                  {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""} · +{s.xpEarned} XP
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <ScoreRing score={s.scores.understanding} size={36} strokeWidth={3} />
                  <p className="text-[9px] text-neutral-400 mt-0.5">Understand</p>
                </div>
                <div className="text-center">
                  <ScoreRing score={s.scores.safety} size={36} strokeWidth={3} />
                  <p className="text-[9px] text-neutral-400 mt-0.5">Safety</p>
                </div>
                <div className="text-center border-l pl-4">
                  <ScoreRing score={s.scores.overall} size={40} strokeWidth={4} />
                  <p className="text-[9px] font-semibold text-neutral-400 mt-0.5">Overall</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
