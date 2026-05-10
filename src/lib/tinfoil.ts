import "server-only";

import { TinfoilAI, toFile } from "tinfoil";
import {
  fallbackIncidentAnalysis,
  parseIncidentAnalysisResponse,
  type IncidentAnalysis,
  type IncidentDraft,
} from "./incident-report";
import {
  parseIncidentBlindingResponse,
  type IncidentBlindingOutput,
  type IncidentBlindingSource,
} from "./incident-blinding";
import { splitWavUpload, type TinfoilAudioUpload } from "./audio-format";

const transcriptionModel = "whisper-large-v3-turbo";
const defaultAnalysisModel = "llama3-3-70b";
const defaultBlindingModel = "llama3-3-70b";
const transcriptionChunkSeconds = 25;

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
  const chunks = splitWavUpload(upload, transcriptionChunkSeconds);
  const parts: string[] = [];
  let language: string | null = null;

  for (const chunk of chunks) {
    const transcription = await transcribeAudioChunk(client, chunk);
    parts.push(transcription.text);
    language ??= transcription.language;
  }

  return {
    text: parts.filter(Boolean).join(" ").trim(),
    model: transcriptionModel,
    language,
  };
}

async function transcribeAudioChunk(
  client: TinfoilAI,
  upload: TinfoilAudioUpload,
): Promise<{
  readonly text: string;
  readonly language: string | null;
}> {
  const audioFile = await toFile(upload.bytes, upload.filename, {
    type: upload.contentType,
  });

  const transcription = await client.audio.transcriptions.create({
    model: transcriptionModel,
    file: audioFile,
  });

  return {
    text: "text" in transcription ? transcription.text.trim() : "",
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
            "Extract people mentioned in this incident account. Return JSON only. Do not infer protected traits. Use unknown roles when names are unclear.",
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
    const parsed = parseIncidentAnalysisResponse(content);

    if (!parsed) {
      return { ...fallbackIncidentAnalysis(draft), aiUsed: false };
    }

    return { ...parsed, aiUsed: true };
  } catch (error) {
    console.error("Tinfoil incident analysis failed", error);
    return { ...fallbackIncidentAnalysis(draft), aiUsed: false };
  }
}

export async function blindIncidentForResearch(
  source: IncidentBlindingSource,
): Promise<IncidentBlindingOutput & { readonly model: string }> {
  const client = getTinfoilClient();
  const model =
    process.env.TINFOIL_BLINDING_MODEL ??
    process.env.TINFOIL_ANALYSIS_MODEL ??
    defaultBlindingModel;

  const response = await client.chat.completions.create({
    model,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "Blind incident documentation for approved researchers. Return JSON only. Remove names, contact details, exact addresses, precise coordinates, unique biographical details, usernames, account handles, employer or school specifics, and any detail that could identify a reporter, witness, target, or subject. Preserve incident type, rough chronology, rough geography, risk signals, evidence signals, and usefulness for response. Do not include email addresses, phone numbers, social handles, or contact methods.",
      },
      {
        role: "user",
        content: `Raw incident source for blinding:\n${JSON.stringify(
          sourceForModel(source),
        )}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "incident_blinding",
        schema: incidentBlindingSchema,
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  const parsed = parseIncidentBlindingResponse(content);

  if (!parsed) {
    throw new Error("Tinfoil returned malformed blinding JSON");
  }

  return { ...parsed, model };
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

function sourceForModel(source: IncidentBlindingSource) {
  return {
    reportId: source.reportId,
    incidentTimeKind: source.incidentTimeKind,
    incidentOccurredAt: source.incidentOccurredAt,
    incidentTimeNote: source.incidentTimeNote,
    locationSource: source.locationSource,
    locationLabel: source.locationLabel,
    coordinates:
      source.latitude === null || source.longitude === null
        ? null
        : {
            latitude: source.latitude,
            longitude: source.longitude,
          },
    narrativeText: source.narrativeText,
    transcriptText: source.transcriptText,
    people: source.people.map((person) => ({
      displayName: person.displayName,
      role: person.role,
      description: person.description,
      source: person.source,
      confidence: person.confidence ?? null,
    })),
  };
}

const incidentAnalysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["people"],
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
  },
} as const;

const incidentBlindingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "blindedNarrative",
    "blindedTranscript",
    "blindedPeople",
    "blindedLocationLabel",
    "coarseRegion",
    "dangerLevel",
    "evidencePresent",
    "physicalConfrontation",
  ],
  properties: {
    blindedNarrative: { type: "string" },
    blindedTranscript: { type: "string" },
    blindedPeople: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "role", "description"],
        properties: {
          label: { type: "string" },
          role: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    blindedLocationLabel: { type: "string" },
    coarseRegion: { type: "string" },
    dangerLevel: {
      type: "string",
      enum: [
        "immediate_attention_needed",
        "danger_expected_within_a_week",
        "not_immediate_danger",
        "unknown",
      ],
    },
    evidencePresent: {
      anyOf: [{ type: "boolean" }, { type: "null" }],
    },
    physicalConfrontation: {
      anyOf: [{ type: "boolean" }, { type: "null" }],
    },
  },
} as const;
