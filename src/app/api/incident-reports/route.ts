import { NextResponse } from "next/server";
import {
  createIncidentReport,
  getDeviceSourceFromRequest,
} from "@/lib/incident-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await createIncidentReport(getDeviceSourceFromRequest(request));

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ report: result.value }, { status: 201 });
}
