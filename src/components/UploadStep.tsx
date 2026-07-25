'use client';
import { demoEvidence, demoCaseIR, demoIssues } from "@/fixtures/demo";
import { SCHEMA_VERSION, OCR_VERSION, COMPILER_PROMPT_VERSION, CRITIC_PROMPT_VERSION } from "@/ai/contracts";
import type { Action } from "@/state/reducer";

interface Props { dispatch: React.Dispatch<Action>; loading: boolean; hasData: boolean; }

export function UploadStep({ dispatch, loading, hasData }: Props) {
  const loadDemo = () => {
    dispatch({ type: "SET_LOADING", loading: true });
    // Simulate async for UX
    setTimeout(() => {
      dispatch({
        type: "LOAD_ANALYSIS",
        response: {
          evidence: demoEvidence,
          caseIR: demoCaseIR,
          issues: demoIssues,
          mode: "DEMO_FIXTURE",
          versions: { schema: SCHEMA_VERSION, ocr: OCR_VERSION, compilerPrompt: COMPILER_PROMPT_VERSION, criticPrompt: CRITIC_PROMPT_VERSION },
        },
      });
    }, 400);
  };

  return (
    <div>
      <div style={{ border:"2px dashed #ccc", borderRadius:12, padding:"3rem 2rem", textAlign:"center", background:"#fafafa" }}>
        <p style={{ fontSize:"1.1rem", marginBottom:"0.5rem", color:"#333" }}>Drop question screenshots here</p>
        <p style={{ color:"#888", fontSize:"0.85rem", marginBottom:"1.5rem" }}>JPG/PNG · Max 5 images per batch</p>
        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap" }}>
          <button disabled style={{ padding:"0.6rem 2rem", borderRadius:6, border:"1px solid #ccc", background:"#eee", color:"#999" }}>Choose Files</button>
          <button onClick={loadDemo} disabled={loading} style={{ padding:"0.6rem 2rem", borderRadius:6, border:"none", background:loading?"#ccc":"#1a73e8", color:"#fff", cursor:loading?"not-allowed":"pointer", fontWeight:600 }}>
            {loading ? "Loading..." : "Load Demo Set"}
          </button>
        </div>
      </div>
      {hasData && <div style={{ marginTop:"1rem", padding:"0.75rem 1rem", background:"#e8f0fe", borderRadius:6, color:"#1a73e8" }}>Demo data loaded. Proceed to Step 2.</div>}
    </div>
  );
}
