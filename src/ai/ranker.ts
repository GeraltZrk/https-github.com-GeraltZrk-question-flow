import { RankingSchema, type Ranking, type UserInput, type Candidate } from "@/domain/schema";
import { validateJudgmentEvidence } from "@/domain/integrity";
import { callOpenAI } from "./modelClient";
import { DEMO_RANKING } from "@/fixtures/demoCase";

const RANKER_PROMPT = `You are Branchline Ranker. Given a choice question, user inputs, and candidates, produce a Ranking object.

RULES:
1. You MUST output valid JSON matching the Ranking schema exactly.
2. Every judgment MUST have evidenceIds that ONLY reference the provided UserInput ids. DO NOT invent or fabricate evidence.
3. You MUST express a view: pick a clear recommendedId and order candidates. The first candidate is the recommendation.
4. Use high/med/low for personalMatch, feasibility, cost, risk. Never use numbers or scores.
5. If information is insufficient, set missingInfo on the judgment - do not guess.
6. The orderedCandidateIds array MUST include all candidates.

JSON SCHEMA:
{
  "orderedCandidateIds": ["cand-a", "cand-b", "cand-c"],
  "recommendedId": "cand-a",
  "judgments": [
    {
      "id": "j1",
      "candidateId": "cand-a",
      "personalMatch": "high",
      "feasibility": "high",
      "cost": "low",
      "risk": "low",
      "evidenceIds": ["g1", "i1"],
      "missingInfo": null
    }
  ]
}`;

export async function rankCandidates(
  choice: { question: string },
  inputs: UserInput[],
  candidates: Candidate[],
): Promise<Ranking> {
  const userPrompt = `Choice: ${choice.question}

User Inputs:
${inputs.map(i => `  ${i.id} (${i.kind}): ${i.text}`).join("\n")}

Candidates:
${candidates.map(c => `  ${c.id}: ${c.name}${c.factIds.length ? " (facts: " + c.factIds.join(",") + ")" : ""}`).join("\n")}

Return a Ranking JSON object.`;

  let raw: unknown;
  try {
    raw = await callOpenAI({ prompt: RANKER_PROMPT + "\n\n" + userPrompt, jsonSchema: {} });
  } catch (err) {
    throw new Error(`Ranker model call failed: ${err instanceof Error ? err.message : String(err)}`);
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
    throw new Error(`Ranker schema validation failed: ${parsed.error.message.slice(0, 200)}`);
  }

  const ranking = parsed.data;
  for (const j of ranking.judgments) {
    const errors = validateJudgmentEvidence(j, inputs);
    if (errors.length > 0) {
      throw new Error(`Ranker integrity failed: ${errors.map(e => e.message).join("; ")}`);
    }
  }

  return ranking;
}

/** Mock ranker for tests (no API key needed) */
export async function mockRankCandidates(
  _choice: { question: string },
  _inputs: UserInput[],
  _candidates: Candidate[],
): Promise<Ranking> {
  const p = RankingSchema.safeParse(DEMO_RANKING);
  if (p.success) return p.data;
  throw new Error("Mock ranking failed");
}
