import { NextResponse } from "next/server";
import {
  getDeviceSourceFromRequest,
  loadIncidentDraftForAnalysis,
  saveIncidentAnalysis,
} from "@/lib/incident-store";
import { analyzeIncidentDraft, hasTinfoilConfig } from "@/lib/tinfoil";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasTinfoilConfig()) {
    return NextResponse.json(
      { error: "Incident analysis is not configured" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const deviceSource = getDeviceSourceFromRequest(request);
  const draft = await loadIncidentDraftForAnalysis(id, deviceSource);

  if (!draft.ok) {
    return NextResponse.json(
      { error: draft.error },
      { status: draft.status },
    );
  }

  const analysis = await analyzeIncidentDraft(draft.value);
  const saved = await saveIncidentAnalysis(id, deviceSource, analysis);

  if (!saved.ok) {
    return NextResponse.json(
      { error: saved.error },
      { status: saved.status },
    );
  }

  return NextResponse.json({
    aiUsed: analysis.aiUsed,
    report: saved.value,
  });
}
