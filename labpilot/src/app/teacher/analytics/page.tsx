"use client";

import { useEffect, useState } from "react";
import type { Experiment, Session } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function TeacherAnalyticsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/experiments").then((r) => r.json()),
      fetch("/api/sessions").then((r) => r.json()),
    ]).then(([e, s]) => {
      setExperiments(e.experiments || []);
      setSessions(s.sessions || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;

  const completed = sessions.filter((s) => s.status === "completed");
  const avg = (k: "understanding" | "safety" | "engagement") =>
    completed.length ? Math.round(completed.reduce((a, s) => a + s.scores[k], 0) / completed.length) : 0;

  // Per-experiment completion + avg score
  const perExp = experiments.map((e) => {
    const runs = sessions.filter((s) => s.experimentId === e.id);
    const done = runs.filter((s) => s.status === "completed");
    const avgScore = done.length ? Math.round(done.reduce((a, s) => a + s.scores.overall, 0) / done.length) : 0;
    return { name: e.title.length > 18 ? e.title.slice(0, 18) + "…" : e.title, completed: done.length, started: runs.length, avgScore };
  });

  const totalMistakes = sessions.reduce((a, s) => a + s.totalMistakes, 0);

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">Analytics</h1>
      <p className="text-sm text-neutral-500 mb-8">Aggregated from {sessions.length} real session{sessions.length !== 1 ? "s" : ""}</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Avg Understanding" value={completed.length ? `${avg("understanding")}%` : "—"} />
        <StatCard label="Avg Safety" value={completed.length ? `${avg("safety")}%` : "—"} />
        <StatCard label="Avg Engagement" value={completed.length ? `${avg("engagement")}%` : "—"} />
        <StatCard label="Total Mistakes" value={totalMistakes} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Completions per Experiment</h3>
          {perExp.length === 0 ? <p className="text-sm text-neutral-400">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perExp}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="started" fill="#E5E7EB" name="Started" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Average Score per Experiment</h3>
          {perExp.length === 0 ? <p className="text-sm text-neutral-400">No data yet.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={perExp}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#3B82F6" name="Avg Score" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
