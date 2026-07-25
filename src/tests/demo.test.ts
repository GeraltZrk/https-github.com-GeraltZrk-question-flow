import { describe, it, expect } from "vitest";
import { RankingSchema, SessionRecordSchema, AdjustmentSchema, type Ranking } from "@/domain/schema";
import { validateJudgmentEvidence, validateCandidateFacts } from "@/domain/integrity";
import { deriveStatus } from "@/domain/status";
import { applyAdjustment, computeFinalResult } from "@/domain/rerank";
import { DEMO_RANKING, DEMO_INPUTS, DEMO_CANDIDATES } from "@/fixtures/demoCase";
import { mockRankCandidates } from "@/ai/ranker";

describe("schema", () => {
  it("DEMO_RANKING passes validation", () => {
    expect(RankingSchema.safeParse(DEMO_RANKING).success).toBe(true);
  });
  it("valid adjustment passes", () => {
    expect(AdjustmentSchema.safeParse({ type: "keep", targetId: "j1" }).success).toBe(true);
  });
  it("invalid adjustment fails", () => {
    expect(AdjustmentSchema.safeParse({ type: "unknown", targetId: "j1" }).success).toBe(false);
  });
});

describe("integrity", () => {
  it("all demo judgments reference valid evidence", () => {
    for (const j of DEMO_RANKING.judgments) {
      const errors = validateJudgmentEvidence(j, DEMO_INPUTS);
      expect(errors).toHaveLength(0);
    }
  });
  it("detects unknown evidence", () => {
    const j = { ...DEMO_RANKING.judgments[0], evidenceIds: ["nonexistent"] };
    expect(validateJudgmentEvidence(j, DEMO_INPUTS).length).toBeGreaterThan(0);
  });
  it("validates candidate facts", () => {
    expect(validateCandidateFacts(DEMO_CANDIDATES, DEMO_INPUTS)).toHaveLength(0);
  });
});

describe("status", () => {
  it("recommended candidate returns recommended", () => {
    expect(deriveStatus("cand-viz", DEMO_RANKING)).toBe("recommended");
  });
  it("second candidate returns backup", () => {
    expect(deriveStatus("cand-biz", DEMO_RANKING)).toBe("backup");
  });
});

describe("rerank", () => {
  it("reject lowers scores and may reorder", () => {
    const result = applyAdjustment(DEMO_RANKING, { type: "reject", targetId: "cand-viz" }, DEMO_INPUTS);
    expect(result.orderedCandidateIds.length).toBe(3);
  });
  it("modify can change ordering", () => {
    const result = applyAdjustment(DEMO_RANKING, { type: "modify", targetId: "c1", change: "时间够了" }, DEMO_INPUTS);
    expect(result.orderedCandidateIds.length).toBe(3);
  });
  it("computeFinalResult returns structured output", () => {
    const r = computeFinalResult(DEMO_RANKING, DEMO_INPUTS, DEMO_CANDIDATES);
    expect(r.recommendedCandidateId).toBe("cand-viz");
    expect(r.nextStep).toBeTruthy();
  });
});

describe("ranker mock", () => {
  it("returns valid ranking", async () => {
    const r = await mockRankCandidates({ question: "test" }, DEMO_INPUTS, DEMO_CANDIDATES);
    expect(RankingSchema.safeParse(r).success).toBe(true);
  });
});
