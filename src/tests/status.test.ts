import { describe, expect, it } from "vitest";

import { deriveQuestionStatus } from "@/domain/status";
import {
  demoCaseIR,
  demoIssues,
  demoSelectEightPercent,
} from "@/fixtures/demo";

describe("per-question gate", () => {
  it("starts with Q13 conflict and Q14 missing", () => {
    expect(deriveQuestionStatus("q13", demoCaseIR, demoIssues, [])).toBe(
      "CONFLICT",
    );
    expect(deriveQuestionStatus("q14", demoCaseIR, demoIssues, [])).toBe(
      "MISSING",
    );
  });

  it("resolves only Q13 when the user selects the supported 8% candidate", () => {
    const resolutions = [demoSelectEightPercent];

    expect(
      deriveQuestionStatus("q13", demoCaseIR, demoIssues, resolutions),
    ).toBe("READY");
    expect(
      deriveQuestionStatus("q14", demoCaseIR, demoIssues, resolutions),
    ).toBe("MISSING");
  });
});
