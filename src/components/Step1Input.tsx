'use client';
import type { Action } from "@/state/reducer";

export function Step1Input({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  return (
    <div>
      <div style={{ border:"2px dashed #ccc", borderRadius:12, padding:"3rem 2rem", textAlign:"center", background:"#fafafa" }}>
        <p style={{ fontSize:"1.1rem", marginBottom:"0.5rem" }}>枝见 Branchline</p>
        <p style={{ color:"#888", fontSize:"0.85rem", marginBottom:"1.5rem" }}>把你的个人情况和选项告诉我，我会给出有依据的排序建议</p>
        <button onClick={() => dispatch({ type: "LOAD_DEMO" })} style={{ padding:"0.6rem 2rem", borderRadius:6, border:"none", background:"#1a73e8", color:"#fff", cursor:"pointer", fontWeight:600 }}>
          载入示例（选课决策）
        </button>
      </div>
    </div>
  );
}
