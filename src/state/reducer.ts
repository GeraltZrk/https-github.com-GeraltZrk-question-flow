'use client';
import type { Choice, UserInput, Candidate, Ranking, Adjustment, FinalResult } from "@/domain/schema";
import { applyAdjustment, computeFinalResult } from "@/domain/rerank";
import { DEMO_CHOICE, DEMO_INPUTS, DEMO_CANDIDATES, DEMO_RANKING, DEMO_FINAL } from "@/fixtures/demoCase";

export type Step = 1 | 2 | 3;

export interface AppState {
  step: Step;
  mode: string;
  choice: Choice | null;
  inputs: UserInput[];
  candidates: Candidate[];
  ranking: Ranking | null;
  adjustments: Adjustment[];
  finalResult: FinalResult | null;
  loading: boolean;
}

export const initialState: AppState = {
  step: 1, mode: "idle", choice: null, inputs: [], candidates: [],
  ranking: null, adjustments: [], finalResult: null, loading: false,
};

export type Action =
  | { type: "NEXT_STEP" } | { type: "PREV_STEP" } | { type: "RESET" }
  | { type: "LOAD_DEMO" }
  | { type: "ADD_ADJUSTMENT"; adjustment: Adjustment }
  | { type: "FINALIZE" };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "NEXT_STEP": return { ...state, step: Math.min(3, state.step + 1) as Step };
    case "PREV_STEP": return { ...state, step: Math.max(1, state.step - 1) as Step };
    case "RESET": return { ...initialState };

    case "LOAD_DEMO":
      return { ...state, mode: "DEMO_FIXTURE", choice: DEMO_CHOICE, inputs: DEMO_INPUTS, candidates: DEMO_CANDIDATES, ranking: DEMO_RANKING, finalResult: DEMO_FINAL, adjustments: [] };

    case "ADD_ADJUSTMENT": {
      if (!state.ranking) return state;
      const adjustments = [...state.adjustments, action.adjustment];
      let ranking = state.ranking;
      // Apply cumulative adjustments
      for (const a of adjustments) {
        ranking = applyAdjustment(ranking, a, state.inputs);
      }
      const finalResult = computeFinalResult(ranking, state.inputs, state.candidates);
      return { ...state, adjustments, ranking, finalResult };
    }

    case "FINALIZE": {
      if (!state.ranking) return state;
      return { ...state, finalResult: computeFinalResult(state.ranking, state.inputs, state.candidates) };
    }

    default: return state;
  }
}
