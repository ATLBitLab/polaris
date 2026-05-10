import { NextResponse } from "next/server";
import { isAuthorizedBlindingJobRequest } from "@/lib/blinding-job-auth";
import { processIncidentBlindingBatch } from "@/lib/npo-store";
import { hasTinfoilConfig } from "@/lib/tinfoil";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasTinfoilConfig()) {
    return NextResponse.json(
      { error: "Incident blinding is not configured" },
      { status: 503 },
    );
  }

  const limit = await readLimit(request);
  const result = await processIncidentBlindingBatch(limit);

  return NextResponse.json(result);
}

async function readLimit(request: Request): Promise<number> {
  try {
    const body = (await request.json()) as { readonly limit?: unknown };
    return normalizeLimit(body.limit);
  } catch {
    return 5;
  }
}

function normalizeLimit(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 5;
  }

  return Math.min(Math.max(Math.floor(value), 1), 25);
}

function isAuthorized(request: Request): boolean {
  return isAuthorizedBlindingJobRequest(
    request.headers.get("authorization"),
    process.env.BLINDING_JOB_SECRET,
  );
}
