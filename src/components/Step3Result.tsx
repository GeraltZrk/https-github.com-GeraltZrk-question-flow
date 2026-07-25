'use client';
import type { AppState } from "@/state/reducer";

export function Step3Result({ state }: { state: AppState }) {
  if (!state.finalResult) return <div style={{ padding:"2rem", textAlign:"center", color:"#888" }}>尚未生成最终结果</div>;
  const fr = state.finalResult;
  const rec = state.candidates.find(c => c.id === fr.recommendedCandidateId);

  return (
    <div>
      <div style={{ background:"#e8f5e9", borderRadius:12, padding:"1.5rem", marginBottom:"1rem" }}>
        <p style={{ fontSize:"0.85rem", color:"#666" }}>推荐选择</p>
        <h2 style={{ margin:"0.25rem 0", color:"#2e7d32" }}>{rec?.name ?? fr.recommendedCandidateId}</h2>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        <div style={{ padding:"1rem", background:"#f5f5f5", borderRadius:8 }}>
          <strong>为什么适合你</strong>
          <p style={{ marginTop:"0.25rem", fontSize:"0.9rem" }}>{fr.whyForUser}</p>
        </div>

        <div style={{ padding:"1rem", background:"#f5f5f5", borderRadius:8 }}>
          <strong>调整如何改变结果</strong>
          <p style={{ marginTop:"0.25rem", fontSize:"0.9rem" }}>{fr.howAdjustmentChanged}</p>
        </div>

        <div style={{ padding:"1rem", background:"#f5f5f5", borderRadius:8 }}>
          <strong>主要代价</strong>
          <p style={{ marginTop:"0.25rem", fontSize:"0.9rem" }}>{fr.mainCost}</p>
        </div>

        {fr.missingEvidence && (
          <div style={{ padding:"1rem", background:"#fff3e0", borderRadius:8 }}>
            <strong>⚠ 仍缺信息</strong>
            <p style={{ marginTop:"0.25rem", fontSize:"0.9rem" }}>{fr.missingEvidence}</p>
          </div>
        )}

        <div style={{ padding:"1rem", background:"#e3f2fd", borderRadius:8 }}>
          <strong>下一步</strong>
          <p style={{ marginTop:"0.25rem", fontSize:"0.9rem" }}>{fr.nextStep}</p>
        </div>
      </div>
    </div>
  );
}
