const OPENAI_BASE = "https://api.openai.com/v1";

interface GenerateOptions {
  prompt: string;
  jsonSchema: object;
  images?: Array<{ id: string; mimeType: string; bytes: Uint8Array }>;
}

/**
 * Call OpenAI chat/completions with json_object response format.
 * Returns parsed JSON (unknown) - caller validates with Zod.
 */
export async function callOpenAI(opts: GenerateOptions): Promise<unknown> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");

  const content: Array<Record<string, unknown>> = [{ type: "text", text: opts.prompt }];
  if (opts.images) {
    for (const img of opts.images) {
      const b64 = Buffer.from(img.bytes).toString("base64");
      content.push({ type: "image_url", image_url: { url: `data:${img.mimeType};base64,${b64}` } });
    }
  }

  const body: Record<string, unknown> = {
    model: "gpt-4o",
    messages: [{ role: "user", content }],
    max_tokens: 4096,
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  // System message: reinforce JSON output. Only inject a schema if a real one
  // was provided — an empty {} schema makes the model return {} (it "conforms").
  const schemaStr = JSON.stringify(opts.jsonSchema ?? {});
  const systemContent =
    schemaStr && schemaStr !== "{}"
      ? `You must respond with a single JSON object conforming to this schema:\n${JSON.stringify(opts.jsonSchema, null, 2)}`
      : `You must respond with a single JSON object exactly as specified in the user message. Include every required field. Never return an empty object.`;
  body.messages = [
    { role: "system", content: systemContent },
    { role: "user", content },
  ];

  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as Record<string, unknown>;
  const choice = (data.choices as Array<{ message: { content: string } }>)?.[0];
  if (!choice?.message?.content) throw new Error("OpenAI returned no content");

  try {
    return JSON.parse(choice.message.content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }
}
