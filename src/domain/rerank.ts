import type { Ranking, Adjustment, UserInput, FinalResult } from "./schema";
function score(j: { personalMatch: string; feasibility: string; cost: string; risk: string }): number {
  const m: Record<string,number> = { high:3, med:2, low:1 };
  return m[j.personalMatch] + m[j.feasibility] + (3-m[j.cost]) + (3-m[j.risk]);
}
export function applyAdjustment(ranking: Ranking, adjustment: Adjustment, _inputs: UserInput[]): Ranking {
  const judgments = ranking.judgments.map(j => {
    if (j.candidateId !== adjustment.targetId && j.id !== adjustment.targetId) return j;
    if (adjustment.type === "keep") return j;
    if (adjustment.type === "reject") return { ...j, personalMatch: "low" as const, feasibility: "low" as const };
    return { ...j, personalMatch: (j.personalMatch==="low"?"med":"high") as typeof j.personalMatch, feasibility: (j.feasibility==="low"?"med":"high") as typeof j.feasibility };
  });
  const sorted = [...judgments].sort((a,b) => score(b) - score(a));
  return { orderedCandidateIds: sorted.map(j => j.candidateId), recommendedId: sorted[0].candidateId, judgments };
}
export function computeFinalResult(ranking: Ranking, inputs: UserInput[], candidates: { id:string; name:string }[]): FinalResult {
  const rec = ranking.judgments.find(j => j.candidateId === ranking.recommendedId);
  const name = candidates.find(c => c.id === ranking.recommendedId)?.name ?? ranking.recommendedId;
  const evidenceTexts = (rec?.evidenceIds ?? []).map(eid => inputs.find(i => i.id===eid)?.text ?? eid).join("; ");
  return { recommendedCandidateId: ranking.recommendedId, whyForUser: `${name} 最匹配——依据: ${evidenceTexts}`, howAdjustmentChanged: "排序已根据你的调整更新", mainCost: rec?.cost==="high"?"时间/精力投入较大":"代价可控", missingEvidence: rec?.missingInfo ?? undefined, nextStep: `确认选择 ${name}，并与相关人员确认细节` };
}
