import { IssueSchema, type CaseIR, type EvidenceBundle, type Issue } from "@/domain/schema";
import { CRITIC_SYSTEM_PROMPT } from "./prompts";
import { createOpenAIModel, DEFAULT_CRITIC_MODEL } from "./modelClient";
import type { StructuredModel } from "./contracts";
import { z } from "zod";

export class CriticError extends Error {
  constructor(
    message: string,
    public readonly code: "VALIDATION_FAILED" | "REFERENCE_FAILED" | "MODEL_FAILED",
  ) {
    super(message);
    this.name = "CriticError";
  }
}

function zodToJsonSchema(schema: z.ZodType): object {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { zodToJsonSchema: z2j } = require("zod-to-json-schema") as { zodToJsonSchema: (s: z.ZodType) => object };
    return z2j(schema);
  } catch {
    return { type: "array", items: { type: "object" } };
  }
}

export async function critique(
  images: Array<{ id: string; mimeType: string; bytes: Uint8Array }>,
  evidence: EvidenceBundle,
  caseIR: CaseIR,
  model?: StructuredModel,
): Promise<Issue[]> {
  const m = model ?? createOpenAIModel(
    process.env.QUESTIONFLOW_CRITIC_MODEL || DEFAULT_CRITIC_MODEL,
  );

  const prompt = `${CRITIC_SYSTEM_PROMPT}\n\nCaseIR:\n${JSON.stringify(caseIR, null, 2)}`;
  const jsonSchema = zodToJsonSchema(IssueSchema.array());

  let raw: unknown;
  try {
    raw = await m.generate({ prompt, images, jsonSchema });
  } catch (err) {
    throw new CriticError(
      `Model call failed: ${err instanceof Error ? err.message : String(err)}`,
      "MODEL_FAILED",
    );
  }

  // Ensure it's an array
  const arr = Array.isArray(raw) ? raw : [raw];

  // Validate each issue
  const issues: Issue[] = [];
  const knownIds = new Set<string>();
  for (const q of caseIR.questions) knownIds.add(q.id);
  for (const s of caseIR.segments) knownIds.add(s.id);
  for (const f of caseIR.fields) knownIds.add(f.id);
  for (const t of caseIR.timings) knownIds.add(t.id);
  for (const r of evidence.regions) knownIds.add(r.id);

  for (const item of arr) {
    const parsed = IssueSchema.safeParse(item);
    if (!parsed.success) continue; // Skip invalid issues

    const issue = parsed.data;

    // Verify references exist
    if (!knownIds.has(issue.questionId)) continue;
    if (!issue.targetIds.every(id => knownIds.has(id))) continue;
    if (!issue.regionIds.every(id => knownIds.has(id))) continue;

    // D3: strip any blocking field that model might output
    issues.push({
      id: issue.id,
      questionId: issue.questionId,
      code: issue.code,
      targetIds: issue.targetIds,
      regionIds: issue.regionIds,
      message: issue.message,
    });
  }

  // Zero issues is a valid clean result (all READY)
  return issues;
}
