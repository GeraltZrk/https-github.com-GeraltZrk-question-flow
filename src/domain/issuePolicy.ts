import type { CaseIR, Issue } from "./schema";

const ALWAYS_BLOCKING = new Set<Issue["code"]>([
  "UNSUPPORTED_VALUE",
  "WRONG_ROLE",
  "WRONG_MERGE",
  "CONFLICTING_VALUE",
  "AMBIGUOUS_TIME_OR_SIGN",
  "AMBIGUOUS_UNIT",
  "MISSING_CONTINUATION",
]);

export function isBlockingIssue(issue: Issue, caseIR: CaseIR): boolean {
  if (ALWAYS_BLOCKING.has(issue.code)) {
    return true;
  }

  if (issue.code !== "ORPHAN_FRAGMENT") {
    return false;
  }

  const requiredSegmentIds = new Set(
    caseIR.segments
      .filter(
        (segment) =>
          segment.questionId === issue.questionId &&
          segment.requiredContinuation,
      )
      .map((segment) => segment.id),
  );

  const formulaInputIds = new Set(
    caseIR.fields
      .filter((field) => field.questionId === issue.questionId)
      .flatMap((field) => [field.id, field.segmentId, ...field.regionIds]),
  );

  return issue.targetIds.some(
    (targetId) =>
      requiredSegmentIds.has(targetId) || formulaInputIds.has(targetId),
  );
}
