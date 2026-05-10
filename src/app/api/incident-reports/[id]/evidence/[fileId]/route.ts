import { NextResponse } from "next/server";
import { removeEvidence } from "@/lib/incident-evidence";
import { getDeviceSourceFromRequest } from "@/lib/incident-store";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; fileId: string }> },
) {
  const { id, fileId } = await context.params;
  const result = await removeEvidence(
    id,
    getDeviceSourceFromRequest(request),
    fileId,
  );

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true });
}
