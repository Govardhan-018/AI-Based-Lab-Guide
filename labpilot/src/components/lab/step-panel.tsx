"use client";

import { useState, useEffect } from "react";
import type { ExperimentStep, ValueValidation } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { StepIllustration } from "./step-illustration";

interface StepPanelProps {
  step: ExperimentStep;
  stepIndex: number;
  totalSteps: number;
  isComplete: boolean;
  onComplete: (validationMethod?: string) => void;
  onRevealHint: () => void;
  onLogMistake: () => void;
  mistakes: number;
  cameraScanning?: boolean;
  needsValueInput?: boolean;
  valueValidation?: ValueValidation;
}

export function StepPanel({
  step,
  stepIndex,
  totalSteps,
  isComplete,
  onComplete,
  onRevealHint,
  onLogMistake,
  mistakes,
  cameraScanning,
  needsValueInput,
  valueValidation,
}: StepPanelProps) {
  const [revealed, setRevealed] = useState(0);
  const [valueInput, setValueInput] = useState("");
  const [valueError, setValueError] = useState<string | null>(null);
  const [valueAccepted, setValueAccepted] = useState(false);
  const progress = (stepIndex / totalSteps) * 100;

  useEffect(() => {
    setRevealed(0);
    setValueInput("");
    setValueError(null);
    setValueAccepted(false);
  }, [stepIndex]);

  function revealNext() {
    if (revealed < step.hints.length) {
      setRevealed((r) => r + 1);
      onRevealHint();
    }
  }

  let effectiveTestTubeNumber: number | null = null;
  if (step.testTubeNumber != null && String(step.testTubeNumber).trim() !== "") {
    effectiveTestTubeNumber = Number(step.testTubeNumber);
  } else if (step.instruction) {
    const match = step.instruction.match(/test tube\s*(?:labeled\s*)?(\d+)/i);
    if (match) effectiveTestTubeNumber = parseInt(match[1], 10);
  }

  const hasColorValidation = !!step.colorValidation;
  const isCameraStep = effectiveTestTubeNumber !== null || hasColorValidation;

  function handleValueSubmit() {
    if (!valueValidation) return;
    const val = parseFloat(valueInput);
    if (isNaN(val)) { setValueError("Enter a valid number"); return; }
    if (val < valueValidation.expectedMin || val > valueValidation.expectedMax) {
      setValueError(`Expected ${valueValidation.expectedMin}–${valueValidation.expectedMax} ${valueValidation.unit}`);
      return;
    }
    setValueError(null);
    setValueAccepted(true);
    setTimeout(() => onComplete("value_input"), 500);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-neutral-400">STEP {stepIndex + 1} OF {totalSteps}</p>
          <p className="text-xs font-bold">{Math.round(progress)}%</p>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {isComplete ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">All Steps Complete</h3>
            <p className="text-sm text-neutral-500">Calculating score…</p>
          </div>
        ) : (
          <>
            {/* Camera verification banner */}
            {effectiveTestTubeNumber !== null && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-lg font-black shrink-0">
                  {effectiveTestTubeNumber}
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-700">CAMERA VERIFICATION</p>
                  <p className="text-sm text-violet-900">
                    Hold test tube #{effectiveTestTubeNumber} up to the camera and press Space to scan.
                  </p>
                </div>
                {cameraScanning && (
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </div>
            )}

            {/* Color validation banner */}
            {hasColorValidation && !effectiveTestTubeNumber && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                  CLR
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-700">COLOR VERIFICATION</p>
                  <p className="text-sm text-violet-900">
                    Show the expected color (<strong>{step.colorValidation!.label}</strong>) to the camera and press Space to scan.
                  </p>
                </div>
                {cameraScanning && (
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </div>
            )}

            {/* Value input section */}
            {needsValueInput && valueValidation && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <p className="text-xs font-semibold text-blue-700">VALUE INPUT — {valueValidation.label}</p>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="any"
                      value={valueInput}
                      onChange={(e) => { setValueInput(e.target.value); setValueError(null); }}
                      placeholder={`Enter ${valueValidation.label}`}
                      className={`bg-white ${valueError ? "border-red-400" : ""} ${valueAccepted ? "border-emerald-400 bg-emerald-50" : ""}`}
                    />
                    {valueError && <p className="text-xs text-red-500 mt-1">{valueError}</p>}
                    {valueAccepted && <p className="text-xs text-emerald-600 mt-1">Value accepted</p>}
                  </div>
                  <span className="text-sm font-semibold text-blue-700 pb-2">{valueValidation.unit}</span>
                  <Button size="sm" onClick={handleValueSubmit} disabled={valueAccepted} className="shrink-0">
                    Submit
                  </Button>
                </div>
                <p className="text-[10px] text-blue-400">
                  Expected range: {valueValidation.expectedMin}–{valueValidation.expectedMax} {valueValidation.unit}
                </p>
              </div>
            )}

            <StepIllustration
              instruction={step.instruction}
              testTubeNumber={effectiveTestTubeNumber ?? undefined}
              testTubeName={step.testTubeName}
              stepIndex={stepIndex}
              expectedObservation={step.expectedObservation}
            />

            <div>
              <p className="text-xs font-semibold text-neutral-400 mb-1">{step.title}</p>
              <h3 className="font-bold text-base">{step.instruction}</h3>
            </div>

            {step.expectedObservation && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-blue-600 mb-1">EXPECTED OBSERVATION</p>
                <p className="text-sm text-blue-900">{step.expectedObservation}</p>
              </div>
            )}

            {step.whyItWorks && (
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-amber-600 mb-1">WHY THIS WORKS</p>
                <p className="text-sm text-amber-900">{step.whyItWorks}</p>
              </div>
            )}

            {step.safetyNotes.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-red-500 mb-1">SAFETY</p>
                <ul className="space-y-0.5">
                  {step.safetyNotes.map((n, i) => <li key={i} className="text-sm text-red-800">• {n}</li>)}
                </ul>
              </div>
            )}

            {step.hints.length > 0 && (
              <div className="bg-neutral-50 border rounded-xl p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-neutral-500">HINTS ({revealed}/{step.hints.length})</p>
                  {revealed < step.hints.length && (
                    <button onClick={revealNext} className="text-xs font-semibold text-blue-600 hover:underline">
                      Reveal a hint
                    </button>
                  )}
                </div>
                {revealed > 0 && (
                  <ul className="space-y-1 mt-2">
                    {step.hints.slice(0, revealed).map((h, i) => (
                      <li key={i} className="text-sm text-neutral-600 flex gap-2"><span className="text-neutral-300">•</span> {h}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!isComplete && (
        <div className="px-5 py-4 border-t space-y-2">
          {/* Always show Skip button */}
          <Button
            variant={isCameraStep || needsValueInput ? "outline" : "default"}
            className="w-full"
            size="lg"
            onClick={() => onComplete("manual_skip")}
          >
            {isCameraStep || needsValueInput ? "Skip → Next Step" : "I've Completed This Step →"}
          </Button>
          {(isCameraStep || needsValueInput) && (
            <p className="text-[10px] text-center text-neutral-400">
              {isCameraStep ? "Camera will auto-approve when detected, or skip manually" : "Submit the value above, or skip manually"}
            </p>
          )}
          <button
            onClick={onLogMistake}
            className="w-full text-xs text-neutral-400 hover:text-red-600 font-medium py-1"
          >
            Log a mistake / retry {mistakes > 0 && `(${mistakes})`}
          </button>
        </div>
      )}
    </div>
  );
}
