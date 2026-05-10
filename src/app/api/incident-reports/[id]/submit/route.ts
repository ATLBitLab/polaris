import { NextResponse } from "next/server";
import {
  getDeviceSourceFromRequest,
  markIncidentReportSubmitted,
} from "@/lib/incident-store";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await markIncidentReportSubmitted(
    id,
    getDeviceSourceFromRequest(request),
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ report: result.value });
}
