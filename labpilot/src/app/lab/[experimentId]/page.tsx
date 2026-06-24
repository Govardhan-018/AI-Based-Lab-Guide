"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LabSession } from "@/components/lab/lab-session";
import type { Experiment } from "@/lib/db";

export default function LabRunPage() {
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [user, setUser] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");

  const assignmentId = search.get("assignment") || undefined;

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== "student") {
      router.replace("/");
      return;
    }
    setUser({ id: u.id, name: u.name });

    fetch(`/api/experiments/${params.experimentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.experiment) setExperiment(d.experiment);
        else setError("Experiment not found");
      })
      .catch(() => setError("Could not load experiment"));
  }, [params.experimentId, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3">
        <p className="text-neutral-500">{error}</p>
        <button onClick={() => router.push("/student")} className="text-sm font-medium underline">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (!experiment || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <LabSession
      experiment={experiment}
      studentId={user.id}
      studentName={user.name}
      assignmentId={assignmentId}
    />
  );
}
