'use client';
import { useReducer } from "react";
import { reducer, initialState, hasAnyBlocking } from "@/state/reducer";
import { AnalysisBadge } from "@/components/AnalysisBadge";
import { UploadStep } from "@/components/UploadStep";
import { ReviewStep } from "@/components/ReviewStep";
import { BuildStep } from "@/components/BuildStep";

const STEPS = ["Upload", "Review", "Build & Export"];

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const canNext = state.step === 1
    ? (state.caseIR !== null)
    : state.step === 2
    ? (state.caseIR && state.issues && !hasAnyBlocking(state.issues, state.caseIR, state.resolutions))
    : true;

  const blockedCount = state.caseIR && state.issues
    ? state.caseIR.questions.reduce((sum, q) => {
        const blk = state.issues!.filter(i => i.questionId === q.id && !state.resolutions.some(r => r.issueId === i.id)).length;
        return sum + blk;
      }, 0)
    : 0;

  return (
    <div style={{ maxWidth:720, margin:"0 auto", padding:"2rem 1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.5rem" }}>
        <h1 style={{ margin:0 }}>QuestionFlow AI</h1>
        <AnalysisBadge mode={state.mode} />
      </div>
      {state.error && <p style={{ color:"#c62828", background:"#ffebee", padding:"0.5rem", borderRadius:4, fontSize:"0.85rem" }}>{state.error}</p>}

      {/* Stepper */}
      <div style={{ display:"flex", margin:"1.5rem 0" }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === state.step;
          const past = n < state.step;
          return <div key={label} style={{ flex:1, textAlign:"center", padding:"0.75rem 0.5rem", background:active?"#e8f0fe":past?"#f0f0f0":"#fff", borderBottom:active?"3px solid #1a73e8":"3px solid #ddd", fontWeight:active?700:400, color:past?"#888":"#333", fontSize:"0.85rem" }}>{n}. {label}</div>;
        })}
      </div>

      {state.step === 1 && <UploadStep dispatch={dispatch} loading={state.loading} hasData={state.caseIR !== null} />}
      {state.step === 2 && <ReviewStep state={state} dispatch={dispatch} />}
      {state.step === 3 && <BuildStep state={state} dispatch={dispatch} />}

      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"1.5rem" }}>
        <button onClick={() => dispatch({ type:"PREV_STEP" })} disabled={state.step===1} style={{ padding:"0.5rem 1.5rem" }}>Previous</button>
        <button onClick={() => dispatch({ type:"RESET" })} style={{ padding:"0.5rem 1.5rem", color:"#c00" }}>Reset</button>
        <button
          onClick={() => dispatch({ type:"NEXT_STEP" })}
          disabled={state.step===3 || !canNext}
          title={!canNext && blockedCount>0 ? `Still ${blockedCount} unresolved issue(s). QuestionFlow will not guess for you.` : undefined}
          style={{ padding:"0.5rem 1.5rem", background:canNext?"#1a73e8":"#ccc", color:canNext?"#fff":"#888", border:"none", borderRadius:4, cursor:canNext?"pointer":"not-allowed" }}
        >
          {!canNext && blockedCount>0 ? `Next (${blockedCount} unresolved)` : "Next"}
        </button>
      </div>
    </div>
  );
}
