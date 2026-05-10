export const incidentTimeKinds = [
  "unknown",
  "just_now",
  "an_hour_ago",
  "yesterday",
  "manual",
] as const;

export type IncidentTimeKind = (typeof incidentTimeKinds)[number];

export const locationSources = ["unknown", "browser", "manual"] as const;

export type IncidentLocationSource = (typeof locationSources)[number];

export type IncidentContactMethod = {
  readonly type: string;
  readonly value: string;
  readonly label?: string;
};

export type IncidentPerson = {
  readonly id?: string;
  readonly displayName: string;
  readonly role: string;
  readonly description: string;
  readonly source: "ai" | "user";
  readonly confidence?: number;
};

export type IncidentDraft = {
  readonly incidentTimeKind: IncidentTimeKind;
  readonly incidentOccurredAt: string | null;
  readonly incidentTimeNote: string;
  readonly locationSource: IncidentLocationSource;
  readonly locationLabel: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly locationAccuracyMeters: number | null;
  readonly narrativeText: string;
  readonly transcriptText: string;
  readonly people: readonly IncidentPerson[];
  readonly contactConsent: boolean | null;
  readonly contactMethods: readonly IncidentContactMethod[];
};

export type IncidentReportPatch = {
  readonly incidentTime?: {
    readonly kind: IncidentTimeKind;
    readonly occurredAt: string | null;
    readonly note: string;
  };
  readonly location?: {
    readonly source: IncidentLocationSource;
    readonly label: string;
    readonly latitude: number | null;
    readonly longitude: number | null;
    readonly accuracyMeters: number | null;
  };
  readonly narrativeText?: string;
  readonly transcriptText?: string;
  readonly people?: readonly IncidentPerson[];
  readonly contact?: {
    readonly consent: boolean;
    readonly methods: readonly IncidentContactMethod[];
  };
};

export type IncidentAnalysis = {
  readonly people: readonly IncidentPerson[];
};

export type IncidentClientReport = {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastAutosavedAt: string | null;
  readonly autosaveVersion: number;
  readonly submittedAt: string | null;
  readonly draft: IncidentDraft;
};

const maxNarrativeLength = 20_000;
const maxShortTextLength = 240;
const maxPeople = 12;

const timeKindSet = new Set<string>(incidentTimeKinds);
const locationSourceSet = new Set<string>(locationSources);

export function emptyIncidentDraft(): IncidentDraft {
  return {
    incidentTimeKind: "unknown",
    incidentOccurredAt: null,
    incidentTimeNote: "",
    locationSource: "unknown",
    locationLabel: "",
    latitude: null,
    longitude: null,
    locationAccuracyMeters: null,
    narrativeText: "",
    transcriptText: "",
    people: [],
    contactConsent: null,
    contactMethods: [],
  };
}

export function parseIncidentPatch(value: unknown): IncidentReportPatch | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const patch: {
    incidentTime?: IncidentReportPatch["incidentTime"];
    location?: IncidentReportPatch["location"];
    narrativeText?: string;
    transcriptText?: string;
    people?: readonly IncidentPerson[];
    contact?: IncidentReportPatch["contact"];
  } = {};

  if ("incidentTime" in candidate) {
    const incidentTime = parseIncidentTime(candidate.incidentTime);
    if (!incidentTime) {
      return null;
    }
    patch.incidentTime = incidentTime;
  }

  if ("location" in candidate) {
    const location = parseIncidentLocation(candidate.location);
    if (!location) {
      return null;
    }
    patch.location = location;
  }

  if ("narrativeText" in candidate) {
    const narrativeText = normalizeText(candidate.narrativeText, maxNarrativeLength);
    if (narrativeText === null) {
      return null;
    }
    patch.narrativeText = narrativeText;
  }

  if ("transcriptText" in candidate) {
    const transcriptText = normalizeText(candidate.transcriptText, maxNarrativeLength);
    if (transcriptText === null) {
      return null;
    }
    patch.transcriptText = transcriptText;
  }

  if ("people" in candidate) {
    const people = parseIncidentPeople(candidate.people);
    if (!people) {
      return null;
    }
    patch.people = people;
  }

  if ("contact" in candidate) {
    const contact = parseContact(candidate.contact);
    if (!contact) {
      return null;
    }
    patch.contact = contact;
  }

  return patch;
}

export function applyIncidentPatch(
  draft: IncidentDraft,
  patch: IncidentReportPatch,
): IncidentDraft {
  return {
    ...draft,
    incidentTimeKind: patch.incidentTime?.kind ?? draft.incidentTimeKind,
    incidentOccurredAt: patch.incidentTime
      ? patch.incidentTime.occurredAt
      : draft.incidentOccurredAt,
    incidentTimeNote: patch.incidentTime?.note ?? draft.incidentTimeNote,
    locationSource: patch.location?.source ?? draft.locationSource,
    locationLabel: patch.location?.label ?? draft.locationLabel,
    latitude: patch.location ? patch.location.latitude : draft.latitude,
    longitude: patch.location ? patch.location.longitude : draft.longitude,
    locationAccuracyMeters:
      patch.location ? patch.location.accuracyMeters : draft.locationAccuracyMeters,
    narrativeText: patch.narrativeText ?? draft.narrativeText,
    transcriptText: patch.transcriptText ?? draft.transcriptText,
    people: patch.people ?? draft.people,
    contactConsent: patch.contact?.consent ?? draft.contactConsent,
    contactMethods: patch.contact?.methods ?? draft.contactMethods,
  };
}

