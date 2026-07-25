import type {
  AnalyzeMode,
  CaseIR,
  EvidenceBundle,
  Issue,
} from "@/domain/schema";

export const SCHEMA_VERSION = "case-ir.v1" as const;
export const OCR_VERSION = "tesseract-v1" as const;
export const COMPILER_PROMPT_VERSION = "compiler-2026-07-25" as const;
export const CRITIC_PROMPT_VERSION = "critic-2026-07-25" as const;

export interface StructuredModel {
  generate(input: {
    prompt: string;
    images: Array<{
      id: string;
      mimeType: string;
      bytes: Uint8Array;
    }>;
    jsonSchema: object;
  }): Promise<unknown>;
}

export type AnalyzeResponse = {
  evidence: EvidenceBundle;
  caseIR: CaseIR;
  issues: Issue[];
  mode: AnalyzeMode;
  versions: {
    schema: typeof SCHEMA_VERSION;
    ocr: typeof OCR_VERSION;
    compilerPrompt: typeof COMPILER_PROMPT_VERSION;
    criticPrompt: typeof CRITIC_PROMPT_VERSION;
  };
};
