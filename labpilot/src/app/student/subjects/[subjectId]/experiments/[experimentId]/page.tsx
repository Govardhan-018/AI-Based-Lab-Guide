"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Experiment } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

export default function StudentExperimentOverview() {
  const params = useParams();
  const [exp, setExp] = useState<Experiment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/experiments/${params.experimentId}`)
      .then((r) => r.json())
      .then((d) => { setExp(d.experiment || null); setLoading(false); });
  }, [params.experimentId]);

  if (loading) return <div className="p-8 text-neutral-400">Loading...</div>;
  if (!exp) return <div className="p-8 text-neutral-400">Experiment not found</div>;

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`/student/subjects/${params.subjectId}`} className="text-sm text-neutral-400 hover:text-neutral-600 font-medium">
        ← Back to Subject
      </Link>

      <div className="mt-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{exp.title}</h1>
          <DifficultyBadge level={exp.difficulty} />
        </div>
        <p className="text-neutral-500">{exp.description}</p>
      </div>

      {exp.purpose && (
        <Card className="p-5 mb-6">
          <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-neutral-400">Purpose</h3>
          <p className="text-sm leading-relaxed">{exp.purpose}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card className="p-5">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-neutral-400">Theory</h3>
          <p className="text-sm leading-relaxed">{exp.theory}</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-neutral-400">Learning Objectives</h3>
          <ul className="space-y-2">
            {exp.learningObjectives.map((obj, i) => (
              <li key={i} className="text-sm flex items-start gap-2"><span className="text-neutral-400 mt-0.5">✓</span> {obj}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-neutral-400">Apparatus & Materials</h3>
          <div className="flex flex-wrap gap-2">
            {exp.materials.map((item, i) => <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>)}
          </div>
        </Card>
        <Card className="p-5 border-amber-200 bg-amber-50/50">
          <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-amber-700">Safety Rules</h3>
          <ul className="space-y-2">
            {exp.safetyRules.map((rule, i) => (
              <li key={i} className="text-sm text-amber-800 flex items-start gap-2"><span className="mt-0.5">•</span> {rule}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5 mb-6">
        <h3 className="font-bold mb-3">Procedure ({exp.steps.length} Steps)</h3>
        <div className="space-y-3">
          {exp.steps.map((s, i) => (
            <div key={s.id} className="flex items-start gap-3 text-sm">
              <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
              <div>
                <p className="font-medium">{s.instruction}</p>
                {s.expectedObservation && <p className="text-xs text-neutral-400 mt-0.5">Expected: {s.expectedObservation}</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Link href={`/lab/${exp.id}`}>
          <Button size="lg" className="px-8">Start Lab Session</Button>
        </Link>
        <span className="text-sm text-neutral-400">~{exp.estimatedMinutes} minutes · Camera + AI + Voice enabled</span>
      </div>
    </div>
  );
}
