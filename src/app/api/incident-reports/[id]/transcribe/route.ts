import { NextResponse } from "next/server";
import {
  getDeviceSourceFromRequest,
  saveTranscript,
} from "@/lib/incident-store";
import { hasTinfoilConfig, transcribeIncidentAudio } from "@/lib/tinfoil";
import { prepareTinfoilAudioUpload } from "@/lib/audio-format";

export const runtime = "nodejs";

const maxAudioBytes = 25 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!hasTinfoilConfig()) {
    return NextResponse.json(
      { error: "Voice transcription is not configured" },
      { status: 503 },
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid audio upload" }, { status: 400 });
  }

  const audio = formData.get("audio");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  if (audio.size > maxAudioBytes) {
    return NextResponse.json({ error: "Audio file is too large" }, { status: 413 });
  }

  const { id } = await context.params;
  const bytes = new Uint8Array(await audio.arrayBuffer());
  const upload = prepareTinfoilAudioUpload(bytes, audio.name);

  if (!upload) {
    console.warn("Unsupported incident audio upload", {
      name: audio.name,
      type: audio.type,
      size: audio.size,
    });

    return NextResponse.json(
      { error: "Voice recording must be prepared as WAV or MP3 audio" },
      { status: 415 },
    );
  }

  try {
    const transcript = await transcribeIncidentAudio(upload);
    const saved = await saveTranscript(
      id,
      getDeviceSourceFromRequest(request),
      transcript,
    );

    if (!saved.ok) {
      return NextResponse.json(
        { error: saved.error },
        { status: saved.status },
      );
    }

    return NextResponse.json({
      transcript,
      report: saved.value,
    });
  } catch (error) {
    console.error("Unable to transcribe incident audio", error);
    return NextResponse.json(
      { error: "Unable to transcribe audio" },
      { status: 502 },
    );
  }
}
