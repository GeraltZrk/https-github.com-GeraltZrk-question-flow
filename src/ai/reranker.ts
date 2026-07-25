import { RankingSchema, AdjustmentSchema, type Ranking, type Adjustment, type UserInput } from "@/domain/schema";
import { validateJudgmentEvidence } from "@/domain/integrity";
import { callOpenAI } from "./modelClient";

const RERANKER_PROMPT = `You are Branchline Reranker. Given an original Ranking and one Adjustment, produce a new Ranking.

RULES:
1. Apply the adjustment to the ranking. Re-evaluate and re-order.
2. If type is "reject": that candidate drops to the bottom. If "modify": reconsider with the change.
3. You MUST output valid JSON matching the Ranking schema.
4. Every judgment's evidenceIds MUST only reference the provided UserInput ids.
5. Express a clear view - pick a recommendedId.`;

export async function rerankCandidates(
  ranking: Ranking,
  adjustment: Adjustment,
  inputs: UserInput[],
): Promise<Ranking> {
  const userPrompt = `Original Ranking:\n${JSON.stringify(ranking, null, 2)}

Adjustment:\n${JSON.stringify(adjustment, null, 2)}

User Inputs (for evidence references):
${inputs.map(i => `  ${i.id}: ${i.text}`).join("\n")}

Return the updated Ranking JSON.`;

  let raw: unknown;
  try {
    raw = await callOpenAI({ prompt: RERANKER_PROMPT + "\n\n" + userPrompt, jsonSchema: {} });
  } catch (err) {
    throw new Error(`Reranker model call failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Robustness: normalize level-enum variants the model emits (medium->med, etc.)
  const LEVELS: Record<string, string> = { medium: "med", moderate: "med", m: "med", h: "high", l: "low" };
  if (raw && typeof raw === "object" && Array.isArray((raw as { judgments?: unknown[] }).judgments)) {
    for (const j of (raw as { judgments: Record<string, unknown>[] }).judgments) {
      for (const f of ["personalMatch", "feasibility", "cost", "risk"]) {
        const v = j[f];
        if (typeof v === "string") j[f] = LEVELS[v.toLowerCase()] ?? v.toLowerCase();
      }
    }
  }

  const parsed = RankingSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Reranker schema validation failed: ${parsed.error.message.slice(0, 200)}`);
  }

  const newRanking = parsed.data;
  for (const j of newRanking.judgments) {
    const errors = validateJudgmentEvidence(j, inputs);
    if (errors.length > 0) {
      throw new Error(`Reranker integrity failed: ${errors.map(e => e.message).join("; ")}`);
    }
  }

  return newRanking;
}

/** Deterministic mock reranker for tests */
export function mockRerank(
  ranking: Ranking,
  _adjustment: Adjustment,
  _inputs: UserInput[],
): Ranking {
  const parsed = AdjustmentSchema.safeParse(_adjustment);
  if (!parsed.success) throw new Error("Invalid adjustment");

  const judgments = ranking.judgments.map(j => {
    if (j.id !== _adjustment.targetId && j.candidateId !== _adjustment.targetId) return j;
    if (_adjustment.type === "reject") return { ...j, personalMatch: "low" as const, feasibility: "low" as const };
    if (_adjustment.type === "modify") return { ...j, personalMatch: (j.personalMatch === "low" ? "med" : "high") as typeof j.personalMatch };
    return j;
  });

  const score = (j: typeof judgments[0]) => {
    const m: Record<string, number> = { high: 3, med: 2, low: 1 };
    return m[j.personalMatch] + m[j.feasibility] + (3 - m[j.cost]) + (3 - m[j.risk]);
  };

  const sorted = [...judgments].sort((a, b) => score(b) - score(a));
  return { orderedCandidateIds: sorted.map(j => j.candidateId), recommendedId: sorted[0].candidateId, judgments };
}
