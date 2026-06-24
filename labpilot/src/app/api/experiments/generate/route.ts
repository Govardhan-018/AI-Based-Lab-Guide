import { NextRequest, NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function POST(req: NextRequest) {
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 500 });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

    const systemPrompt = `You are an expert science teacher creating a detailed laboratory experiment protocol.
Given a description or topic, produce a fully structured experiment with numbered test tubes/containers.
Every single step MUST reference a test tube number the student should pick up and show to the camera.
Assign testTubeNumber (1, 2, 3 …) sequentially per unique reagent/vessel.
Respond ONLY with a single valid JSON object — no markdown, no prose, just the JSON.`;

    const userPrompt = `Create a complete lab experiment from this description:

"${prompt}"

Return this exact JSON shape:
{
  "title": "Short descriptive title",
  "description": "One paragraph overview",
  "difficulty": "beginner",
  "estimatedMinutes": 30,
  "theory": "Scientific background (2-3 sentences)",
  "purpose": "One sentence aim",
  "learningObjectives": ["objective 1", "objective 2"],
  "materials": ["Test tube 1 (reagent A)", "Test tube 2 (reagent B)", "Beaker 3 (mixing vessel)"],
  "safetyRules": ["safety rule 1", "safety rule 2"],
  "steps": [
    {
      "title": "Step title",
      "instruction": "Hold up test tube 1 (Copper Sulfate) to the camera, then do X...",
      "testTubeNumber": 1,
      "testTubeName": "Copper Sulfate",
      "testTubeColor": "pale_blue",
      "whyItWorks": "Scientific explanation",
      "expectedObservation": "What the student should see",
      "safetyNotes": ["safety note"],
      "hints": ["hint 1", "hint 2"],
      "commonErrors": ["common mistake"]
    }
  ]
}

Rules:
- EVERY step MUST involve a physical container and MUST have testTubeNumber, testTubeName, and testTubeColor set.
- Number containers sequentially starting at 1.
- testTubeColor MUST be exactly one of: "pale_blue", "dark_blue", "pale_yellow", "white_ppt", "white_precipitate", "white_transparent". Use the closest match or choose one randomly if unsure.
- 3-6 steps is ideal.
- All strings must be beginner-friendly.`;

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: 0.4,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("[experiments/generate] Groq error:", err);
      return NextResponse.json({ error: "Groq API error" }, { status: 500 });
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Extract JSON even if the model wraps it in markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in model response");

    const experiment = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ experiment });
  } catch (err) {
    console.error("[experiments/generate]", err);
    return NextResponse.json({ error: "Failed to generate experiment" }, { status: 500 });
  }
}
