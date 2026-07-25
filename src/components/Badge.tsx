'use client';
export function Badge({ mode }: { mode: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    LIVE_AI: { label: "LIVE AI", bg: "#e8f5e9", color: "#2e7d32" },
    DEMO_FIXTURE: { label: "DEMO FIXTURE", bg: "#fff3e0", color: "#e65100" },
    CACHED_LIVE_AI: { label: "CACHED LIVE AI", bg: "#e3f2fd", color: "#1565c0" },
    ANALYSIS_FAILED: { label: "ANALYSIS FAILED", bg: "#ffebee", color: "#c62828" },
  };
  const c = cfg[mode];
  if (!c) return null;
  return <span style={{ display:"inline-block", padding:"0.15rem 0.6rem", borderRadius:4, fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.05em", background:c.bg, color:c.color }}>{c.label}</span>;
}
