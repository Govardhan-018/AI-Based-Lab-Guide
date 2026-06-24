"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface RangeDraft {
  min: string;
  max: string;
  marks: string;
}

interface CalcFieldDraft {
  label: string;
  formula: string;
  unit: string;
  ranges: RangeDraft[];
}

const EMPTY_RANGE: RangeDraft = { min: "", max: "", marks: "" };

const EMPTY_CALC_FIELD: CalcFieldDraft = {
  label: "",
  formula: "",
  unit: "",
  ranges: [{ ...EMPTY_RANGE }],
};

const COLOR_PRESETS: { label: string; hsvLower: [number, number, number]; hsvUpper: [number, number, number] }[] = [
  { label: "Pale Blue", hsvLower: [90, 50, 100], hsvUpper: [130, 180, 255] },
  { label: "Dark Blue", hsvLower: [100, 150, 50], hsvUpper: [140, 255, 200] },
  { label: "Red / Pink", hsvLower: [0, 100, 100], hsvUpper: [10, 255, 255] },
  { label: "Green", hsvLower: [35, 50, 50], hsvUpper: [85, 255, 255] },
  { label: "Yellow", hsvLower: [20, 50, 150], hsvUpper: [40, 150, 255] },
  { label: "Orange", hsvLower: [10, 100, 100], hsvUpper: [25, 255, 255] },
  { label: "Purple / Violet", hsvLower: [130, 50, 50], hsvUpper: [165, 255, 255] },
  { label: "White / Precipitate", hsvLower: [0, 0, 180], hsvUpper: [180, 40, 255] },
  { label: "Brown", hsvLower: [10, 50, 50], hsvUpper: [25, 200, 150] },
  { label: "Colourless / Clear", hsvLower: [0, 0, 150], hsvUpper: [180, 30, 255] },
];

interface StepDraft {
  title: string;
  instruction: string;
  whyItWorks: string;
  expectedObservation: string;
  safetyNotes: string;
  hints: string;
  commonErrors: string;
  verificationType: string;
  testTubeNumber: string;
  validationMode: "none" | "number" | "color" | "value";
  colorPreset: string;
  colorHsvLower: string;
  colorHsvUpper: string;
  colorMinPercent: string;
  valueLabel: string;
  valueUnit: string;
  valueMin: string;
  valueMax: string;
}

const EMPTY_STEP: StepDraft = {
  title: "",
  instruction: "",
  whyItWorks: "",
  expectedObservation: "",
  safetyNotes: "",
  hints: "",
  commonErrors: "",
  verificationType: "manual",
  testTubeNumber: "",
  validationMode: "none",
  colorPreset: "",
  colorHsvLower: "",
  colorHsvUpper: "",
  colorMinPercent: "2",
  valueLabel: "",
  valueUnit: "",
  valueMin: "",
  valueMax: "",
};

