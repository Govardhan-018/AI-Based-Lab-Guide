import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// POST /api/stt — multipart form with an "audio" file. Transcribes via Groq Whisper.
// Used for voice input inside Electron (where the browser SpeechRecognition API is unavailable).
export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured", text: "" }, { status: 200 });
  }

  try {
    const formData = await req.formData();
    const audio = formData.get("audio") as File | null;
    if (!audio) {
      return NextResponse.json({ error: "No audio provided", text: "" }, { status: 400 });
    }

    const groqForm = new FormData();
    groqForm.append("file", audio, "audio.webm");
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("response_format", "json");

    const resp = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: groqForm,
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("[STT] Groq error:", err);
      return NextResponse.json({ error: "Transcription failed", text: "" });
    }

    const data = await resp.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (e) {
    console.error("[STT] Error:", e);
    return NextResponse.json({ error: "STT error", text: "" });
  }
}
