import type { UserInput, Judgment, Candidate } from "./schema";
export type IntegrityError = { code: string; id?: string; message: string };
export function validateJudgmentEvidence(judgment: Judgment, inputs: UserInput[]): IntegrityError[] {
  const inputIds = new Set(inputs.map(i => i.id));
  return judgment.evidenceIds.filter(eid => !inputIds.has(eid)).map(eid => ({ code: "UNKNOWN_EVIDENCE", id: judgment.id, message: `${judgment.id} references unknown evidence ${eid}` }));
}
export function validateCandidateFacts(candidates: Candidate[], inputs: UserInput[]): IntegrityError[] {
  const factIds = new Set(inputs.filter(i => i.kind === "candidateFact").map(i => i.id));
  return candidates.flatMap(c => c.factIds.filter(fid => !factIds.has(fid)).map(fid => ({ code: "UNKNOWN_FACT", id: c.id, message: `${c.id} references unknown fact ${fid}` })));
}
