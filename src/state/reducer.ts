'use client';
import type { AnalyzeResponse } from "@/ai/contracts";
import type { CaseIR, EvidenceBundle, Issue, Resolution, UserOverride } from "@/domain/schema";
import { deriveQuestionStatus } from "@/domain/status";
import { isBlockingIssue } from "@/domain/issuePolicy";
import { compileNpvV1, type NpvInput, type NpvCompilation } from "@/domain/npv";

export type Step = 1 | 2 | 3;

export interface AppState {
  step: Step;
  mode: string;
  loading: boolean;
  error: string | null;
  evidence: EvidenceBundle | null;
  caseIR: CaseIR | null;
  issues: Issue[] | null;
  resolutions: Resolution[];
  overrides: UserOverride[];
  confirmed: Set<string>;
  npvInput: NpvInput | null;
  npvResult: NpvCompilation | null;
}

export const initialState: AppState = {
  step: 1,
  mode: "idle",
  loading: false,
  error: null,
  evidence: null,
  caseIR: null,
  issues: null,
  resolutions: [],
  overrides: [],
  confirmed: new Set(),
  npvInput: null,
  npvResult: null,
};

export type Action =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "RESET" }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "LOAD_ANALYSIS"; response: AnalyzeResponse }
  | { type: "ADD_RESOLUTION"; resolution: Resolution }
  | { type: "CONFIRM_QUESTION"; questionId: string }
  | { type: "COMPUTE_NPV" };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "NEXT_STEP":
      return { ...state, step: Math.min(3, state.step + 1) as Step };
    case "PREV_STEP":
      return { ...state, step: Math.max(1, state.step - 1) as Step };
    case "RESET":
      return { ...initialState };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };

    case "LOAD_ANALYSIS": {
      const { evidence, caseIR, issues, mode } = action.response;
      return { ...state, mode, evidence, caseIR, issues, resolutions: [], overrides: [], confirmed: new Set(), npvInput: null, npvResult: null, loading: false };
    }

    case "ADD_RESOLUTION": {
      return { ...state, resolutions: [...state.resolutions, action.resolution] };
    }

    case "CONFIRM_QUESTION": {
      const confirmed = new Set(state.confirmed);
      confirmed.add(action.questionId);
      return { ...state, confirmed };
    }

    case "COMPUTE_NPV": {
      if (!state.caseIR) return state;
      const allFields = state.caseIR.fields.filter((f: { questionId: string }) => f.questionId === "q13");
      const chosenRate = state.resolutions.find((r: Resolution) => r.action === "SELECT_CANDIDATE" && r.questionId === "q13");
      const resolvedFields = chosenRate && "selectedFieldId" in (chosenRate as { selectedFieldId: string })
        ? allFields.filter((f: { key: string; id: string; normalized: number; period?: number }) => f.key !== "discountRate" || f.id === (chosenRate as { selectedFieldId: string }).selectedFieldId)
        : allFields;

      const timing = state.caseIR.timings.find((t: { questionId: string }) => t.questionId === "q13");

      const npvInput: NpvInput = {
        initialInvestment: resolvedFields.find((f: { key: string }) => f.key === "initialInvestment")?.normalized ?? 0,
        discountRate: resolvedFields.find((f: { key: string }) => f.key === "discountRate")?.normalized ?? 0,
        cashFlows: resolvedFields.filter((f: { key: string }) => f.key === "cashFlow").map((f: { period?: number; normalized: number }) => ({ period: f.period ?? 1, value: f.normalized })),
        timing: (timing?.value as NpvInput["timing"]) ?? "UNRESOLVED",
      };

      try {
        return { ...state, npvInput, npvResult: compileNpvV1(npvInput) };
      } catch {
        return { ...state, npvInput };
      }
    }

    default:
      return state;
  }
}

export function hasAnyBlocking(issues: Issue[], caseIR: CaseIR, resolutions: Resolution[]): boolean {
  for (const q of caseIR.questions) {
    const blk = issues.filter((i: Issue) => i.questionId === q.id && isBlockingIssue(i, caseIR) && !resolutions.some((r: Resolution) => r.issueId === i.id));
    if (blk.length > 0) return true;
  }
  return false;
}

export function questionStatus(state: AppState, questionId: string) {
  if (!state.caseIR || !state.issues) return "MISSING" as const;
  return deriveQuestionStatus(questionId, state.caseIR, state.issues, state.resolutions, state.overrides);
}
