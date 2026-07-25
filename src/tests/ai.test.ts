import { describe, it, expect } from "vitest";
import { RankingSchema, AdjustmentSchema } from "@/domain/schema";
import { mockRankCandidates } from "@/ai/ranker";
import { mockRerank } from "@/ai/reranker";
import { DEMO_RANKING, DEMO_INPUTS, DEMO_CANDIDATES } from "@/fixtures/demoCase";

describe("ranker mock", () => {
  it("returns valid Ranking", async () => {
    const r = await mockRankCandidates({ question: "test" }, DEMO_INPUTS, DEMO_CANDIDATES);
    expect(RankingSchema.safeParse(r).success).toBe(true);
    expect(r.recommendedId).toBe("cand-viz");
    expect(r.orderedCandidateIds).toHaveLength(3);
  });

  it("all evidenceIds reference real inputs", async () => {
    const r = await mockRankCandidates({ question: "test" }, DEMO_INPUTS, DEMO_CANDIDATES);
    const inputIds = new Set(DEMO_INPUTS.map(i => i.id));
    for (const j of r.judgments) {
      for (const eid of j.evidenceIds) {
        expect(inputIds.has(eid)).toBe(true);
      }
    }
  });
});

describe("reranker mock", () => {
  it("reject lowers candidate position", () => {
    const adj = { type: "reject" as const, targetId: "cand-viz" };
    const r = mockRerank(DEMO_RANKING, adj, DEMO_INPUTS);
    expect(r.recommendedId).not.toBe("cand-viz");
  });

  it("modify improves candidate", () => {
    const adj = { type: "modify" as const, targetId: "cand-ml", change: "时间够了" };
    const r = mockRerank(DEMO_RANKING, adj, DEMO_INPUTS);
    const mlJudgment = r.judgments.find(j => j.candidateId === "cand-ml");
    expect(mlJudgment!.personalMatch).toBe("med");
  });

  it("keep does not change ordering", () => {
    const adj = { type: "keep" as const, targetId: "cand-viz" };
    const r = mockRerank(DEMO_RANKING, adj, DEMO_INPUTS);
    expect(r.recommendedId).toBe("cand-viz");
  });

  it("all evidenceIds still reference real inputs after rerank", () => {
    const adj = { type: "modify" as const, targetId: "cand-ml", change: "time ok" };
    const r = mockRerank(DEMO_RANKING, adj, DEMO_INPUTS);
    const inputIds = new Set(DEMO_INPUTS.map(i => i.id));
    for (const j of r.judgments) {
      for (const eid of j.evidenceIds) {
        expect(inputIds.has(eid)).toBe(true);
      }
    }
  });
});

describe("route contracts", () => {
  it("DEMO_RANKING is valid", () => {
    expect(RankingSchema.safeParse(DEMO_RANKING).success).toBe(true);
  });

  it("adjustment parse works", () => {
    expect(AdjustmentSchema.safeParse({ type: "reject", targetId: "x" }).success).toBe(true);
    expect(AdjustmentSchema.safeParse({ type: "invalid" }).success).toBe(false);
  });
});
