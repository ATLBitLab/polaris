import { createHash } from "node:crypto";
import type {
  IncidentLocationSource,
  IncidentPerson,
  IncidentTimeKind,
} from "./incident-report";

export const blindingDangerLevels = [
  "immediate_attention_needed",
  "danger_expected_within_a_week",
  "not_immediate_danger",
  "unknown",
] as const;

export type BlindingDangerLevel = (typeof blindingDangerLevels)[number];

export type BlindedPerson = {
  readonly label: string;
  readonly role: string;
  readonly description: string;
};

export type IncidentBlindingSource = {
  readonly reportId: string;
  readonly updatedAt: string;
  readonly incidentTimeKind: IncidentTimeKind;
  readonly incidentOccurredAt: string | null;
  readonly incidentTimeNote: string;
  readonly locationSource: IncidentLocationSource;
  readonly locationLabel: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly narrativeText: string;
  readonly transcriptText: string;
  readonly people: readonly IncidentPerson[];
  readonly analysisMetadata: unknown;
};

export type IncidentBlindingOutput = {
  readonly blindedNarrative: string;
  readonly blindedTranscript: string;
  readonly blindedPeople: readonly BlindedPerson[];
  readonly blindedLocationLabel: string;
  readonly coarseRegion: string;
  readonly dangerLevel: BlindingDangerLevel;
  readonly evidencePresent: boolean | null;
  readonly physicalConfrontation: boolean | null;
};

const dangerLevelSet = new Set<string>(blindingDangerLevels);
const maxNarrativeLength = 20_000;
const maxShortTextLength = 500;
const maxPeople = 12;

export function buildIncidentBlindingSourceFingerprint(
  source: IncidentBlindingSource,
): string {
  const fingerprintSource = {
    incidentTimeKind: source.incidentTimeKind,
    incidentOccurredAt: source.incidentOccurredAt,
    incidentTimeNote: normalizeForHash(source.incidentTimeNote),
    locationSource: source.locationSource,
    locationLabel: normalizeForHash(source.locationLabel),
    latitude: source.latitude,
    longitude: source.longitude,
    narrativeText: normalizeForHash(source.narrativeText),
    transcriptText: normalizeForHash(source.transcriptText),
    people: source.people.map((person) => ({
      displayName: normalizeForHash(person.displayName),
      role: normalizeForHash(person.role),
      description: normalizeForHash(person.description),
      source: person.source,
      confidence: person.confidence ?? null,
    })),
    analysisMetadata: source.analysisMetadata ?? null,
  };

  return createHash("sha256")
    .update(stableStringify(fingerprintSource))
    .digest("hex");
}

export function parseIncidentBlindingResponse(
  content: unknown,
): IncidentBlindingOutput | null {
  const parsed = parseJsonContent(content);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  const blindedNarrative = normalizeText(
    candidate.blindedNarrative,
    maxNarrativeLength,
  );
  const blindedTranscript = normalizeText(
    candidate.blindedTranscript,
    maxNarrativeLength,
  );
  const blindedPeople = parseBlindedPeople(candidate.blindedPeople);
  const blindedLocationLabel = normalizeText(
    candidate.blindedLocationLabel,
    maxShortTextLength,
  );
  const coarseRegion = normalizeText(candidate.coarseRegion, maxShortTextLength);
  const dangerLevel = normalizeDangerLevel(candidate.dangerLevel);
  const evidencePresent = normalizeNullableBoolean(candidate.evidencePresent);
  const physicalConfrontation = normalizeNullableBoolean(
    candidate.physicalConfrontation,
  );

  if (
    blindedNarrative === null ||
    blindedTranscript === null ||
    !blindedPeople ||
    blindedLocationLabel === null ||
    coarseRegion === null ||
    !dangerLevel ||
    evidencePresent === undefined ||
    physicalConfrontation === undefined
  ) {
    return null;
  }

  return {
    blindedNarrative,
    blindedTranscript,
    blindedPeople,
    blindedLocationLabel,
    coarseRegion,
    dangerLevel,
    evidencePresent,
    physicalConfrontation,
  };
}

export function buildBlindedSearchText(
  blinding: Pick<
    IncidentBlindingOutput,
    | "blindedNarrative"
    | "blindedTranscript"
    | "blindedPeople"
    | "blindedLocationLabel"
    | "coarseRegion"
    | "dangerLevel"
  >,
): string {
  return [
    blinding.blindedNarrative,
    blinding.blindedTranscript,
    blinding.blindedLocationLabel,
    blinding.coarseRegion,
    blinding.dangerLevel,
    ...blinding.blindedPeople.flatMap((person) => [
      person.label,
      person.role,
      person.description,
    ]),
  ]
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, 40_000);
}

function parseBlindedPeople(value: unknown): readonly BlindedPerson[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const people: BlindedPerson[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candidate = item as Record<string, unknown>;
    const label = normalizeText(candidate.label, maxShortTextLength);
    const role = normalizeText(candidate.role, maxShortTextLength);
    const description = normalizeText(candidate.description, maxNarrativeLength);

    if (label === null || role === null || description === null) {
      return null;
    }

    people.push({ label, role, description });
  }

  return people.slice(0, maxPeople);
}

function normalizeDangerLevel(value: unknown): BlindingDangerLevel | null {
  return typeof value === "string" && dangerLevelSet.has(value)
    ? (value as BlindingDangerLevel)
    : null;
}

function normalizeNullableBoolean(value: unknown): boolean | null | undefined {
  if (value === null) {
    return null;
  }

  return typeof value === "boolean" ? value : undefined;
}

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeForHash(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseJsonContent(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const jsonText = fenced ? fenced[1] : trimmed;

  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const object = value as Record<string, unknown>;
  return `{${Object.keys(object)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
    .join(",")}}`;
}
