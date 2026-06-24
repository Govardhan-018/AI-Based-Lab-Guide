"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Experiment } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

interface Subject { id: string; name: string; code: string; icon: string; color: string }

export default function StudentSubjectPage() {
  const params = useParams();
  const subjectId = params.subjectId as string;
  const [subject, setSubject] = useState<Subject | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.json()).then((d) => setSubject((d.subjects || []).find((s: Subject) => s.id === subjectId) || null));
    fetch(`/api/experiments?subjectId=${subjectId}`).then((r) => r.json()).then((d) => setExperiments((d.experiments || []).filter((e: Experiment) => e.isPublished)));
  }, [subjectId]);

  if (!subject) return <div className="p-8 text-neutral-400">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/student/subjects" className="text-sm text-neutral-400 hover:text-neutral-600 font-medium">← Back to Subjects</Link>

      <div className="flex items-center gap-4 mt-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: subject.color + "15" }}>
          {subject.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{subject.name}</h1>
          <p className="text-sm text-neutral-500">{subject.code}</p>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-4">Experiments</h2>
      {experiments.length === 0 ? (
        <p className="text-sm text-neutral-400">No experiments available in this subject yet.</p>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp) => (
            <Link key={exp.id} href={`/student/subjects/${subjectId}/experiments/${exp.id}`}>
              <Card className="p-5 hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{exp.title}</h3>
                      <DifficultyBadge level={exp.difficulty} />
                    </div>
                    <p className="text-sm text-neutral-500 line-clamp-1">{exp.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-400">
                      <span>{exp.estimatedMinutes} min</span>
                      <span>{exp.steps.length} steps</span>
                    </div>
                  </div>
                  <span className="text-neutral-300 text-lg mt-1">→</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
