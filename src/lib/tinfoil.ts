import "server-only";

import { TinfoilAI, toFile } from "tinfoil";
import {
  fallbackIncidentAnalysis,
  parseIncidentAnalysisResponse,
  type IncidentAnalysis,
  type IncidentDraft,
} from "./incident-report";
import type { TinfoilAudioUpload } from "./audio-format";

const transcriptionModel = "whisper-large-v3-turbo";
const defaultAnalysisModel = "llama3-3-70b";

let cachedClient: TinfoilAI | null | undefined;

export function hasTinfoilConfig(): boolean {
  return Boolean(process.env.TINFOIL_API_KEY);
}

export async function transcribeIncidentAudio(upload: TinfoilAudioUpload): Promise<{
  readonly text: string;
  readonly model: string;
  readonly language: string | null;
}> {
  const client = getTinfoilClient();
  const audioFile = await toFile(upload.bytes, upload.filename, {
    type: upload.contentType,
  });

  const transcription = await client.audio.transcriptions.create({
    model: transcriptionModel,
    file: audioFile,
  });

  return {
    text: "text" in transcription ? transcription.text.trim() : "",
    model: transcriptionModel,
    language:
      "language" in transcription && typeof transcription.language === "string"
        ? transcription.language
        : null,
  };
}

export async function analyzeIncidentDraft(
  draft: IncidentDraft,
): Promise<IncidentAnalysis & { readonly aiUsed: boolean }> {
  const client = getTinfoilClient();
  const model = process.env.TINFOIL_ANALYSIS_MODEL ?? defaultAnalysisModel;
  const text = [draft.narrativeText, draft.transcriptText]
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n\n");

  if (text.length < 12) {
    return { ...fallbackIncidentAnalysis(draft), aiUsed: false };
  }

  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "Extract incident documentation metadata. Return JSON only. Do not infer protected traits. Use unknown roles when names are unclear. Keep advice practical and evidence-focused.",
        },
        {
          role: "user",
          content: `Incident account:\n${text}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "incident_analysis",
          schema: incidentAnalysisSchema,
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    const parsed = parseIncidentAnalysisResponse(content, draft);

    if (!parsed) {
      return { ...fallbackIncidentAnalysis(draft), aiUsed: false };
    }

    return { ...parsed, aiUsed: true };
  } catch (error) {
    console.error("Tinfoil incident analysis failed", error);
    return { ...fallbackIncidentAnalysis(draft), aiUsed: false };
  }
}

function getTinfoilClient(): TinfoilAI {
  if (cachedClient) {
    return cachedClient;
  }

  if (!process.env.TINFOIL_API_KEY) {
    throw new Error("Tinfoil is not configured");
  }

  cachedClient = new TinfoilAI({
    apiKey: process.env.TINFOIL_API_KEY,
  });

  return cachedClient;
}

const incidentAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["people", "checklist", "quality"],
  properties: {
    people: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["displayName", "role", "description", "source", "confidence"],
        properties: {
          displayName: { type: "string" },
          role: { type: "string" },
          description: { type: "string" },
          source: { type: "string", enum: ["ai"] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
    },
    checklist: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "rationale", "completed"],
        properties: {
          id: { type: "string", pattern: "^[a-z0-9][a-z0-9_-]{1,63}$" },
          label: { type: "string" },
          rationale: { type: "string" },
          completed: { type: "boolean" },
        },
      },
    },
    quality: {
      type: "object",
      additionalProperties: false,
      required: ["score", "feedback"],
      properties: {
        score: { type: "integer", minimum: 0, maximum: 100 },
        feedback: {
          type: "array",
          maxItems: 5,
          items: { type: "string" },
        },
      },
    },
  },
} as const;
