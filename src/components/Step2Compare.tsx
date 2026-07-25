'use client';
import type { AppState, Action } from "@/state/reducer";
import { deriveStatus } from "@/domain/status";

const LEVEL_COLORS: Record<string, string> = { high: "#34a853", med: "#f9ab00", low: "#ea4335" };

export function Step2Compare({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<Action> }) {
  if (!state.ranking || !state.choice) return <div style={{ padding:"2rem", textAlign:"center", color:"#888" }}>请先载入示例数据</div>;

  const sorted = state.ranking.orderedCandidateIds.map(id => ({
    candidate: state.candidates.find(c => c.id === id),
    judgment: state.ranking!.judgments.find(j => j.candidateId === id),
  })).filter(x => x.candidate && x.judgment);

  return (
    <div>
      <h3 style={{ marginBottom:"0.5rem" }}>{state.choice.question}</h3>
      <p style={{ fontSize:"0.85rem", color:"#666", marginBottom:"1rem" }}>
        已根据你的个人信息排序。点击各操作按钮可调整。
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {sorted.map(({ candidate, judgment }) => {
          const st = deriveStatus(candidate!.id, state.ranking!);
          return (
            <div key={candidate!.id} style={{ border:"2px solid #ddd", borderRadius:8, padding:"1rem", background: st === "recommended" ? "#e8f5e9" : "#fff" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <strong>{candidate!.name}</strong>
                <span style={{ fontSize:"0.75rem", padding:"0.15rem 0.5rem", borderRadius:4, background: st === "recommended" ? "#34a853" : "#999", color:"#fff" }}>
                  {st === "recommended" ? "推荐" : st === "backup" ? "备选" : "不推荐"}
                </span>
              </div>
              <div style={{ display:"flex", gap:"1rem", marginTop:"0.5rem", fontSize:"0.85rem" }}>
                {(["personalMatch","feasibility","cost","risk"] as const).map(dim => (
                  <div key={dim}>
                    <span style={{ color:"#666" }}>{dim==="personalMatch"?"匹配":dim==="feasibility"?"可行性":dim==="cost"?"代价":"风险"}:</span>
                    <span style={{ color: LEVEL_COLORS[judgment![dim]], fontWeight:600, marginLeft:"0.25rem" }}>{judgment![dim]}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:"0.8rem", color:"#666", marginTop:"0.5rem" }}>
                依据: {judgment!.evidenceIds.map(eid => state.inputs.find(i => i.id === eid)?.text ?? eid).join(" | ")}
              </p>
              {judgment!.missingInfo && <p style={{ fontSize:"0.8rem", color:"#ea4335" }}>⚠ {judgment!.missingInfo}</p>}
              <div style={{ marginTop:"0.5rem", display:"flex", gap:"0.5rem" }}>
                <button onClick={() => dispatch({ type:"ADD_ADJUSTMENT", adjustment:{ type:"keep", targetId:candidate!.id } })} style={{ padding:"0.25rem 0.75rem", fontSize:"0.8rem", borderRadius:4, border:"1px solid #34a853", background:"#fff", color:"#34a853", cursor:"pointer" }}>保留</button>
                <button onClick={() => dispatch({ type:"ADD_ADJUSTMENT", adjustment:{ type:"reject", targetId:candidate!.id } })} style={{ padding:"0.25rem 0.75rem", fontSize:"0.8rem", borderRadius:4, border:"1px solid #ea4335", background:"#fff", color:"#ea4335", cursor:"pointer" }}>拒绝</button>
                <button onClick={() => dispatch({ type:"ADD_ADJUSTMENT", adjustment:{ type:"modify", targetId:candidate!.id, change:"调整评估" } })} style={{ padding:"0.25rem 0.75rem", fontSize:"0.8rem", borderRadius:4, border:"1px solid #f9ab00", background:"#fff", color:"#f9ab00", cursor:"pointer" }}>修改</button>
              </div>
            </div>
          );
        })}
      </div>
      {state.adjustments.length > 0 && (
        <div style={{ marginTop:"1rem", padding:"0.75rem", background:"#f5f5f5", borderRadius:6, fontSize:"0.8rem" }}>
          <strong>已应用 {state.adjustments.length} 次调整</strong>——排序已根据你的反馈更新。
        </div>
      )}
    </div>
  );
}
