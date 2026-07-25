import type { StructuredModel } from "./contracts";

const OPENAI_BASE = "https://api.openai.com/v1";

export function createOpenAIModel(modelName: string): StructuredModel {
  return {
    async generate({ prompt, images, jsonSchema }) {
      const key = process.env.OPENAI_API_KEY;
      if (!key) throw new Error("OPENAI_API_KEY is not set");

      // Build the messages array
      const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
      for (const img of images) {
        const b64 = Buffer.from(img.bytes).toString("base64");
        content.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${b64}`, detail: "auto" },
        });
      }

      const body: Record<string, unknown> = {
        model: modelName,
        messages: [{ role: "user", content }],
        max_tokens: 4096,
        temperature: 0.1,
      };

      // Use json_object mode — reliable with any JSON schema shape.
      // json_schema strict mode requires additionalProperties:false on every object,
      // which zod-to-json-schema does not guarantee.
      body.response_format = { type: "json_object" };
      // Include the expected schema in the prompt so the model follows it
      body.messages = [
        {
          role: "system",
          content: `You must respond with a single JSON object conforming to this schema:
${JSON.stringify(jsonSchema, null, 2)}`,
        },
        { role: "user", content },
      ];

      const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json() as Record<string, unknown>;
      const choice = (data.choices as Array<{ message: { content: string } }>)?.[0];
      if (!choice?.message?.content) {
        throw new Error("OpenAI returned no content");
      }

      try {
        return JSON.parse(choice.message.content);
      } catch {
        throw new Error("OpenAI returned invalid JSON");
      }
    },
  };
}

/** Default: gpt-4o is a multimodal model that supports vision + structured JSON. */
export const DEFAULT_COMPILER_MODEL = "gpt-4o";
export const DEFAULT_CRITIC_MODEL = "gpt-4o";
