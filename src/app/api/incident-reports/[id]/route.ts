import { NextResponse } from "next/server";
import {
  getDeviceSourceFromRequest,
  getIncidentReport,
  patchIncidentReport,
} from "@/lib/incident-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await getIncidentReport(
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = await context.params;
  const result = await patchIncidentReport(
    id,
    getDeviceSourceFromRequest(request),
    body,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ report: result.value });
}
