import { NextRequest, NextResponse } from "next/server";

import {
  COMPILER_PROMPT_VERSION,
  CRITIC_PROMPT_VERSION,
  OCR_VERSION,
  SCHEMA_VERSION,
  type AnalyzeResponse,
} from "@/ai/contracts";
import { compile, CompilerError } from "@/ai/compiler";
import { critique, CriticError } from "@/ai/critic";
import { generateDemoEvidence } from "@/domain/evidencePreflight";
import { isBlockingIssue } from "@/domain/issuePolicy";
import { demoCaseIR, demoEvidence, demoIssues } from "@/fixtures/demo";

export async function GET() {
  return NextResponse.json({
    service: "question-flow-analyze",
    status: "ok",
    mode: process.env.QUESTIONFLOW_MODE ?? "fixture",
  });
}

export async function POST(request: NextRequest) {
  const mode = process.env.QUESTIONFLOW_MODE ?? "fixture";

  // ----- fixture mode: return frozen demo data -----
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
    } satisfies AnalyzeResponse);
  }

  // ----- live mode: real multimodal pipeline -----
  try {
    const formData = await request.formData();
    const imageEntries = formData.getAll("images");

    if (!imageEntries || imageEntries.length === 0) {
      return NextResponse.json(
        { code: "ANALYSIS_FAILED", message: "No images uploaded" },
        { status: 400 },
      );
    }

    // Step 1: Evidence Preflight (currently returns demo bundle; TODO: Tesseract)
    const evidence = generateDemoEvidence();

    // Step 2: Compiler
    const images = await Promise.all(
      imageEntries.map(async (entry, i) => {
        const file = entry as File;
        const buffer = await file.arrayBuffer();
        return {
          id: `img_${i}`,
          mimeType: file.type || "image/png",
          bytes: new Uint8Array(buffer),
        };
      }),
    );

    let caseIR;
    try {
      caseIR = await compile(images, evidence);
    } catch (err) {
      if (err instanceof CompilerError) {
        return NextResponse.json(
          { code: "ANALYSIS_FAILED", message: `Compiler: ${err.message}` },
          { status: 422 },
        );
      }
      throw err;
    }

    // Step 3: Critic
    let issues;
    try {
      issues = await critique(images, evidence, caseIR);
    } catch (err) {
      if (err instanceof CriticError) {
        return NextResponse.json(
          { code: "ANALYSIS_FAILED", message: `Critic: ${err.message}` },
          { status: 422 },
        );
      }
      throw err;
    }

    // Step 4: Compute blocking (D3: code, not model)
    for (const issue of issues) {
      (issue as Record<string, unknown>).blocking = isBlockingIssue(issue, caseIR);
    }

    return NextResponse.json({
      evidence,
      caseIR,
      issues,
      mode: "LIVE_AI",
      versions: {
        schema: SCHEMA_VERSION,
        ocr: OCR_VERSION,
        compilerPrompt: COMPILER_PROMPT_VERSION,
        criticPrompt: CRITIC_PROMPT_VERSION,
      },
    } satisfies AnalyzeResponse);
  } catch (err) {
    return NextResponse.json(
      {
        code: "ANALYSIS_FAILED",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
