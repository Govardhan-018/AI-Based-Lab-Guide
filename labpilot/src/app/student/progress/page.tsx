"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/shared/score-ring";

interface Session {
  id: string;
  experimentTitle: string;
  status: string;
  completedAt?: string;
  startedAt: string;
  totalMistakes: number;
  totalHints: number;
  scores: { understanding: number; safety: number; engagement: number; overall: number };
  xpEarned: number;
}

// Badge thresholds derived from real data
const BADGES = [
  { code: "first_lab", name: "First Steps", label: "1st", desc: "Complete your first experiment", earned: (s: Session[]) => s.filter(x => x.status === "completed").length >= 1 },
  { code: "safety_star", name: "Safety Star", label: "S+", desc: "Score 100% on safety", earned: (s: Session[]) => s.some(x => x.scores.safety === 100 && x.status === "completed") },
  { code: "perfectionist", name: "Perfectionist", label: "90+", desc: "Score 90+ overall", earned: (s: Session[]) => s.some(x => x.scores.overall >= 90) },
  { code: "no_hints", name: "Independent", label: "No H", desc: "Finish a lab with no hints", earned: (s: Session[]) => s.some(x => x.status === "completed" && x.totalHints === 0) },
  { code: "triple", name: "Triple Threat", label: "x3", desc: "Complete 3 experiments", earned: (s: Session[]) => s.filter(x => x.status === "completed").length >= 3 },
  { code: "flawless", name: "Flawless", label: "0 err", desc: "Finish with zero mistakes", earned: (s: Session[]) => s.some(x => x.status === "completed" && x.totalMistakes === 0) },
];

export default function StudentProgressPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) return;
    Promise.all([
      fetch(`/api/sessions?studentId=${u.id}`).then((r) => r.json()),
      fetch("/api/users?role=student").then((r) => r.json()),
    ]).then(([s, usersResp]) => {
      setSessions(s.sessions || []);
      const fresh = (usersResp.users || []).find((x: AuthUser) => x.id === u.id);
      setUser(fresh || u);
      setLoading(false);
    });
  }, []);

  if (loading || !user) return <div className="p-8 text-neutral-400">Loading...</div>;

  const completed = sessions.filter((s) => s.status === "completed");
  const avg = (k: "understanding" | "safety" | "engagement") =>
    completed.length ? Math.round(completed.reduce((a, s) => a + s.scores[k], 0) / completed.length) : 0;
  const level = user.level || 1;
  const totalXp = user.totalXp || 0;
  const xpInLevel = totalXp - (level - 1) * 1000;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">My Progress</h1>
      <p className="text-sm text-neutral-500 mb-8">Skills, badges, and session history</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{totalXp.toLocaleString()}</p><p className="text-xs text-neutral-400 mt-1">Total XP</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{level}</p><p className="text-xs text-neutral-400 mt-1">Level</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{user.streakDays || 0}</p><p className="text-xs text-neutral-400 mt-1">Day Streak</p></Card>
        <Card className="p-5 text-center"><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-neutral-400 mt-1">Completed</p></Card>
      </div>

      <Card className="p-5 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Level {level} → {level + 1}</span>
          <span className="text-xs text-neutral-400">{xpInLevel} / 1000 XP</span>
        </div>
        <Progress value={Math.min(100, (xpInLevel / 1000) * 100)} className="h-2" />
      </Card>

      {completed.length > 0 && (
        <Card className="p-6 mb-8">
          <h3 className="font-bold mb-4">Average Skills</h3>
          <div className="grid grid-cols-3 gap-8">
            {(["understanding", "safety", "engagement"] as const).map((k) => (
              <div key={k} className="text-center">
                <ScoreRing score={avg(k)} size={80} strokeWidth={6} />
                <p className="text-sm font-semibold mt-2 capitalize">{k}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <h2 className="text-lg font-bold mb-4">Badges</h2>
      <div className="grid grid-cols-3 gap-3 mb-8">
        {BADGES.map((b) => {
          const earned = b.earned(sessions);
          return (
            <Card key={b.code} className={`p-3 flex items-center gap-3 ${earned ? "" : "opacity-30"}`}>
              <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-black text-neutral-600 shrink-0">{b.label}</div>
              <div>
                <p className="text-sm font-semibold">{b.name}</p>
                <p className="text-[10px] text-neutral-400">{b.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <h2 className="text-lg font-bold mb-4">Session History</h2>
      {completed.length === 0 ? (
        <p className="text-sm text-neutral-400">No completed experiments yet.</p>
      ) : (
        <div className="space-y-3">
          {[...completed].reverse().map((s) => (
            <Card key={s.id} className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{s.experimentTitle}</p>
                <p className="text-xs text-neutral-400">{s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""} · +{s.xpEarned} XP · {s.totalMistakes} mistakes</p>
              </div>
              <div className="flex items-center gap-4">
                <ScoreRing score={s.scores.understanding} size={34} strokeWidth={3} />
                <ScoreRing score={s.scores.safety} size={34} strokeWidth={3} />
                <div className="border-l pl-4"><ScoreRing score={s.scores.overall} size={40} strokeWidth={4} /></div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
