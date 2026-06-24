import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ reply: "AI is not configured. Set GROQ_API_KEY in .env.local" }, { status: 200 });
  }

  const { message, experimentContext, chatHistory } = await req.json();

  const systemPrompt = buildSystemPrompt(experimentContext);

  const messages: { role: string; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  if (chatHistory && Array.isArray(chatHistory)) {
    for (const msg of chatHistory.slice(-10)) {
      messages.push({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.text });
    }
  }

  messages.push({ role: "user", content: message });

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("[Chat API] Groq error:", err);
      return NextResponse.json({ reply: "I had trouble connecting. Please try again." });
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || "I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[Chat API] Error:", e);
    return NextResponse.json({ reply: "Something went wrong. Please try again." });
  }
}

function buildSystemPrompt(ctx?: {
  experimentTitle?: string;
  currentStep?: number;
  totalSteps?: number;
  instruction?: string;
  hints?: string[];
  commonErrors?: string[];
  materials?: string[];
  safety?: string[];
}): string {
  const parts = [
    "You are SenseBridge AI, a friendly and knowledgeable chemistry lab tutor.",
    "You guide students through chemistry experiments step by step.",
    "Be concise but helpful. Answer in 1-3 sentences unless the student asks for detail.",
    "Use encouraging language. If the student makes an error, guide them gently.",
    "",
  ];

  if (ctx) {
    if (ctx.experimentTitle) parts.push(`Current Experiment: ${ctx.experimentTitle}`);
    if (ctx.currentStep !== undefined && ctx.totalSteps) {
      parts.push(`Current Step (${ctx.currentStep + 1}/${ctx.totalSteps}): ${ctx.instruction || ""}`);
    }
    if (ctx.hints?.length) parts.push(`Hints: ${ctx.hints.join("; ")}`);
    if (ctx.commonErrors?.length) parts.push(`Common errors to watch for: ${ctx.commonErrors.join("; ")}`);
    if (ctx.safety?.length) parts.push(`Safety rules: ${ctx.safety.join("; ")}`);
    parts.push("");
  }

  return parts.join("\n");
}