export default function CreateExperimentPage() {
  const params = useParams();
  const router = useRouter();
  const [subjectName, setSubjectName] = useState("Subject");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/subjects").then((r) => r.json()).then((d) => {
      const s = (d.subjects || []).find((x: { id: string; name: string }) => x.id === params.subjectId);
      if (s) setSubjectName(s.name);
    });
  }, [params.subjectId]);

  const [currentTab, setCurrentTab] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");
  const [theory, setTheory] = useState("");
  const [objectives, setObjectives] = useState("");
  const [apparatus, setApparatus] = useState("");
  const [safetyRules, setSafetyRules] = useState("");
  const [steps, setSteps] = useState<StepDraft[]>([{ ...EMPTY_STEP }]);
  const [calcEnabled, setCalcEnabled] = useState(false);
  const [calcFields, setCalcFields] = useState<CalcFieldDraft[]>([{ ...EMPTY_CALC_FIELD }]);

  const TABS = ["Basic Info", "Theory & Objectives", "Apparatus", "Safety Rules", "Procedure Steps", "Calculations", "Review"];

  const updateStep = (index: number, field: keyof StepDraft, value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const addStep = () => setSteps((prev) => [...prev, { ...EMPTY_STEP }]);
  const removeStep = (index: number) => setSteps((prev) => prev.filter((_, i) => i !== index));

  const updateCalcField = (index: number, field: "label" | "formula" | "unit", value: string) => {
    setCalcFields((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };
  const addCalcField = () => setCalcFields((prev) => [...prev, { ...EMPTY_CALC_FIELD }]);
  const removeCalcField = (index: number) => setCalcFields((prev) => prev.filter((_, i) => i !== index));

  const moveStep = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    setSteps((prev) => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const splitList = (s: string, sep: RegExp = /[,\n]/) =>
    s.split(sep).map((x) => x.trim()).filter(Boolean);

  async function saveExperiment(publish: boolean) {
    setSaving(true);
    const user = getCurrentUser();
    const payload = {
      title,
      description,
      subjectId: params.subjectId,
      difficulty,
      estimatedMinutes: Number(estimatedMinutes),
      theory,
      learningObjectives: splitList(objectives, /\n/),
      materials: splitList(apparatus, /\n/),
      safetyRules: splitList(safetyRules, /\n/),
      steps: steps.map((s, i) => {
        const tubeNumber = s.testTubeNumber ? Number(s.testTubeNumber) : undefined;
        const preset = COLOR_PRESETS.find((p) => p.label === s.colorPreset);
        const parseHsv = (str: string): [number, number, number] | undefined => {
          const parts = str.split(",").map(Number);
          return parts.length === 3 && parts.every((n) => !isNaN(n)) ? parts as [number, number, number] : undefined;
        };
        return {
          id: `step_${i + 1}`,
          title: s.title || `Step ${i + 1}`,
          instruction: s.instruction,
          whyItWorks: s.whyItWorks,
          expectedObservation: s.expectedObservation,
          safetyNotes: splitList(s.safetyNotes),
          hints: splitList(s.hints),
          commonErrors: splitList(s.commonErrors),
          verificationType: s.validationMode === "number" || s.validationMode === "color" ? "camera" : "manual",
          testTubeNumber: tubeNumber,
          colorValidation: s.validationMode === "color" ? {
            label: s.colorPreset || "Color",
            hsvLower: preset?.hsvLower || parseHsv(s.colorHsvLower) || [0, 0, 0],
            hsvUpper: preset?.hsvUpper || parseHsv(s.colorHsvUpper) || [180, 255, 255],
            minPercent: Number(s.colorMinPercent) || 2,
          } : undefined,
          valueValidation: s.validationMode === "value" ? {
            label: s.valueLabel || "Measured value",
            unit: s.valueUnit || "",
            expectedMin: Number(s.valueMin) || 0,
            expectedMax: Number(s.valueMax) || 0,
          } : undefined,
        };
      }),
      calculations: calcEnabled ? {
        enabled: true,
        fields: calcFields.filter((f) => f.label).map((f, i) => ({
          id: `calc_${i + 1}`,
          label: f.label,
          formula: f.formula,
          unit: f.unit,
          ranges: f.ranges.filter((r) => r.marks).map((r) => ({
            min: Number(r.min) || 0,
            max: Number(r.max) || 0,
            marks: Number(r.marks) || 0,
          })),
        })),
        totalMarks: calcFields.filter((f) => f.label).reduce((sum, f) => {
          const best = Math.max(...f.ranges.map((r) => Number(r.marks) || 0), 0);
          return sum + best;
        }, 0),
      } : undefined,
      createdBy: user?.id || "teacher",
      isPublished: publish,
    };

    try {
      const resp = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error("save failed");
      router.push(`/teacher/subjects/${params.subjectId}`);
    } catch {
      alert("Failed to save experiment. Is the server running?");
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href={`/teacher/subjects/${params.subjectId}`} className="text-sm text-neutral-400 hover:text-neutral-600 font-medium">
        ← Back to {subjectName}
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">Create New Experiment</h1>
      <p className="text-sm text-neutral-500 mb-6">Build a step-by-step guided experiment for your students</p>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-8 border-b border-neutral-200">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setCurrentTab(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              currentTab === i ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-neutral-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 0: Basic Info */}
      {currentTab === 0 && (
        <div className="space-y-6">
          <div>
            <Label>Experiment Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Synthesis of Copper(II) Sulfate" className="mt-1.5" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the experiment..." className="mt-1.5" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Difficulty Level</Label>
              <div className="flex gap-2 mt-1.5">
                {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 text-sm rounded-lg border capitalize transition-colors ${
                      difficulty === d ? "bg-black text-white border-black" : "border-neutral-200 hover:border-neutral-400"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Estimated Duration (minutes)</Label>
              <Input type="number" value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Theory & Objectives */}
      {currentTab === 1 && (
        <div className="space-y-6">
          <div>
            <Label>Theory / Background</Label>
            <Textarea value={theory} onChange={(e) => setTheory(e.target.value)} placeholder="Explain the scientific principles behind this experiment..." className="mt-1.5" rows={6} />
          </div>
          <div>
            <Label>Learning Objectives (one per line)</Label>
            <Textarea value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Understand neutralization reactions&#10;Practice filtration technique&#10;Observe crystallization" className="mt-1.5" rows={4} />
          </div>
        </div>
      )}

      {/* Tab 2: Apparatus */}
      {currentTab === 2 && (
        <div>
          <Label>Apparatus / Materials (one per line)</Label>
          <Textarea value={apparatus} onChange={(e) => setApparatus(e.target.value)} placeholder="Test tube 1 (HCl)&#10;Test tube 2 (NaOH)&#10;Beaker 3 (mixing vessel)" className="mt-1.5" rows={8} />
          {apparatus && (
            <div className="flex flex-wrap gap-2 mt-4">
              {apparatus.split("\n").filter(Boolean).map((item, i) => (
                <Badge key={i} variant="secondary">{item.trim()}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Safety Rules */}
      {currentTab === 3 && (
        <div>
          <Label>Safety Rules & Precautions (one per line)</Label>
          <Textarea value={safetyRules} onChange={(e) => setSafetyRules(e.target.value)} placeholder="Wear safety goggles and gloves&#10;Handle acids with care&#10;Do not heat to dryness" className="mt-1.5" rows={6} />
          {safetyRules && (
            <Card className="p-4 mt-4 border-amber-200 bg-amber-50/50">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Safety Preview</p>
              <ul className="space-y-1">
                {safetyRules.split("\n").filter(Boolean).map((rule, i) => (
                  <li key={i} className="text-sm text-amber-800">• {rule.trim()}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Tab 4: Procedure Steps */}
      {currentTab === 4 && (
        <div className="space-y-6">
          <div className="bg-neutral-50 border rounded-xl p-4">
            <p className="text-xs font-semibold text-neutral-700 mb-1">STEP VALIDATION</p>
            <p className="text-xs text-neutral-600">
              Each step can be validated by <strong>Test tube number</strong> (camera reads label),
              <strong> Color detection</strong> (camera checks for expected color using HSV range),
              <strong> Value input</strong> (student enters a measurement like temperature), or <strong>None</strong> (manual skip only).
              Students always have a Skip button to proceed manually.
            </p>
          </div>

          {steps.map((step, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm">Step {i + 1}</h3>
                  {step.testTubeNumber && (
                    <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black">
                      {step.testTubeNumber}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30 text-sm">↑</button>
                  <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="p-1 text-neutral-400 hover:text-black disabled:opacity-30 text-sm">↓</button>
                  {steps.length > 1 && (
                    <button onClick={() => removeStep(i)} className="p-1 text-red-400 hover:text-red-600 text-sm ml-2">✕</button>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Title</Label>
                  <Input value={step.title} onChange={(e) => updateStep(i, "title", e.target.value)} placeholder="e.g., Measure Acid" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Instruction</Label>
                  <Textarea value={step.instruction} onChange={(e) => updateStep(i, "instruction", e.target.value)} placeholder="Detailed instruction for the student..." className="mt-1" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Why This Works (explanation)</Label>
                    <Textarea value={step.whyItWorks} onChange={(e) => updateStep(i, "whyItWorks", e.target.value)} placeholder="Scientific explanation..." className="mt-1" rows={2} />
                  </div>
                  <div>
                    <Label className="text-xs">Expected Observation</Label>
                    <Textarea value={step.expectedObservation} onChange={(e) => updateStep(i, "expectedObservation", e.target.value)} placeholder="What the student should see..." className="mt-1" rows={2} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Hints (comma-separated)</Label>
                    <Input value={step.hints} onChange={(e) => updateStep(i, "hints", e.target.value)} placeholder="Pour slowly, Use a cylinder" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Common Mistakes (comma-separated)</Label>
                    <Input value={step.commonErrors} onChange={(e) => updateStep(i, "commonErrors", e.target.value)} placeholder="Using too much acid" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Safety Notes for this step</Label>
                  <Input value={step.safetyNotes} onChange={(e) => updateStep(i, "safetyNotes", e.target.value)} placeholder="Comma-separated" className="mt-1" />
                </div>

                {/* Validation mode selector */}
                <div className="border rounded-xl p-4 space-y-3 bg-neutral-50/50">
                  <Label className="text-xs font-semibold">Step Validation</Label>
                  <div className="flex gap-1">
                    {(["none", "number", "color", "value"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateStep(i, "validationMode", mode)}
                        className={`px-3 py-1.5 text-xs rounded-lg border capitalize transition-colors ${
                          step.validationMode === mode ? "bg-black text-white border-black" : "border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        {mode === "none" ? "None (manual)" : mode === "number" ? "Test Tube #" : mode === "color" ? "Color Detection" : "Value Input"}
                      </button>
                    ))}
                  </div>

                  {step.validationMode === "number" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Test Tube Number</Label>
                        <Input type="number" min="1" max="20" value={step.testTubeNumber} onChange={(e) => updateStep(i, "testTubeNumber", e.target.value)} placeholder="1, 2, 3…" className="mt-1" />
                      </div>
                    </div>
                  )}

                  {step.validationMode === "color" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Color Preset</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {COLOR_PRESETS.map((p) => (
                            <button
                              key={p.label}
                              onClick={() => {
                                updateStep(i, "colorPreset", p.label);
                                updateStep(i, "colorHsvLower", p.hsvLower.join(","));
                                updateStep(i, "colorHsvUpper", p.hsvUpper.join(","));
                              }}
                              className={`px-2 py-1 text-[11px] rounded-lg border transition-colors ${
                                step.colorPreset === p.label ? "bg-black text-white border-black" : "border-neutral-200 hover:border-neutral-400"
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">HSV Lower (H,S,V)</Label>
                          <Input value={step.colorHsvLower} onChange={(e) => updateStep(i, "colorHsvLower", e.target.value)} placeholder="90,50,100" className="mt-1 font-mono text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs">HSV Upper (H,S,V)</Label>
                          <Input value={step.colorHsvUpper} onChange={(e) => updateStep(i, "colorHsvUpper", e.target.value)} placeholder="130,180,255" className="mt-1 font-mono text-xs" />
                        </div>
                        <div>
                          <Label className="text-xs">Min Coverage %</Label>
                          <Input type="number" step="0.5" value={step.colorMinPercent} onChange={(e) => updateStep(i, "colorMinPercent", e.target.value)} placeholder="2" className="mt-1" />
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-400">Camera will verify that at least {step.colorMinPercent || 2}% of the frame contains the expected color.</p>
                    </div>
                  )}

                  {step.validationMode === "value" && (
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input value={step.valueLabel} onChange={(e) => updateStep(i, "valueLabel", e.target.value)} placeholder="Temperature" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input value={step.valueUnit} onChange={(e) => updateStep(i, "valueUnit", e.target.value)} placeholder="°C" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Expected Min</Label>
                        <Input type="number" step="any" value={step.valueMin} onChange={(e) => updateStep(i, "valueMin", e.target.value)} placeholder="24" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Expected Max</Label>
                        <Input type="number" step="any" value={step.valueMax} onChange={(e) => updateStep(i, "valueMax", e.target.value)} placeholder="26" className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          <Button variant="outline" onClick={addStep} className="w-full">
            + Add Step
          </Button>
        </div>
      )}

      {/* Tab 5: Calculations */}
      {currentTab === 5 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Calculation & Grading</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Define formulas and expected value ranges. Students enter their computed values during the lab and are graded automatically.</p>
            </div>
            <button
              onClick={() => setCalcEnabled(!calcEnabled)}
              className={`relative w-10 h-6 rounded-full transition-colors ${calcEnabled ? "bg-black" : "bg-neutral-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${calcEnabled ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </div>

          {calcEnabled && (
            <>
              {calcFields.map((field, fi) => (
                <Card key={fi} className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-sm">Field {fi + 1}</h4>
                    {calcFields.length > 1 && (
                      <button onClick={() => removeCalcField(fi)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Label (shown to student)</Label>
                        <Input value={field.label} onChange={(e) => updateCalcField(fi, "label", e.target.value)} placeholder="e.g., Molarity of NaCl" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Unit</Label>
                        <Input value={field.unit} onChange={(e) => updateCalcField(fi, "unit", e.target.value)} placeholder="e.g., mol/L, g, mL" className="mt-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Formula / Reference (shown as hint to student)</Label>
                      <Input value={field.formula} onChange={(e) => updateCalcField(fi, "formula", e.target.value)} placeholder="e.g., M = n / V, where n = moles, V = volume in L" className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Mark Ranges</Label>
                      <p className="text-[10px] text-neutral-400 mb-2">Define value ranges and their marks. Student gets marks from the first matching range (checked top-to-bottom).</p>
                      <div className="space-y-2">
                        {field.ranges.map((range, ri) => (
                          <div key={ri} className="flex items-center gap-2">
                            <Input type="number" step="any" value={range.min} onChange={(e) => {
                              const updated = [...field.ranges];
                              updated[ri] = { ...updated[ri], min: e.target.value };
                              setCalcFields((prev) => prev.map((f, idx) => idx === fi ? { ...f, ranges: updated } : f));
                            }} placeholder="Min" className="w-24" />
                            <span className="text-xs text-neutral-400">to</span>
                            <Input type="number" step="any" value={range.max} onChange={(e) => {
                              const updated = [...field.ranges];
                              updated[ri] = { ...updated[ri], max: e.target.value };
                              setCalcFields((prev) => prev.map((f, idx) => idx === fi ? { ...f, ranges: updated } : f));
                            }} placeholder="Max" className="w-24" />
                            <span className="text-xs text-neutral-400">=</span>
                            <Input type="number" min="0" value={range.marks} onChange={(e) => {
                              const updated = [...field.ranges];
                              updated[ri] = { ...updated[ri], marks: e.target.value };
                              setCalcFields((prev) => prev.map((f, idx) => idx === fi ? { ...f, ranges: updated } : f));
                            }} placeholder="Marks" className="w-20" />
                            <span className="text-[10px] text-neutral-400">marks</span>
                            {field.ranges.length > 1 && (
                              <button onClick={() => {
                                const updated = field.ranges.filter((_, idx) => idx !== ri);
                                setCalcFields((prev) => prev.map((f, idx) => idx === fi ? { ...f, ranges: updated } : f));
                              }} className="text-red-400 hover:text-red-600 text-xs">x</button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => {
                          const updated = [...field.ranges, { ...EMPTY_RANGE }];
                          setCalcFields((prev) => prev.map((f, idx) => idx === fi ? { ...f, ranges: updated } : f));
                        }} className="text-xs text-neutral-500 hover:text-black font-medium">+ Add range</button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <Button variant="outline" onClick={addCalcField} className="w-full">+ Add Calculation Field</Button>
              <Card className="p-4 bg-neutral-50">
                <p className="text-xs font-semibold text-neutral-500">MAX MARKS PER FIELD: {calcFields.filter((f) => f.label).map((f) => Math.max(...f.ranges.map((r) => Number(r.marks) || 0), 0)).join(" + ")} = {calcFields.filter((f) => f.label).reduce((sum, f) => sum + Math.max(...f.ranges.map((r) => Number(r.marks) || 0), 0), 0)}</p>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Tab 6: Review */}
      {currentTab === 6 && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-1">{title || "Untitled Experiment"}</h3>
            <p className="text-sm text-neutral-500 mb-4">{description || "No description"}</p>
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="capitalize">{difficulty}</Badge>
              <Badge variant="secondary">{estimatedMinutes} min</Badge>
              <Badge variant="secondary">{steps.length} steps</Badge>
              {steps.some((s) => s.testTubeNumber) && (
                <Badge className="bg-violet-100 text-violet-700 border-violet-200">CV enabled</Badge>
              )}
            </div>
          </Card>

          {theory && (
            <Card className="p-5">
              <h4 className="text-sm font-bold text-neutral-400 uppercase mb-2">Theory</h4>
              <p className="text-sm">{theory}</p>
            </Card>
          )}

          {objectives && (
            <Card className="p-5">
              <h4 className="text-sm font-bold text-neutral-400 uppercase mb-2">Learning Objectives</h4>
              <ul className="space-y-1">
                {objectives.split("\n").filter(Boolean).map((obj, i) => (
                  <li key={i} className="text-sm flex items-start gap-2"><span className="text-neutral-400">✓</span> {obj}</li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h4 className="text-sm font-bold text-neutral-400 uppercase mb-2">Procedure</h4>
            <div className="space-y-3">
              {steps.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{s.title || `Step ${i + 1}`}</p>
                      {s.testTubeNumber && (
                        <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-semibold">
                          Tube #{s.testTubeNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500">{s.instruction || "No instruction"}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" disabled={saving} onClick={() => saveExperiment(false)}>
              Save as Draft
            </Button>
            <Button className="flex-1" disabled={saving || !title} onClick={() => saveExperiment(true)}>
              {saving ? "Saving..." : "Publish"}
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
        <Button variant="outline" disabled={currentTab === 0} onClick={() => setCurrentTab(currentTab - 1)}>
          ← Previous
        </Button>
        <div className="flex gap-1">
          {TABS.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i === currentTab ? "bg-black" : "bg-neutral-200"}`} />
          ))}
        </div>
        <Button disabled={currentTab === TABS.length - 1} onClick={() => setCurrentTab(currentTab + 1)}>
          Next →
        </Button>
      </div>
    </div>
  );
}
