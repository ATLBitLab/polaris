import { NextResponse } from "next/server";
import { getDeviceSourceFromRequest } from "@/lib/incident-store";
import { processIncidentBlindingForReport } from "@/lib/research-store";
import { hasTinfoilConfig } from "@/lib/tinfoil";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasTinfoilConfig()) {
    return NextResponse.json(
      { error: "Incident blinding is not configured" },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const result = await processIncidentBlindingForReport(
    id,
    getDeviceSourceFromRequest(request),
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.value, { status: 202 });
}
