// Gemini native generateContent client (PRD §12).
// Uses `x-goog-api-key` — never an OpenAI-compatible endpoint.

export interface GeminiResult {
  text: string;
}

export class GeminiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function generateContent(params: {
  systemInstruction: string;
  userText: string;
  model?: string;
  maxOutputTokens?: number;
}): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY is not configured.", 503);
  const model = params.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: params.userText }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: params.maxOutputTokens ?? 2048,
        },
      }),
    });
  } catch (e) {
    throw new GeminiError(`Gemini unreachable: ${(e as Error).message}`, 502);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new GeminiError(`Gemini error ${res.status}: ${body.slice(0, 300)}`, res.status);
  }

  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    promptFeedback?: { blockReason?: string };
  };
  if (json.promptFeedback?.blockReason) {
    throw new GeminiError(`Gemini blocked the request: ${json.promptFeedback.blockReason}`, 422);
  }
  const text = (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new GeminiError("Gemini returned an empty response.", 502);
  return { text };
}
