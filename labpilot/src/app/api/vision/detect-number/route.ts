import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
// llama-4-scout supports image input on Groq
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) return NextResponse.json({ detected: null });

  try {
    const { image } = await req.json(); // base64 JPEG string

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${image}` },
              },
              {
                type: "text",
                text: "Look at this image carefully. Is there a test tube, beaker, or container with a number written or labelled on it? If yes, what is that number? Reply with ONLY the number digit (e.g. '1', '2', '3'). If no number is clearly visible, reply with exactly the word 'none'.",
              },
            ],
          },
        ],
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!resp.ok) {
      console.error("[vision/detect-number] Groq error:", await resp.text());
      return NextResponse.json({ detected: null });
    }

    const data = await resp.json();
    const raw = (data.choices?.[0]?.message?.content || "none").trim();
    const num = parseInt(raw, 10);
    return NextResponse.json({ detected: isNaN(num) ? null : num });
  } catch (err) {
    console.error("[vision/detect-number]", err);
    return NextResponse.json({ detected: null });
  }
}
