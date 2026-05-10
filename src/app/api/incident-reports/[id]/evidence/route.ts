import { NextResponse } from "next/server";
import {
  addEvidence,
  evidenceMaxFileSizeBytes,
  isAllowedEvidenceMime,
  isAllowedEvidenceSize,
  listEvidence,
} from "@/lib/incident-evidence";
import { getDeviceSourceFromRequest } from "@/lib/incident-store";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await listEvidence(id, getDeviceSourceFromRequest(request));

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ files: result.value });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing file upload" },
      { status: 400 },
    );
  }

  if (!isAllowedEvidenceMime(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 415 },
    );
  }

  if (!isAllowedEvidenceSize(file.size)) {
    return NextResponse.json(
      {
        error: `File is too large. Max size is ${Math.floor(evidenceMaxFileSizeBytes / 1024 / 1024)} MB.`,
      },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await addEvidence(id, getDeviceSourceFromRequest(request), {
    bytes,
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ file: result.value });
}
