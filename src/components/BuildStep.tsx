'use client';
import type { AppState, Action } from "@/state/reducer";
import * as XLSX from "xlsx";
import { compileNpvV1 } from "@/domain/npv";
import { buildNpvWorkbook, type BuildWorkbookInput, type WorkbookSourceRow } from "@/domain/workbook";

interface Props { state: AppState; dispatch: React.Dispatch<Action>; }

export function BuildStep({ state, dispatch }: Props) {
  if (!state.caseIR || !state.evidence) {
    return <div style={{ padding:"2rem", textAlign:"center", color:"#888" }}>No data loaded.</div>;
  }

  const q13Confirmed = state.confirmed.has("q13");
  const q13Fields = state.caseIR.fields.filter(f => f.questionId === "q13");
  const regionMap = new Map(state.evidence.regions.map(r => [r.id, r]));

  // Get resolved NPV input
  const resolvedFields = q13Fields.filter(f => {
    if (f.key !== "discountRate") return true;
    // Apply SELECT_CANDIDATE resolution
    const sel = state.resolutions.find(r => r.action === "SELECT_CANDIDATE" && r.questionId === "q13");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (sel) return f.id === (sel as any).selectedFieldId;
    return true; // If no selection, keep all (conflict unresolved)
  });

  const npvInput = {
    initialInvestment: resolvedFields.find(f => f.key === "initialInvestment")?.normalized ?? 0,
    discountRate: resolvedFields.find(f => f.key === "discountRate")?.normalized ?? 0,
    cashFlows: resolvedFields.filter(f => f.key === "cashFlow").map(f => ({ period: f.period ?? 1, value: f.normalized })),
    timing: (state.caseIR.timings.find(t => t.questionId === "q13")?.value ?? "UNRESOLVED") as "END_OF_PERIOD" | "BEGINNING_OF_PERIOD" | "UNRESOLVED",
  };

  let npvResult = null;
  try { npvResult = compileNpvV1(npvInput); } catch {}

  const exportXlsx = () => {
    if (!npvResult) return;
    const sources: WorkbookSourceRow[] = resolvedFields.map(f => {
      const r = regionMap.get(f.regionIds[0]);
      return {
        sourceId: f.id,
        fileName: r?.imageId ?? "",
        bbox: r ? `${r.bbox.x},${r.bbox.y},${r.bbox.w},${r.bbox.h}` : "",
        rawText: r?.rawText ?? "",
        transformRule: f.transformRule,
        resolutionId: state.resolutions.find(res => res.action === "SELECT_CANDIDATE" && res.selectedFieldId === f.id)?.id,
      };
    });

    const input: BuildWorkbookInput = {
      questionId: "q13",
      npvInput,
      compilation: npvResult,
      indexRows: state.caseIR!.questions.map(q => ({
        questionId: q.id,
        status: q.id === "q13" ? (q13Confirmed ? "CONFIRMED" : "READY") : "MISSING",
        exported: q.id === "q13",
      })),
      sourceIds: {
        discountRate: resolvedFields.find(f => f.key === "discountRate")?.id ?? "",
        initialInvestment: resolvedFields.find(f => f.key === "initialInvestment")?.id ?? "",
        cashFlows: resolvedFields.filter(f => f.key === "cashFlow").map(f => f.id),
        timing: state.caseIR!.timings.find(t => t.questionId === "q13")?.id ?? "",
      },
      sources,
    };

    const wb = buildNpvWorkbook(input);
    XLSX.writeFile(wb, "question-flow-q13.xlsx");
  };

  return (
    <div>
      <h3 style={{ marginBottom:"0.5rem" }}>Q13 NPV Workspace</h3>

      {/* Key Input Summary (D5: show before confirming) */}
      <div style={{ background:"#f5f5f5", borderRadius:8, padding:"1rem", marginBottom:"1rem" }}>
        <p style={{ fontWeight:600, marginBottom:"0.5rem" }}>Key Inputs Summary</p>
        <table style={{ width:"100%", fontSize:"0.85rem", borderCollapse:"collapse" }}>
          <tbody>
            <tr><td style={{ padding:"0.25rem 0", color:"#666" }}>Discount Rate</td><td>{npvInput.discountRate}</td></tr>
            <tr><td style={{ padding:"0.25rem 0", color:"#666" }}>Initial Investment</td><td>{npvInput.initialInvestment}</td></tr>
            {npvInput.cashFlows.map(cf => (
              <tr key={cf.period}><td style={{ padding:"0.25rem 0", color:"#666" }}>Cash Flow Y{cf.period}</td><td>{cf.value}</td></tr>
            ))}
            <tr><td style={{ padding:"0.25rem 0", color:"#666" }}>Timing</td><td>{npvInput.timing}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Source evidence */}
      <div style={{ marginBottom:"1rem" }}>
        <p style={{ fontWeight:600, marginBottom:"0.5rem" }}>Source Evidence</p>
        {resolvedFields.map(f => {
          const r = regionMap.get(f.regionIds[0]);
          return r ? (
            <div key={f.id} style={{ padding:"0.5rem", background:"#fff", border:"1px solid #ddd", borderRadius:4, marginBottom:"0.25rem", fontSize:"0.8rem" }}>
              <strong>{f.key}{f.period ? ` Y${f.period}` : ""}:</strong> {f.normalized} {f.unit} — <em style={{ color:"#888" }}>{r.rawText}</em>
            </div>
          ) : null;
        })}
      </div>

      {/* NPV Result */}
      {npvResult && (
        <div style={{ background:"#e8f5e9", borderRadius:8, padding:"1rem", marginBottom:"1rem" }}>
          <p style={{ fontWeight:600 }}>NPV Result</p>
          <p style={{ fontSize:"1.5rem", fontWeight:700, color:"#2e7d32" }}>{npvResult.displayValue}</p>
          <p style={{ fontSize:"0.8rem", color:"#666" }}>Formula: {npvResult.excelFormula}</p>
        </div>
      )}

      {/* Confirmation gate (D5) */}
      <div style={{ display:"flex", gap:"1rem", marginBottom:"1rem" }}>
        {!q13Confirmed ? (
          <button onClick={() => dispatch({ type: "CONFIRM_QUESTION", questionId: "q13" })} style={{ padding:"0.6rem 2rem", borderRadius:6, border:"none", background:"#1a73e8", color:"#fff", cursor:"pointer", fontWeight:600 }}>
            I have reviewed — Confirm & Generate Excel
          </button>
        ) : (
          <button onClick={exportXlsx} style={{ padding:"0.6rem 2rem", borderRadius:6, border:"none", background:"#34a853", color:"#fff", cursor:"pointer", fontWeight:600 }}>
            Download XLSX (Index / Q13_NPV / Sources)
          </button>
        )}
      </div>
    </div>
  );
}
