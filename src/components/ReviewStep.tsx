'use client';
import type { AppState, Action } from "@/state/reducer";
import { questionStatus } from "@/state/reducer";
import { SourceCrop } from "./SourceCrop";
import { ResolutionSchema } from "@/domain/schema";

interface Props { state: AppState; dispatch: React.Dispatch<Action>; }

const STATUS_COLORS: Record<string, string> = {
  READY:    "#34a853",
  REVIEW:   "#f9ab00",
  CONFLICT: "#ea4335",
  MISSING:  "#9aa0a6",
  EXCLUDED: "#ccc",
};

function statusBg(s: string) {
  const c = STATUS_COLORS[s] || "#ccc";
  return `color-mix(in srgb, ${c} 15%, white)`;
}

export function ReviewStep({ state, dispatch }: Props) {
  if (!state.caseIR || !state.issues || !state.evidence) {
    return <div style={{ padding:"2rem", textAlign:"center", color:"#888" }}>No data loaded. Go back to Step 1.</div>;
  }

  const regionMap = new Map(state.evidence.regions.map(r => [r.id, r]));
  const questions = state.caseIR.questions;

  return (
    <div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {questions.map(q => {
          const st = questionStatus(state, q.id);
          const blk = state.issues!.filter(i => i.questionId === q.id && !state.resolutions.some(r => r.issueId === i.id)).length;
          const color = STATUS_COLORS[st] || "#ccc";
          const conflictIssue = state.issues!.find(i => i.questionId === q.id && i.code === "CONFLICTING_VALUE");

          return (
            <div key={q.id} style={{ border:`2px solid ${color}`, borderRadius:8, background:statusBg(st) }}>
              <div style={{ padding:"0.75rem 1rem", borderBottom:`1px solid ${color}20`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <strong>Q{q.questionNo ?? q.id}</strong>
                  <span style={{ marginLeft:"0.5rem", padding:"0.1rem 0.5rem", borderRadius:4, fontSize:"0.75rem", background:color, color:"#fff" }}>{st}</span>
                  {blk > 0 && <span style={{ marginLeft:"0.5rem", fontSize:"0.75rem", color:"#ea4335" }}>{blk} blocking</span>}
                </div>

                {/* Conflict resolution: SELECT_CANDIDATE */}
                {st === "CONFLICT" && conflictIssue && (
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    {state.caseIR!.fields
                      .filter(f => conflictIssue.targetIds.includes(f.id))
                      .map(f => (
                        <button key={f.id} onClick={() => {
                          const r = ResolutionSchema.parse({
                            id: `res_${Date.now()}`,
                            questionId: q.id,
                            issueId: conflictIssue.id,
                            action: "SELECT_CANDIDATE",
                            selectedFieldId: f.id,
                            createdAt: new Date().toISOString(),
                          });
                          dispatch({ type: "ADD_RESOLUTION", resolution: r });
                        }} style={{ padding:"0.3rem 0.8rem", borderRadius:4, border:"none", background:color, color:"#fff", cursor:"pointer", fontSize:"0.8rem" }}>
                          Select {f.normalized * 100}%
                        </button>
                      ))}
                  </div>
                )}

                {/* MISSING: EXCLUDE_QUESTION */}
                {st === "MISSING" && (
                  <button onClick={() => {
                    const missingIssue = state.issues!.find(i => i.questionId === q.id && i.code === "MISSING_CONTINUATION");
                    if (missingIssue) {
                      const r = ResolutionSchema.parse({
                        id: `res_${Date.now()}`,
                        questionId: q.id,
                        issueId: missingIssue.id,
                        action: "EXCLUDE_QUESTION",
                        createdAt: new Date().toISOString(),
                      });
                      dispatch({ type: "ADD_RESOLUTION", resolution: r });
                    }
                  }} style={{ padding:"0.3rem 0.8rem", borderRadius:4, border:"none", background:"#ea4335", color:"#fff", cursor:"pointer", fontSize:"0.8rem" }}>
                    Exclude
                  </button>
                )}
              </div>

              {/* Show segments and fields */}
              <div style={{ padding:"0.5rem 1rem", fontSize:"0.85rem" }}>
                {state.caseIR!.segments.filter(s => s.questionId === q.id).map(seg => (
                  <div key={seg.id} style={{ marginBottom:"0.5rem" }}>
                    <p style={{ color:"#666", margin:"0 0 0.25rem" }}>Segment {seg.id}:</p>
                    {seg.regionIds.map(rid => {
                      const region = regionMap.get(rid);
                      if (!region) return null;
                      return <SourceCrop key={rid} region={region} />;
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
