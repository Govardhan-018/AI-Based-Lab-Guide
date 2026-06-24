"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Experiment } from "@/lib/db";
import { CameraFeed } from "./camera-feed";
import { AIChatPanel } from "./ai-chat-panel";
import { StepPanel } from "./step-panel";
import { CalculationPanel } from "./calculation-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/shared/score-ring";
import { Card } from "@/components/ui/card";

interface LabSessionProps {
  experiment: Experiment;
  studentId: string;
  studentName: string;
  assignmentId?: string;
}

interface FinalScores {
  understanding: number;
  safety: number;
  engagement: number;
  overall: number;
  xpEarned: number;
}

export function LabSession({ experiment, studentId, studentName, assignmentId }: LabSessionProps) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [elapsed, setElapsed] = useState("00:00");
  const [finished, setFinished] = useState(false);
  const [finalScores, setFinalScores] = useState<FinalScores | null>(null);
  const [pendingAutoApprove, setPendingAutoApprove] = useState<{ num: number; countdown: number } | null>(null);
  const [pendingColorApprove, setPendingColorApprove] = useState<{ label: string; countdown: number } | null>(null);
  const [calcSubmitted, setCalcSubmitted] = useState(false);
  const hasCalc = experiment.calculations?.enabled && (experiment.calculations.fields?.length ?? 0) > 0;

  // Captured images per step (base64 JPEG)
  const capturedImagesRef = useRef<Record<number, string>>({});

  const startTimeRef = useRef(Date.now());
  const stepStartRef = useRef(Date.now());
  const trackingRef = useRef(experiment.steps.map(() => ({ mistakes: 0, hints: 0 })));
  const autoApproveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, forceRender] = useState(0);

  const isComplete = currentStep >= experiment.steps.length;
  const step = experiment.steps[Math.min(currentStep, experiment.steps.length - 1)];

  // Determine what validation this step needs
  let effectiveTestTubeNumber: number | null = null;
  if (step?.testTubeNumber != null && String(step?.testTubeNumber).trim() !== "") {
    effectiveTestTubeNumber = Number(step.testTubeNumber);
  } else if (step?.instruction) {
    const match = step.instruction.match(/test tube\s*(?:labeled\s*)?(\d+)/i);
    if (match) effectiveTestTubeNumber = parseInt(match[1], 10);
  }

  const stepNeedsNumberScan = !isComplete && effectiveTestTubeNumber !== null;
  const stepNeedsColorScan = !isComplete && !!step?.colorValidation;
  const stepNeedsCamera = stepNeedsNumberScan || stepNeedsColorScan;
  const stepNeedsValueInput = !isComplete && !!step?.valueValidation;

  // Start the session
  useEffect(() => {
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, experimentId: experiment.id, assignmentId }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.session) setSessionId(d.session.id); })
      .catch(() => {});
  }, [studentId, experiment.id, assignmentId]);

  // Timer
  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => {
      const diff = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const m = Math.floor(diff / 60).toString().padStart(2, "0");
      const s = (diff % 60).toString().padStart(2, "0");
      setElapsed(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(t);
  }, [finished]);

  // Cancel pending auto-approve when the step changes
  useEffect(() => {
    if (autoApproveTimerRef.current) clearInterval(autoApproveTimerRef.current);
    setPendingAutoApprove(null);
    setPendingColorApprove(null);
  }, [currentStep]);

  const speak = useCallback((text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.97;
      u.lang = "en-IN";
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find((v) => v.lang === "en-IN") || voices.find((v) => v.lang.startsWith("en-IN")) || voices.find((v) => v.name.toLowerCase().includes("india"));
      if (indianVoice) u.voice = indianVoice;
      window.speechSynthesis.speak(u);
    }
  }, []);

  useEffect(() => {
    if (!isComplete && step) speak(`Step ${currentStep + 1}: ${step.instruction}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  function patchSession(body: Record<string, unknown>) {
    if (!sessionId) return Promise.resolve();
    return fetch(`/api/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  function completeStep(validationMethod?: string) {
    if (autoApproveTimerRef.current) clearInterval(autoApproveTimerRef.current);
    setPendingAutoApprove(null);
    setPendingColorApprove(null);

    const timeSpent = Math.round((Date.now() - stepStartRef.current) / 1000);
    const track = trackingRef.current[currentStep];
    patchSession({
      action: "step_complete",
      stepIndex: currentStep,
      mistakes: track.mistakes,
      hintsUsed: track.hints,
      timeSpentSec: timeSpent,
      capturedImage: capturedImagesRef.current[currentStep] || undefined,
      validationMethod: validationMethod || "manual",
    });

    const next = currentStep + 1;
    stepStartRef.current = Date.now();
    setCurrentStep(next);

    if (next >= experiment.steps.length && (!hasCalc || calcSubmitted)) finishSession();
  }

  async function finishSession() {
    setFinished(true);
    speak("Experiment completed. Calculating your score.");
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    if (!sessionId) return;
    try {
      const resp = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", durationSec }),
      });
      const data = await resp.json();
      if (data.session) {
        setFinalScores({ ...data.session.scores, xpEarned: data.session.xpEarned });
      }
    } catch { /* ignore */ }
  }

  function logMistake() {
    trackingRef.current[currentStep].mistakes += 1;
    forceRender((n) => n + 1);
    patchSession({ action: "add_mistake", stepIndex: currentStep });
  }

  function revealHint() {
    trackingRef.current[currentStep].hints += 1;
    patchSession({ action: "add_hint", stepIndex: currentStep });
  }

  function handlePanic() {
    patchSession({ action: "alert", severity: "emergency", message: "Student pressed the emergency button!" });
    speak("Emergency alert sent to your instructor. Stay calm and wait for help.");
    alert("Emergency alert sent to your instructor.");
  }

  function handleExit() {
    if (!finished && sessionId) {
      const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
      patchSession({ action: "end", status: "abandoned", durationSec });
    }
    window.speechSynthesis?.cancel();
    router.push("/student");
  }

  function handleCapture(base64: string) {
    capturedImagesRef.current[currentStep] = base64;
  }

  function handleNumberDetected(num: number) {
    const s = experiment.steps[currentStep];
    if (!s) return;

    let expectedNum: number | null = null;
    if (s.testTubeNumber != null && String(s.testTubeNumber).trim() !== "") {
      expectedNum = Number(s.testTubeNumber);
    } else if (s.instruction) {
      const match = s.instruction.match(/test tube\s*(?:labeled\s*)?(\d+)/i);
      if (match) expectedNum = parseInt(match[1], 10);
    }

    if (expectedNum === null || expectedNum !== num) return;
    if (pendingAutoApprove) return;

    speak(`Test tube number ${num} detected! Auto-approving in 3 seconds.`);

    let countdown = 3;
    setPendingAutoApprove({ num, countdown });
    autoApproveTimerRef.current = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(autoApproveTimerRef.current!);
        setPendingAutoApprove(null);
        completeStep("camera_number");
      } else {
        setPendingAutoApprove({ num, countdown });
      }
    }, 1000);
  }

  function handleColorDetected() {
    const s = experiment.steps[currentStep];
    if (!s?.colorValidation) return;
    if (pendingColorApprove) return;

    const label = s.colorValidation.label;
    speak(`${label} detected! Auto-approving in 3 seconds.`);

    let countdown = 3;
    setPendingColorApprove({ label, countdown });
    autoApproveTimerRef.current = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        clearInterval(autoApproveTimerRef.current!);
        setPendingColorApprove(null);
        completeStep("camera_color");
      } else {
        setPendingColorApprove({ label, countdown });
      }
    }, 1000);
  }

  // ---- Results screen ----
  if (finished) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-50 p-6">
        <Card className="max-w-lg w-full p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 className="text-2xl font-bold mb-1">Experiment Complete</h1>
          <p className="text-sm text-neutral-500 mb-6">{experiment.title}</p>

          {finalScores ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="text-center">
                  <ScoreRing score={finalScores.overall} size={120} strokeWidth={9} />
                  <p className="text-sm font-semibold mt-2">Overall Score</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <ScoreRing score={finalScores.understanding} size={56} strokeWidth={5} />
                  <p className="text-xs text-neutral-500 mt-1">Understanding</p>
                </div>
                <div className="text-center">
                  <ScoreRing score={finalScores.safety} size={56} strokeWidth={5} />
                  <p className="text-xs text-neutral-500 mt-1">Safety</p>
                </div>
                <div className="text-center">
                  <ScoreRing score={finalScores.engagement} size={56} strokeWidth={5} />
                  <p className="text-xs text-neutral-500 mt-1">Engagement</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl py-3 mb-6">
                <p className="text-lg font-bold text-amber-700">+{finalScores.xpEarned} XP earned</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-neutral-400 mb-6">Saving results…</p>
          )}

          <Button className="w-full" size="lg" onClick={() => router.push("/student")}>
            Back to Dashboard →
          </Button>
        </Card>
      </div>
    );
  }

  const headerBar = (
    <div className="flex items-center justify-between px-5 py-3 border-b">
      <div className="flex items-center gap-3">
        <button onClick={handleExit} className="text-sm text-neutral-400 hover:text-black font-medium">← Exit</button>
        <div className="w-px h-5 bg-neutral-200" />
        <h1 className="font-bold text-sm truncate">{experiment.title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {stepNeedsNumberScan && (
          <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[11px]">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5 inline-block animate-pulse" />
            CV #{effectiveTestTubeNumber}
          </Badge>
        )}
        {stepNeedsColorScan && (
          <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[11px]">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-1.5 inline-block animate-pulse" />
            Color: {step?.colorValidation?.label}
          </Badge>
        )}
        <Badge variant="outline" className="font-mono text-xs">{elapsed}</Badge>
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 inline-block animate-pulse" />Live
        </Badge>
      </div>
    </div>
  );

  const controlBar = (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => speak(step.instruction)}>Repeat</Button>
        <Button variant={showChat ? "default" : "outline"} size="sm" onClick={() => setShowChat(!showChat)}>
          {showChat ? "Hide" : "AI"} Assistant
        </Button>
      </div>
      <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handlePanic}>
        Emergency
      </Button>
    </div>
  );

  const safetyBar = (
    <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
      <p className="text-xs text-amber-800 leading-relaxed">
        <span className="font-semibold">Safety — </span>{experiment.safetyRules.join(" · ")}
      </p>
    </div>
  );

  const stepPanelElement = (
    <StepPanel
      step={step}
      stepIndex={currentStep}
      totalSteps={experiment.steps.length}
      isComplete={isComplete}
      onComplete={completeStep}
      onRevealHint={revealHint}
      onLogMistake={logMistake}
      mistakes={trackingRef.current[currentStep]?.mistakes || 0}
      cameraScanning={stepNeedsCamera && !pendingAutoApprove && !pendingColorApprove}
      needsValueInput={stepNeedsValueInput}
      valueValidation={step?.valueValidation}
    />
  );

  const chatPanelElement = (
    <AIChatPanel
      experimentContext={{
        experimentTitle: experiment.title,
        currentStep,
        totalSteps: experiment.steps.length,
        instruction: step?.instruction || "",
        hints: step?.hints,
        commonErrors: step?.commonErrors,
        safety: experiment.safetyRules,
      }}
      onClose={() => setShowChat(false)}
      onAsk={(q) => patchSession({ action: "chat", role: "student", text: q })}
    />
  );

  const calcPanelElement = isComplete && hasCalc && !calcSubmitted ? (
    <div className="flex-1 overflow-y-auto p-5">
      <CalculationPanel
        calculations={experiment.calculations!}
        onSubmit={() => { setCalcSubmitted(true); finishSession(); }}
      />
    </div>
  ) : null;

  // When camera is active: split layout (camera left, step/chat right)
  // When no camera: full-width step panel with AI chat as a slide-over
  if (stepNeedsCamera) {
    return (
      <div className="flex h-screen bg-white">
        <div className="flex-1 flex flex-col min-w-0">
          {headerBar}
          <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden">
            <CameraFeed
              active={!showChat}
              onNumberDetected={handleNumberDetected}
              onColorDetected={handleColorDetected}
              onCapture={handleCapture}
              scanForNumber={stepNeedsNumberScan && !showChat}
              scanForColor={stepNeedsColorScan && !showChat}
              targetNumber={effectiveTestTubeNumber || undefined}
              targetColor={step?.testTubeColor || undefined}
              colorHsvLower={step?.colorValidation?.hsvLower}
              colorHsvUpper={step?.colorValidation?.hsvUpper}
              colorMinPercent={step?.colorValidation?.minPercent}
              colorLabel={step?.colorValidation?.label}
              pendingAutoApprove={pendingAutoApprove}
              pendingColorApprove={pendingColorApprove}
            />
            {controlBar}
            {safetyBar}
          </div>
        </div>
        <div className="w-[380px] border-l flex flex-col shrink-0">
          {calcPanelElement || (showChat ? chatPanelElement : stepPanelElement)}
        </div>
      </div>
    );
  }

  // No camera — full-width layout
  return (
    <div className="flex flex-col h-screen bg-white">
      {headerBar}
      <div className="flex-1 flex min-h-0">
        {/* Main content — step panel takes full width */}
        <div className={`flex-1 flex flex-col min-w-0 ${showChat ? "" : ""}`}>
          {calcPanelElement || (
            <div className="flex-1 overflow-hidden">
              {stepPanelElement}
            </div>
          )}
          <div className="px-5 py-3 border-t flex items-center justify-between">
            {controlBar}
          </div>
          {safetyBar}
        </div>
        {/* AI chat slide-over panel */}
        {showChat && (
          <div className="w-[380px] border-l flex flex-col shrink-0">
            {chatPanelElement}
          </div>
        )}
      </div>
    </div>
  );
}
