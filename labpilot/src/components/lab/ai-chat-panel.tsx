"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMsg {
  role: "user" | "assistant";
  text: string;
}

interface AIChatPanelProps {
  experimentContext: {
    experimentTitle: string;
    currentStep: number;
    totalSteps: number;
    instruction: string;
    hints?: string[];
    commonErrors?: string[];
    safety?: string[];
  };
  onClose: () => void;
  onAsk?: (question: string) => void;
}

export function AIChatPanel({ experimentContext, onClose, onAsk }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", text: `Lab assistant for "${experimentContext.experimentTitle}". Ask me anything about this experiment.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: text.trim() }]);
    setInput("");
    setLoading(true);
    onAsk?.(text.trim());

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), experimentContext, chatHistory: messages }),
      });
      const data = await resp.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(data.reply);
        utter.rate = 1.0;
        window.speechSynthesis.speak(utter);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, I couldn't connect. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  // Voice input via MediaRecorder -> /api/stt (Groq Whisper). Works in Electron + browsers.
  async function toggleRecording() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "audio.webm");
          const resp = await fetch("/api/stt", { method: "POST", body: form });
          const data = await resp.json();
          if (data.text?.trim()) sendMessage(data.text.trim());
        } catch {
          /* ignore */
        } finally {
          setTranscribing(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      alert("Microphone access denied or unavailable.");
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm">Lab Assistant</h3>
        </div>
        <button onClick={onClose} className="text-neutral-400 hover:text-black text-lg">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === "user" ? "bg-black text-white rounded-br-md" : "bg-neutral-100 text-black rounded-bl-md"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {(loading || transcribing) && (
          <div className="flex justify-start">
            <div className="bg-neutral-100 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-neutral-500">
              {transcribing ? "Transcribing…" : (
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <button
          onClick={toggleRecording}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
            recording ? "bg-red-500 text-white animate-pulse" : "bg-neutral-100 hover:bg-neutral-200"
          }`}
          title={recording ? "Stop & transcribe" : "Voice input"}
        >
          🎤
        </button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage(input)}
          placeholder={recording ? "Listening…" : "Ask about the experiment..."}
          className="flex-1"
          disabled={loading}
        />
        <Button size="sm" onClick={() => sendMessage(input)} disabled={loading || !input.trim()}>Send</Button>
      </div>
    </div>
  );
}
