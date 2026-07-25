import { NextRequest, NextResponse } from "next/server";
import { DEMO_SESSION } from "@/fixtures/demoCase";
import { AdjustmentSchema, type Ranking } from "@/domain/schema";
import { rankCandidates } from "@/ai/ranker";
import { rerankCandidates } from "@/ai/reranker";

export async function GET() {
  return NextResponse.json({ service: "branchline-decide", status: "ok" });
}

export async function POST(request: NextRequest) {
  const mode = process.env.QUESTIONFLOW_MODE ?? "fixture";

  // ----- fixture mode: return frozen demo data -----
  if (mode === "fixture") {
    return NextResponse.json({ ...DEMO_SESSION, mode: "DEMO_FIXTURE" });
  }

  // ----- live mode: real AI pipeline -----
  try {
    const body = await request.json();
    const { action, choice, inputs, candidates, ranking, adjustment } = body;

    if (action === "rank") {
      if (!choice || !inputs || !candidates) {
        return NextResponse.json({ code: "BAD_REQUEST", message: "Missing choice/inputs/candidates" }, { status: 400 });
      }
      const result = await rankCandidates(choice, inputs, candidates);
      return NextResponse.json({ ranking: result, mode: "LIVE_AI" });
    }

    if (action === "rerank") {
      if (!ranking || !adjustment || !inputs) {
        return NextResponse.json({ code: "BAD_REQUEST", message: "Missing ranking/adjustment/inputs" }, { status: 400 });
      }
      const adjParsed = AdjustmentSchema.safeParse(adjustment);
      if (!adjParsed.success) {
        return NextResponse.json({ code: "BAD_REQUEST", message: `Invalid adjustment: ${adjParsed.error.message}` }, { status: 400 });
      }
      const result = await rerankCandidates(ranking as Ranking, adjParsed.data, inputs);
      return NextResponse.json({ ranking: result, mode: "LIVE_AI" });
    }

    return NextResponse.json({ code: "BAD_REQUEST", message: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { code: "ANALYSIS_FAILED", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
