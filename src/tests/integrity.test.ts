import { describe, expect, it } from "vitest";

import {
  validateCaseIRReferences,
  validateIssueReferences,
} from "@/domain/integrity";
import { IssueSchema } from "@/domain/schema";
import {
  demoCaseIR,
  demoEvidence,
  demoIssues,
} from "@/fixtures/demo";

describe("reference integrity", () => {
  it("accepts the frozen demo evidence and CaseIR", () => {
    expect(validateCaseIRReferences(demoEvidence, demoCaseIR)).toEqual([]);
    expect(
      validateIssueReferences(demoEvidence, demoCaseIR, demoIssues),
    ).toEqual([]);
  });

  it("rejects a field that crosses question boundaries", () => {
    const crossed = structuredClone(demoCaseIR);
    const field = crossed.fields.find((candidate) => candidate.id === "f_y1");
    if (!field) throw new Error("Fixture field missing");
    field.questionId = "q14";

    expect(validateCaseIRReferences(demoEvidence, crossed)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "CROSS_QUESTION_REFERENCE" }),
      ]),
    );
  });

  it("rejects a normalized value that OCR text cannot support", () => {
    const forged = structuredClone(demoCaseIR);
    const field = forged.fields.find(
      (candidate) => candidate.id === "f_rate_8",
    );
    if (!field) throw new Error("Fixture field missing");
    field.normalized = 0.92;

    expect(validateCaseIRReferences(demoEvidence, forged)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "UNSUPPORTED_NORMALIZED_VALUE" }),
      ]),
    );
  });

  it("does not let the Critic choose its own blocking state", () => {
    expect(() =>
      IssueSchema.parse({
        ...demoIssues[0],
        blocking: true,
      }),
    ).toThrow();
  });
});
