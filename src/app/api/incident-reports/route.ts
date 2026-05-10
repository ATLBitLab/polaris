import { NextResponse } from "next/server";
import {
  createIncidentReport,
  getDeviceSourceFromRequest,
} from "@/lib/incident-store";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const turnstileToken = request.headers.get("x-turnstile-token");
  const verification = await verifyTurnstileToken(turnstileToken);

  if (!verification.ok) {
    return NextResponse.json(
      { error: verification.error },
      { status: verification.status },
    );
  }

  const result = await createIncidentReport(getDeviceSourceFromRequest(request));

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ report: result.value }, { status: 201 });
}