export function parseIncidentAnalysisResponse(
  content: unknown,
): IncidentAnalysis | null {
  const parsed = parseJsonContent(content);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  const people = parseIncidentPeople(candidate.people) ?? [];

  return { people };
}

export function fallbackIncidentAnalysis(draft: IncidentDraft): IncidentAnalysis {
  return { people: draft.people };
}

export function normalizeContactMethods(
  value: unknown,
): readonly IncidentContactMethod[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const methods: IncidentContactMethod[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candidate = item as Record<string, unknown>;
    const type = normalizeContactType(candidate.type);
    const methodValue = normalizeText(candidate.value, maxShortTextLength);
    const label = normalizeOptionalText(candidate.label, 80);

    if (!type || methodValue === null) {
      return null;
    }

    if (methodValue.length === 0) {
      continue;
    }

    if (type === "email" && !isEmailLike(methodValue)) {
      return null;
    }

    if (type === "phone" && !isPhoneLike(methodValue)) {
      return null;
    }

    methods.push({
      type,
      value: methodValue,
      ...(label ? { label } : {}),
    });
  }

  return methods.slice(0, 6);
}

export function isValidDeviceSource(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 32 &&
    value.length <= 256 &&
    /^[A-Za-z0-9._~:-]+$/.test(value)
  );
}

export function isValidReportId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function parseIncidentTime(value: unknown): IncidentReportPatch["incidentTime"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const kind = candidate.kind;
  const note = normalizeOptionalText(candidate.note, maxShortTextLength);

  if (typeof kind !== "string" || !timeKindSet.has(kind)) {
    return null;
  }

  const occurredAt =
    candidate.occurredAt === null || candidate.occurredAt === undefined
      ? null
      : normalizeIsoDate(candidate.occurredAt);

  if (occurredAt === undefined) {
    return null;
  }

  return {
    kind: kind as IncidentTimeKind,
    occurredAt,
    note: note ?? "",
  };
}

function parseIncidentLocation(
  value: unknown,
): IncidentReportPatch["location"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const source = candidate.source;
  const label = normalizeOptionalText(candidate.label, 500);
  const latitude = normalizeCoordinate(candidate.latitude, -90, 90);
  const longitude = normalizeCoordinate(candidate.longitude, -180, 180);
  const accuracyMeters = normalizeCoordinate(candidate.accuracyMeters, 0, 100_000);

  if (typeof source !== "string" || !locationSourceSet.has(source)) {
    return null;
  }

  if (
    latitude === undefined ||
    longitude === undefined ||
    accuracyMeters === undefined
  ) {
    return null;
  }

  if ((latitude === null) !== (longitude === null)) {
    return null;
  }

  return {
    source: source as IncidentLocationSource,
    label: label ?? "",
    latitude,
    longitude,
    accuracyMeters,
  };
}

function parseContact(value: unknown): IncidentReportPatch["contact"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const methods = normalizeContactMethods(candidate.methods);

  if (typeof candidate.consent !== "boolean" || !methods) {
    return null;
  }

  return {
    consent: candidate.consent,
    methods: candidate.consent ? methods : [],
  };
}

function parseIncidentPeople(value: unknown): readonly IncidentPerson[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const people: IncidentPerson[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candidate = item as Record<string, unknown>;
    const displayName = normalizeText(candidate.displayName, maxShortTextLength);
    const role = normalizeOptionalText(candidate.role, maxShortTextLength);
    const description = normalizeOptionalText(
      candidate.description,
      maxNarrativeLength,
    );
    const source = candidate.source === "ai" ? "ai" : "user";
    const confidence = normalizeConfidence(candidate.confidence);

    if (!displayName || confidence === undefined) {
      return null;
    }

    people.push({
      displayName,
      role: role ?? "",
      description: description ?? "",
      source,
      ...(confidence === null ? {} : { confidence }),
    });
  }

  return people.slice(0, maxPeople);
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

function normalizeText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeOptionalText(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === null || value === undefined) {
    return "";
  }

  return normalizeText(value, maxLength);
}

function normalizeIsoDate(value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function normalizeCoordinate(
  value: unknown,
  min: number,
  max: number,
): number | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  if (value < min || value > max) {
    return undefined;
  }

  return value;
}

function normalizeConfidence(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(0, Math.min(1, value));
}

function normalizeContactType(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const type = value.trim().toLowerCase();

  if (!/^[a-z][a-z0-9_-]{1,31}$/.test(type)) {
    return null;
  }

  return type;
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhoneLike(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 20;
}
