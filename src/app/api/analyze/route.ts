import { NextResponse } from "next/server";

import {
  COMPILER_PROMPT_VERSION,
  CRITIC_PROMPT_VERSION,
  OCR_VERSION,
  SCHEMA_VERSION,
} from "@/ai/contracts";
import { demoCaseIR, demoEvidence, demoIssues } from "@/fixtures/demo";

export async function GET() {
  return NextResponse.json({
    service: "question-flow-analyze",
    status: "ok",
    mode: process.env.QUESTIONFLOW_MODE ?? "fixture",
  });
}

export async function POST() {
  const mode = process.env.QUESTIONFLOW_MODE ?? "fixture";

  if (mode === "fixture") {
    return NextResponse.json({
      evidence: demoEvidence,
      caseIR: demoCaseIR,
      issues: demoIssues,
      mode: "DEMO_FIXTURE",
      versions: {
        schema: SCHEMA_VERSION,
        ocr: OCR_VERSION,
        compilerPrompt: COMPILER_PROMPT_VERSION,
        criticPrompt: CRITIC_PROMPT_VERSION,
      },
    });
  }

  return NextResponse.json(
    {
      code: "AI_NOT_WIRED",
      message:
        "Implement evidence preflight, compiler, reference validation, and critic before enabling live mode.",
    },
    { status: 501 },
  );
}
