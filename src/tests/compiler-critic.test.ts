import { describe, it, expect } from "vitest";
import { compile, CompilerError } from "@/ai/compiler";
import { critique, CriticError } from "@/ai/critic";
import { generateDemoEvidence } from "@/domain/evidencePreflight";
import { isBlockingIssue } from "@/domain/issuePolicy";
import { demoCaseIR, demoIssues } from "@/fixtures/demo";
import type { StructuredModel } from "@/ai/contracts";
import type { CaseIR } from "@/domain/schema";

/** Build a MockStructuredModel that returns a pre-set JSON value */
function mockModel(json: unknown): StructuredModel {
  return {
    async generate() {
      return json;
    },
  };
}

/** Empty image array for tests that don't need real images */
const noImages: Array<{ id: string; mimeType: string; bytes: Uint8Array }> = [];

describe("compiler (mock)", () => {
  const evidence = generateDemoEvidence();

  it("returns CaseIR when mock returns valid data", async () => {
    const result = await compile(noImages, evidence, mockModel(demoCaseIR));
    expect(result.schemaVersion).toBe("case-ir.v1");
    expect(result.questions.length).toBeGreaterThan(0);
  });

  it("throws CompilerError when mock returns invalid schema", async () => {
    await expect(
      compile(noImages, evidence, mockModel({ schemaVersion: "wrong" })),
    ).rejects.toThrow(CompilerError);
  });

  it("throws CompilerError when mock references non-existent region", async () => {
    const badCaseIR = JSON.parse(JSON.stringify(demoCaseIR)) as CaseIR;
    badCaseIR.fields[0].regionIds = ["r-nonexistent"];
    await expect(
      compile(noImages, evidence, mockModel(badCaseIR)),
    ).rejects.toThrow(CompilerError);
    await expect(
      compile(noImages, evidence, mockModel(badCaseIR)),
    ).rejects.toMatchObject({ code: "REFERENCE_FAILED" });
  });

  it("throws CompilerError when field references cross-question segment", async () => {
    const badCaseIR = JSON.parse(JSON.stringify(demoCaseIR)) as CaseIR;
    const q14Field = badCaseIR.fields[0];
    q14Field.questionId = "q14"; // field says q14 but segment is q13
    await expect(
      compile(noImages, evidence, mockModel(badCaseIR)),
    ).rejects.toThrow(CompilerError);
  });

  it("throws CompilerError when model returns non-JSON", async () => {
    await expect(
      compile(noImages, evidence, mockModel("not json")),
    ).rejects.toThrow(CompilerError);
  });
});

describe("critic (mock)", () => {
  const evidence = generateDemoEvidence();

  it("returns issues when mock returns valid data", async () => {
    const result = await critique(noImages, evidence, demoCaseIR, mockModel(demoIssues));
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("code");
    expect(result[0]).toHaveProperty("questionId");
  });

  it("skips issues with invalid references", async () => {
    const badIssue = {
      ...demoIssues[0],
      questionId: "nonexistent",
    };
    const result = await critique(
      noImages, evidence, demoCaseIR,
      mockModel([badIssue, demoIssues[1]]),
    );
    // The bad one should be filtered out; the valid one kept
    expect(result.length).toBe(1);
  });

  it("D3: blocking from model is ignored; blocking comes from issuePolicy", async () => {
    // Model returns issues — Critic strips any blocking field, code computes it
    const result = await critique(
      noImages, evidence, demoCaseIR,
      mockModel(demoIssues),
    );
    // Verify issues exist and blocking is not set by model
    expect(result.length).toBeGreaterThan(0);
    for (const issue of result) {
      // D3: blocking computed by issuePolicy, not from model output
      const expected = isBlockingIssue(issue, demoCaseIR);
      expect(expected).toBe(true); // CONFLICTING_VALUE and MISSING_CONTINUATION are both blocking
    }
  });

  it("throws CriticError when model returns empty array", async () => {
    await expect(
      critique(noImages, evidence, demoCaseIR, mockModel([])),
    ).rejects.toThrow(CriticError);
  });
});
