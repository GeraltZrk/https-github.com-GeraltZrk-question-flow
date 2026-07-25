import { isBlockingIssue } from "./issuePolicy";
import type {
  CaseIR,
  Issue,
  QuestionStatus,
  Resolution,
  UserOverride,
} from "./schema";

function resolutionClosesIssue(
  issue: Issue,
  resolution: Resolution,
  caseIR: CaseIR,
  overrides: UserOverride[],
): boolean {
  if (
    resolution.issueId !== issue.id ||
    resolution.questionId !== issue.questionId
  ) {
    return false;
  }

  if (resolution.action === "EXCLUDE_QUESTION") {
    return true;
  }

  if (resolution.action === "SELECT_CANDIDATE") {
    const selectedField = caseIR.fields.find(
      (field) => field.id === resolution.selectedFieldId,
    );
    return (
      issue.code === "CONFLICTING_VALUE" &&
      selectedField?.questionId === issue.questionId &&
      issue.targetIds.includes(resolution.selectedFieldId)
    );
  }

  if (resolution.action === "MANUAL_VALUE") {
    const override = overrides.find(
      (candidate) => candidate.id === resolution.overrideId,
    );
    return (
      override?.questionId === issue.questionId &&
      issue.code !== "MISSING_CONTINUATION"
    );
  }

  return (
    resolution.action === "SPLIT_SEGMENT" &&
    ["WRONG_MERGE", "ORPHAN_FRAGMENT"].includes(issue.code) &&
    issue.targetIds.includes(resolution.segmentId)
  );
}

export function unresolvedBlockingIssues(
  questionId: string,
  caseIR: CaseIR,
  issues: Issue[],
  resolutions: Resolution[],
  overrides: UserOverride[] = [],
): Issue[] {
  return issues.filter((issue) => {
    if (issue.questionId !== questionId || !isBlockingIssue(issue, caseIR)) {
      return false;
    }

    return !resolutions.some((resolution) =>
      resolutionClosesIssue(issue, resolution, caseIR, overrides),
    );
  });
}

export function deriveQuestionStatus(
  questionId: string,
  caseIR: CaseIR,
  issues: Issue[],
  resolutions: Resolution[],
  overrides: UserOverride[] = [],
): QuestionStatus {
  if (
    resolutions.some(
      (resolution) =>
        resolution.questionId === questionId &&
        resolution.action === "EXCLUDE_QUESTION",
    )
  ) {
    return "EXCLUDED";
  }

  const unresolved = unresolvedBlockingIssues(
    questionId,
    caseIR,
    issues,
    resolutions,
    overrides,
  );

  if (unresolved.some((issue) => issue.code === "MISSING_CONTINUATION")) {
    return "MISSING";
  }

  if (
    unresolved.some((issue) =>
      ["CONFLICTING_VALUE", "WRONG_MERGE"].includes(issue.code),
    )
  ) {
    return "CONFLICT";
  }

  if (unresolved.length > 0) {
    return "REVIEW";
  }

  const fields = caseIR.fields.filter(
    (field) => field.questionId === questionId,
  );
  const hasInitial = fields.some(
    (field) => field.key === "initialInvestment",
  );
  const hasRate = fields.some((field) => field.key === "discountRate");
  const cashFlowPeriods = new Set(
    fields
      .filter((field) => field.key === "cashFlow")
      .map((field) => field.period),
  );
  const timing = caseIR.timings.find(
    (candidate) => candidate.questionId === questionId,
  );

  if (!hasInitial || !hasRate || cashFlowPeriods.size === 0) {
    return "MISSING";
  }

  if (!timing || timing.value !== "END_OF_PERIOD") {
    return "REVIEW";
  }

  return "READY";
}
