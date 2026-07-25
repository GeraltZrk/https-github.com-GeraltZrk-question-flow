import { CaseIRSchema, type CaseIR, type EvidenceBundle } from "@/domain/schema";
import { validateCaseIRReferences } from "@/domain/integrity";
import { COMPILER_SYSTEM_PROMPT } from "./prompts";
import { createOpenAIModel, DEFAULT_COMPILER_MODEL } from "./modelClient";
import type { StructuredModel } from "./contracts";
import { z } from "zod";

export class CompilerError extends Error {
  constructor(
    message: string,
    public readonly code: "VALIDATION_FAILED" | "REFERENCE_FAILED" | "MODEL_FAILED",
  ) {
    super(message);
    this.name = "CompilerError";
  }
}

/** Build the user prompt: evidence regions + image IDs. */
function buildCompilerPrompt(evidence: EvidenceBundle): string {
  const regionList = evidence.regions
    .map(r => `  ${r.id} (img ${r.imageId}): "${r.rawText}"`)
    .join("\n");
  return `Compile the following evidence into CaseIR.\n\nImages: ${evidence.images.map(i => i.id).join(", ")}\n\nSourceRegions:\n${regionList}`;
}

/** Zod schema to JSON Schema (simple conversion for OpenAI) */
function zodToJsonSchema(schema: z.ZodType): object {
  // Use zod-to-json-schema internally via JSON
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { zodToJsonSchema: z2j } = require("zod-to-json-schema") as { zodToJsonSchema: (s: z.ZodType) => object };
  try {
    return z2j(schema);
  } catch {
    // Fallback: describe the expected shape
    return {
      type: "object",
      properties: {
        schemaVersion: { type: "string", enum: ["case-ir.v1"] },
        questions: { type: "array" },
        segments: { type: "array" },
        fields: { type: "array" },
        timings: { type: "array" },
        relations: { type: "array" },
      },
      required: ["schemaVersion", "questions", "segments", "fields", "timings", "relations"],
    };
  }
}

export async function compile(
  images: Array<{ id: string; mimeType: string; bytes: Uint8Array }>,
  evidence: EvidenceBundle,
  model?: StructuredModel,
): Promise<CaseIR> {
  const m = model ?? createOpenAIModel(
    process.env.QUESTIONFLOW_COMPILER_MODEL || DEFAULT_COMPILER_MODEL,
  );

  const prompt = `${COMPILER_SYSTEM_PROMPT}\n\n${buildCompilerPrompt(evidence)}`;
  const jsonSchema = zodToJsonSchema(CaseIRSchema);

  let raw: unknown;
  try {
    raw = await m.generate({ prompt, images, jsonSchema });
  } catch (err) {
    throw new CompilerError(
      `Model call failed: ${err instanceof Error ? err.message : String(err)}`,
      "MODEL_FAILED",
    );
  }

  // 1. Zod validation
  const parsed = CaseIRSchema.safeParse(raw);
  if (!parsed.success) {
    throw new CompilerError(
      `CaseIR validation failed: ${parsed.error.message.slice(0, 200)}`,
      "VALIDATION_FAILED",
    );
  }

  // 2. Reference integrity (D2: model cannot create regions)
  const refErrors = validateCaseIRReferences(evidence, parsed.data);
  if (refErrors.length > 0) {
    throw new CompilerError(
      `Reference integrity: ${refErrors.map((e: { code: string }) => e.code).join(", ")}`,
      "REFERENCE_FAILED",
    );
  }

  return parsed.data;
}
