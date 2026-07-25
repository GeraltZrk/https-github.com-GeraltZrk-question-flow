'use client';
import { useReducer } from "react";
import { reducer, initialState } from "@/state/reducer";
import { Badge } from "@/components/Badge";
import { Step1Input } from "@/components/Step1Input";
import { Step2Compare } from "@/components/Step2Compare";
import { Step3Result } from "@/components/Step3Result";

const STEPS = ["输入选择", "比较调整", "最终建议"];

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div style={{ maxWidth:640, margin:"0 auto", padding:"2rem 1rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <h1 style={{ margin:0 }}>枝见 Branchline</h1>
        <Badge mode={state.mode} />
      </div>
      <p style={{ color:"#666", fontSize:"0.85rem" }}>不做第一，做唯一</p>

      <div style={{ display:"flex", margin:"1.5rem 0" }}>
        {STEPS.map((l, i) => (
          <div key={l} style={{ flex:1, textAlign:"center", padding:"0.5rem", background: state.step===i+1?"#e8f0fe":state.step>i+1?"#f0f0f0":"#fff", borderBottom: state.step===i+1?"3px solid #1a73e8":"3px solid #ddd", fontWeight:state.step===i+1?700:400, fontSize:"0.8rem" }}>{i+1}. {l}</div>
        ))}
      </div>

      {state.step===1 && <Step1Input dispatch={dispatch} />}
      {state.step===2 && <Step2Compare state={state} dispatch={dispatch} />}
      {state.step===3 && <Step3Result state={state} />}

      <div style={{ display:"flex", justifyContent:"space-between", marginTop:"1.5rem" }}>
        <button onClick={() => dispatch({ type:"PREV_STEP" })} disabled={state.step===1} style={{ padding:"0.5rem 1.5rem" }}>上一步</button>
        <button onClick={() => dispatch({ type:"RESET" })} style={{ padding:"0.5rem 1.5rem", color:"#c00" }}>重置</button>
        <button onClick={() => dispatch({ type:"NEXT_STEP" })} disabled={state.step===3} style={{ padding:"0.5rem 1.5rem", background:"#1a73e8", color:"#fff", border:"none", borderRadius:4, cursor:"pointer" }}>下一步</button>
      </div>
    </div>
  );
}
