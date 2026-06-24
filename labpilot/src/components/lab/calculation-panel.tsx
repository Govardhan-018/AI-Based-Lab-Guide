"use client";

import { useState } from "react";
import type { ExperimentCalculations, CalculationField } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CalculationPanelProps {
  calculations: ExperimentCalculations;
  onSubmit: (results: { fieldId: string; value: number; marks: number }[]) => void;
}

function gradeField(field: CalculationField, value: number): number {
  for (const range of field.ranges) {
    if (value >= range.min && value <= range.max) return range.marks;
  }
  return 0;
}

export function CalculationPanel({ calculations, onSubmit }: CalculationPanelProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ fieldId: string; value: number; marks: number; maxMarks: number }[]>([]);

  function handleSubmit() {
    const res = calculations.fields.map((field) => {
      const val = Number(values[field.id] || 0);
      const marks = gradeField(field, val);
      const maxMarks = Math.max(...field.ranges.map((r) => r.marks), 0);
      return { fieldId: field.id, value: val, marks, maxMarks };
    });
    setResults(res);
    setSubmitted(true);
    onSubmit(res.map((r) => ({ fieldId: r.fieldId, value: r.value, marks: r.marks })));
  }

  const totalEarned = results.reduce((s, r) => s + r.marks, 0);

  return (
    <Card className="p-5">
      <h3 className="font-bold text-sm mb-1">Calculations</h3>
      <p className="text-xs text-neutral-500 mb-4">Enter your computed values below.</p>

      <div className="space-y-4">
        {calculations.fields.map((field) => {
          const result = results.find((r) => r.fieldId === field.id);
          const maxMarks = Math.max(...field.ranges.map((r) => r.marks), 0);
          return (
            <div key={field.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{field.label}</label>
                <span className="text-[10px] text-neutral-400">max {maxMarks} marks</span>
              </div>
              {field.formula && (
                <p className="text-xs text-neutral-400 font-mono">{field.formula}</p>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="any"
                  value={values[field.id] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
                  placeholder="Enter value"
                  disabled={submitted}
                  className="flex-1"
                />
                <span className="text-xs text-neutral-500 w-12">{field.unit}</span>
                {submitted && result && (
                  <span className={`text-xs font-bold ${result.marks > 0 ? "text-emerald-600" : "text-red-500"}`}>
                    +{result.marks}/{result.maxMarks}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted ? (
        <Button className="w-full mt-4" onClick={handleSubmit}>
          Submit Calculations
        </Button>
      ) : (
        <div className="mt-4 p-3 rounded-lg bg-neutral-50 text-center">
          <p className="text-sm font-bold">{totalEarned} / {calculations.totalMarks} marks</p>
          <p className="text-xs text-neutral-500 mt-0.5">Calculations graded</p>
        </div>
      )}
    </Card>
  );
}
