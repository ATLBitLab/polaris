import { NextResponse } from "next/server";
import {
  getDeviceSourceFromRequest,
  patchIncidentReport,
} from "@/lib/incident-store";

export const runtime = "nodejs";

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
