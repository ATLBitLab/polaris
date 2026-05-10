import { NextResponse } from "next/server";
import { recordQuizCompletion } from "@/lib/analytics";
import { parseQuizInput, scoreQuiz } from "@/lib/quiz-engine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const input = parseQuizInput(body);

  if (!input) {
    return NextResponse.json({ error: "Invalid quiz input" }, { status: 400 });
  }

  const result = scoreQuiz(input);
  const analytics = await recordQuizCompletion(
    input,
    result.riskBand,
    result.score,
  );

  return NextResponse.json({
    saved: analytics.saved,
    riskBand: result.riskBand,
  });
}
