import { describe, it, expect } from "vitest";
import { compile, CompilerError } from "@/ai/compiler";
import { critique, CriticError } from "@/ai/critic";
import { generateDemoEvidence } from "@/domain/evidencePreflight";
import { isBlockingIssue } from "@/domain/issuePolicy";
import { demoCaseIR, demoIssues } from "@/fixtures/demo";
import type { StructuredModel } from "@/ai/contracts";
import type { CaseIR } from "@/domain/schema";

function mockModel(json: unknown): StructuredModel {
  return { async generate() { return json; } };
}

const noImages: Array<{ id: string; mimeType: string; bytes: Uint8Array }> = [];

describe("compiler (mock)", () => {
  const evidence = generateDemoEvidence();

  it("returns CaseIR when mock returns valid data", async () => {
    const result = await compile(noImages, evidence, mockModel(demoCaseIR));
    expect(result.schemaVersion).toBe("case-ir.v1");
  });

  it("throws CompilerError when mock returns invalid schema", async () => {
    await expect(
      compile(noImages, evidence, mockModel({ schemaVersion: "wrong" })),
    ).rejects.toThrow(CompilerError);
  });

  it("throws CompilerError when mock references non-existent region", async () => {
    const bad = JSON.parse(JSON.stringify(demoCaseIR)) as CaseIR;
    bad.fields[0].regionIds = ["r-nonexistent"];
    await expect(compile(noImages, evidence, mockModel(bad))).rejects.toMatchObject({ code: "REFERENCE_FAILED" });
  });

  it("throws CompilerError when field references cross-question segment", async () => {
    const bad = JSON.parse(JSON.stringify(demoCaseIR)) as CaseIR;
    bad.fields[0].questionId = "q14";
    await expect(compile(noImages, evidence, mockModel(bad))).rejects.toThrow(CompilerError);
  });

  it("throws CompilerError when model returns non-JSON", async () => {
    await expect(compile(noImages, evidence, mockModel("not json"))).rejects.toThrow(CompilerError);
  });
});

describe("critic (mock)", () => {
  const evidence = generateDemoEvidence();

  it("returns issues when mock returns valid data (bare array)", async () => {
    const result = await critique(noImages, evidence, demoCaseIR, mockModel(demoIssues));
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("code");
  });

  it("handles json_object wrapped {issues:[...]} format", async () => {
    const result = await critique(
      noImages, evidence, demoCaseIR,
      mockModel({ issues: demoIssues }),
    );
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("code");
  });

  it("skips issues with invalid references", async () => {
    const badIssue = { ...demoIssues[0], questionId: "nonexistent" };
    const result = await critique(noImages, evidence, demoCaseIR, mockModel([badIssue, demoIssues[1]]));
    expect(result.length).toBe(1);
  });

  it("D3: blocking from model is ignored; blocking comes from issuePolicy", async () => {
    const result = await critique(noImages, evidence, demoCaseIR, mockModel(demoIssues));
    expect(result.length).toBeGreaterThan(0);
    for (const issue of result) {
      expect(isBlockingIssue(issue, demoCaseIR)).toBe(true);
    }
  });

  it("returns empty array when critic finds no issues (valid clean result)", async () => {
    const result = await critique(noImages, evidence, demoCaseIR, mockModel([]));
    expect(result).toEqual([]);
  });
});
