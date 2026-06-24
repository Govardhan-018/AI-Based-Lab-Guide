"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Experiment } from "@/lib/db";
import { Card } from "@/components/ui/card";

interface Subject { id: string; name: string; code: string; icon: string; color: string }

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.json()).then((d) => setSubjects(d.subjects || []));
    fetch("/api/experiments").then((r) => r.json()).then((d) => setExperiments(d.experiments || []));
  }, []);

  // Only show subjects that have published experiments
  const visible = subjects.filter((s) => experiments.some((e) => e.subjectId === s.id && e.isPublished));

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">My Subjects</h1>
      <p className="text-sm text-neutral-500 mb-8">Browse subjects and their available experiments</p>

      {visible.length === 0 ? (
        <p className="text-sm text-neutral-400">No subjects with experiments available yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {visible.map((sub) => {
            const count = experiments.filter((e) => e.subjectId === sub.id && e.isPublished).length;
            return (
              <Link key={sub.id} href={`/student/subjects/${sub.id}`}>
                <Card className="p-6 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: sub.color + "15" }}>
                      {sub.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold">{sub.name}</h3>
                      <p className="text-xs text-neutral-400">{sub.code} · {count} experiment{count !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-neutral-300">→</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
