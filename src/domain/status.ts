import type { Ranking } from "./schema";
export type CandidateStatus = "recommended" | "backup" | "not_recommended" | "insufficient_info";
export function deriveStatus(candidateId: string, ranking: Ranking): CandidateStatus {
  if (ranking.recommendedId === candidateId) return "recommended";
  const idx = ranking.orderedCandidateIds.indexOf(candidateId);
  if (idx < 0) return "not_recommended";
  const j = ranking.judgments.find(j => j.candidateId === candidateId);
  if (j?.missingInfo) return "insufficient_info";
  return idx === 1 ? "backup" : "not_recommended";
}
