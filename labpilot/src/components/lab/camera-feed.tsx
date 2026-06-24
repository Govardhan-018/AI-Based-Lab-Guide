"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface CameraFeedProps {
  active: boolean;
  onFrame?: (canvas: HTMLCanvasElement) => void;
  onNumberDetected?: (num: number) => void;
  onColorDetected?: (percent: number) => void;
  /** Called with a base64 JPEG of the validated frame */
  onCapture?: (base64: string) => void;
  scanForNumber?: boolean;
  scanForColor?: boolean;
  targetNumber?: number;
  targetColor?: string;
  /** HSV range for color validation */
  colorHsvLower?: [number, number, number];
  colorHsvUpper?: [number, number, number];
  colorMinPercent?: number;
  colorLabel?: string;
  pendingAutoApprove?: { num: number; countdown: number } | null;
  pendingColorApprove?: { label: string; countdown: number } | null;
}

export function CameraFeed({
  active,
  onFrame,
  onNumberDetected,
  onColorDetected,
  onCapture,
  scanForNumber,
  scanForColor,
  targetNumber,
  targetColor,
  colorHsvLower,
  colorHsvUpper,
  colorMinPercent,
  colorLabel,
  pendingAutoApprove,
  pendingColorApprove,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastDetected, setLastDetected] = useState<string | null>(null);

  const needsCamera = scanForNumber || scanForColor;

  useEffect(() => {
    if (!active || !needsCamera) { stopCamera(); return; }
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, needsCamera]);

  useEffect(() => {
    if (!cameraOn || !needsCamera) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        captureAndAnalyze();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraOn, needsCamera, scanForNumber, scanForColor, targetNumber, colorHsvLower, colorHsvUpper]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setError(null);
    } catch (e: unknown) {
      setError("Camera access denied: " + (e instanceof Error ? e.message : "unknown"));
      setCameraOn(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !captureCanvasRef.current || !cropCanvasRef.current) return;

    const video = videoRef.current;
    const capture = captureCanvasRef.current;
    const crop = cropCanvasRef.current;

    capture.width = 320;
    capture.height = 240;
    const ctx = capture.getContext("2d")!;
    ctx.drawImage(video, 0, 0, 320, 240);
    if (onFrame) onFrame(capture);

    const cw = 160;
    const ch = 120;
    const cx = (320 - cw) / 2;
    const cy = (240 - ch) / 2;

    crop.width = cw * 2;
    crop.height = ch * 2;
    const cctx = crop.getContext("2d")!;
    cctx.drawImage(capture, cx, cy, cw, ch, 0, 0, cw * 2, ch * 2);

    const base64Img = crop.toDataURL("image/jpeg", 0.8);
    setScanning(true);

    try {
      if (scanForNumber && targetNumber != null) {
        const res = await fetch("http://localhost:8000/analyze_frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Img,
            target_id: String(targetNumber),
            target_color: targetColor || null,
          }),
        });
        if (!res.ok) throw new Error("CV Backend returned " + res.status);
        const result = await res.json();
        if (result.match) {
          setLastDetected(`#${targetNumber}`);
          onNumberDetected?.(targetNumber);
          onCapture?.(base64Img);
        } else {
          setLastDetected(null);
        }
      } else if (scanForColor && colorHsvLower && colorHsvUpper) {
        const res = await fetch("http://localhost:8000/analyze_color", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Img,
            hsv_lower: colorHsvLower,
            hsv_upper: colorHsvUpper,
            min_percent: colorMinPercent ?? 2.0,
          }),
        });
        if (!res.ok) throw new Error("CV Backend returned " + res.status);
        const result = await res.json();
        if (result.match) {
          setLastDetected(colorLabel || "Color matched");
          onColorDetected?.(result.percent);
          onCapture?.(base64Img);
        } else {
          setLastDetected(null);
        }
      }
    } catch (err) {
      console.error("CV scan error:", err);
      setLastDetected(null);
    } finally {
      setScanning(false);
    }
  }, [onFrame, onNumberDetected, onColorDetected, onCapture, scanForNumber, scanForColor, targetNumber, targetColor, colorHsvLower, colorHsvUpper, colorMinPercent, colorLabel]);

  if (!needsCamera) return null;

  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
      <canvas ref={captureCanvasRef} className="hidden" />
      <canvas ref={cropCanvasRef} className="hidden" />

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-sm p-4 text-center">
          <p className="font-semibold mb-1">Camera Unavailable</p>
          <p className="text-neutral-400 text-xs">{error}</p>
          <button onClick={startCamera} className="mt-3 px-4 py-1.5 bg-white text-black text-xs font-semibold rounded-full hover:bg-neutral-200">
            Retry
          </button>
        </div>
      ) : !cameraOn ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-sm">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-3" />
          <p>Starting camera...</p>
        </div>
      ) : null}

      <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraOn ? "block" : "hidden"}`} />

      {cameraOn && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-[10px] font-semibold">LIVE</span>
        </div>
      )}

      {needsCamera && cameraOn && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full">
          {scanning ? (
            <>
              <div className="w-2 h-2 border border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-300 text-[10px] font-semibold">READING…</span>
            </>
          ) : lastDetected ? (
            <>
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-emerald-300 text-[10px] font-semibold">{lastDetected}</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-amber-300 text-[10px] font-semibold">READY</span>
            </>
          )}
        </div>
      )}

      {needsCamera && cameraOn && !pendingAutoApprove && !pendingColorApprove && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-1/2 h-1/2 border-2 border-white/60 rounded-lg flex items-end justify-center pb-2">
            <span className="text-white/70 text-[10px] font-semibold bg-black/40 px-2 py-0.5 rounded">
              {scanForNumber ? "Hold number here" : `Show ${colorLabel || "expected color"}`} · Press Space to scan
            </span>
          </div>
        </div>
      )}

      {pendingAutoApprove && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/80 backdrop-blur-sm">
          <div className="text-7xl font-black text-white mb-3">{pendingAutoApprove.countdown}</div>
          <p className="text-emerald-200 text-base font-semibold">Test tube #{pendingAutoApprove.num} detected!</p>
          <p className="text-emerald-300 text-sm mt-1">Auto-approving step…</p>
        </div>
      )}

      {pendingColorApprove && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-900/80 backdrop-blur-sm">
          <div className="text-7xl font-black text-white mb-3">{pendingColorApprove.countdown}</div>
          <p className="text-emerald-200 text-base font-semibold">{pendingColorApprove.label} detected!</p>
          <p className="text-emerald-300 text-sm mt-1">Auto-approving step…</p>
        </div>
      )}
    </div>
  );
}
