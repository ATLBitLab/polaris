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

export type IncidentChecklistItem = {
  readonly id: string;
  readonly label: string;
  readonly rationale: string;
  readonly completed: boolean;
};

export type IncidentQuality = {
  readonly score: number;
  readonly feedback: readonly string[];
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
  readonly checklist: readonly IncidentChecklistItem[];
  readonly contactConsent: boolean | null;
  readonly contactMethods: readonly IncidentContactMethod[];
  readonly partnerSharingConsent: boolean | null;
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
  readonly checklist?: readonly IncidentChecklistItem[];
  readonly contact?: {
    readonly consent: boolean;
    readonly methods: readonly IncidentContactMethod[];
  };
  readonly partnerSharing?: {
    readonly consent: boolean;
  };
};

export type IncidentAnalysis = {
  readonly people: readonly IncidentPerson[];
  readonly checklist: readonly IncidentChecklistItem[];
  readonly quality: IncidentQuality;
};

export type IncidentClientReport = {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastAutosavedAt: string | null;
  readonly autosaveVersion: number;
  readonly draft: IncidentDraft;
  readonly quality: IncidentQuality;
};

const maxNarrativeLength = 20_000;
const maxShortTextLength = 240;
const maxChecklistItems = 8;
const maxPeople = 12;

const timeKindSet = new Set<string>(incidentTimeKinds);
const locationSourceSet = new Set<string>(locationSources);

export function emptyIncidentDraft(): IncidentDraft {
  const draft = {
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
    checklist: [],
    contactConsent: null,
    contactMethods: [],
    partnerSharingConsent: null,
  } satisfies IncidentDraft;

  return {
    ...draft,
    checklist: buildIncidentChecklist(draft),
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
    checklist?: readonly IncidentChecklistItem[];
    contact?: IncidentReportPatch["contact"];
    partnerSharing?: IncidentReportPatch["partnerSharing"];
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

  if ("checklist" in candidate) {
    const checklist = parseChecklist(candidate.checklist);
    if (!checklist) {
      return null;
    }
    patch.checklist = checklist;
  }

  if ("contact" in candidate) {
    const contact = parseContact(candidate.contact);
    if (!contact) {
      return null;
    }
    patch.contact = contact;
  }

  if ("partnerSharing" in candidate) {
    const partnerSharing = parsePartnerSharing(candidate.partnerSharing);
    if (!partnerSharing) {
      return null;
    }
    patch.partnerSharing = partnerSharing;
  }

  return patch;
}

export function applyIncidentPatch(
  draft: IncidentDraft,
  patch: IncidentReportPatch,
): IncidentDraft {
  const next: IncidentDraft = {
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
    checklist: patch.checklist ?? draft.checklist,
    contactConsent: patch.contact?.consent ?? draft.contactConsent,
    contactMethods: patch.contact?.methods ?? draft.contactMethods,
    partnerSharingConsent:
      patch.partnerSharing?.consent ?? draft.partnerSharingConsent,
  };

  return {
    ...next,
    checklist:
      patch.checklist ??
      (shouldRebuildIncidentChecklist(patch)
        ? buildIncidentChecklist(next, draft.checklist)
        : draft.checklist),
  };
}

export function shouldRebuildIncidentChecklist(
  patch: IncidentReportPatch,
): boolean {
  return patch.narrativeText !== undefined || patch.transcriptText !== undefined;
}

export function calculateIncidentQuality(
  draft: Pick<
    IncidentDraft,
    | "incidentTimeKind"
    | "incidentOccurredAt"
    | "locationLabel"
    | "latitude"
    | "longitude"
    | "narrativeText"
    | "transcriptText"
    | "people"
    | "contactConsent"
  >,
): IncidentQuality {
  const text = combinedNarrative(draft);
  let score = 0;
  const feedback: string[] = [];

  if (
    draft.incidentTimeKind !== "unknown" ||
    isIsoDateString(draft.incidentOccurredAt)
  ) {
    score += 18;
  } else {
    feedback.push("Add when it happened, even approximately.");
  }

  if (hasLocation(draft)) {
    score += 18;
  } else {
    feedback.push("Add a place, address, cross-street, or approximate coordinates.");
  }

  if (text.length >= 400) {
    score += 26;
  } else if (text.length >= 120) {
    score += 20;
  } else if (text.length >= 40) {
    score += 12;
    feedback.push("Add a few more concrete details in the order they happened.");
  } else {
    feedback.push("Describe what happened in plain chronological order.");
  }

  if (draft.people.length > 0) {
    score += 16;
  } else {
    feedback.push("List involved people, witnesses, or unknown roles if you can.");
  }

  if (hasEvidenceTerms(text)) {
    score += 12;
  } else {
    feedback.push("Note whether photos, messages, medical records, or witnesses exist.");
  }

  if (draft.contactConsent !== null) {
    score += 10;
  } else {
    feedback.push("Choose whether follow-up contact is allowed.");
  }

  return {
    score: clampInteger(score, 0, 100),
    feedback: feedback.slice(0, 5),
  };
}

export function buildIncidentChecklist(
  draft: Pick<
    IncidentDraft,
    | "incidentTimeKind"
    | "incidentOccurredAt"
    | "locationLabel"
    | "latitude"
    | "longitude"
    | "narrativeText"
    | "transcriptText"
    | "people"
    | "contactConsent"
  >,
  existing: readonly IncidentChecklistItem[] = [],
): IncidentChecklistItem[] {
  const existingCompletion = new Map(
    existing.map((item) => [item.id, item.completed] as const),
  );
  const text = combinedNarrative(draft).toLowerCase();
  const items: Omit<IncidentChecklistItem, "completed">[] = [
    {
      id: "chronology",
      label: "Put the account in time order.",
      rationale: "A timeline makes later review easier and reduces ambiguity.",
    },
    {
      id: "time-and-place",
      label: "Record the most precise time and place you can safely provide.",
      rationale: "Approximate details are useful when exact details are not available.",
    },
    {
      id: "people-and-roles",
      label: "Separate names, roles, and descriptions for each person involved.",
      rationale: "Clear person details help distinguish witnesses, responders, and subjects.",
    },
  ];

  if (!hasEvidenceTerms(text)) {
    items.push({
      id: "evidence-inventory",
      label: "List evidence that exists, even if you are not uploading it here.",
      rationale: "Photos, messages, records, and witness notes can strengthen documentation.",
    });
  }

  if (/(injur|hurt|medical|ambulance|hospital|clinic|doctor)/i.test(text)) {
    items.push({
      id: "medical-records",
      label: "Note medical care, symptoms, and any record locations.",
      rationale: "Medical details are time-sensitive and often hard to reconstruct later.",
    });
  }

  if (/(police|arrest|detain|officer|security|badge|citation)/i.test(text)) {
    items.push({
      id: "official-details",
      label: "Capture agency names, badge numbers, citations, and exact phrases.",
      rationale: "Official interactions are easier to verify when identifiers are separated.",
    });
  }

  if (/(text|dm|email|signal|whatsapp|message|post|online|phone|call)/i.test(text)) {
    items.push({
      id: "digital-records",
      label: "Preserve message threads, call logs, links, and timestamps.",
      rationale: "Digital records can change or disappear, so note where they live.",
    });
  }

  if (draft.contactConsent === true) {
    items.push({
      id: "contact-boundary",
      label: "Keep follow-up contact details limited to methods you consent to use.",
      rationale: "Consent should stay explicit and easy to revise.",
    });
  }

  return items.slice(0, maxChecklistItems).map((item) => ({
    ...item,
    completed: existingCompletion.get(item.id) ?? false,
  }));
}

export function parseIncidentAnalysisResponse(
  content: unknown,
  fallbackDraft: IncidentDraft,
): IncidentAnalysis | null {
  const parsed = parseJsonContent(content);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const candidate = parsed as Record<string, unknown>;
  const people = parseIncidentPeople(candidate.people) ?? [];
  const checklist = parseChecklist(candidate.checklist);
  const quality = parseQuality(candidate.quality);

  return {
    people,
    checklist: checklist ?? buildIncidentChecklist(fallbackDraft),
    quality: quality ?? calculateIncidentQuality({ ...fallbackDraft, people }),
  };
}

export function fallbackIncidentAnalysis(draft: IncidentDraft): IncidentAnalysis {
  return {
    people: draft.people,
    checklist: buildIncidentChecklist(draft, draft.checklist),
    quality: calculateIncidentQuality(draft),
  };
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

function parsePartnerSharing(
  value: unknown,
): IncidentReportPatch["partnerSharing"] | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.consent !== "boolean") {
    return null;
  }

  return {
    consent: candidate.consent,
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

function parseChecklist(value: unknown): readonly IncidentChecklistItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const items: IncidentChecklistItem[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candidate = item as Record<string, unknown>;
    const id = normalizeSlug(candidate.id);
    const label = normalizeText(candidate.label, maxShortTextLength);
    const rationale = normalizeOptionalText(candidate.rationale, 500);

    if (!id || !label || typeof candidate.completed !== "boolean") {
      return null;
    }

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    items.push({
      id,
      label,
      rationale: rationale ?? "",
      completed: candidate.completed,
    });
  }

  return items.slice(0, maxChecklistItems);
}

function parseQuality(value: unknown): IncidentQuality | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const score = normalizeInteger(candidate.score, 0, 100);
  const feedback = Array.isArray(candidate.feedback)
    ? candidate.feedback
        .map((item) => normalizeText(item, 240))
        .filter((item): item is string => Boolean(item))
        .slice(0, 5)
    : null;

  if (score === null || !feedback) {
    return null;
  }

  return { score, feedback };
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

function combinedNarrative(
  draft: Pick<IncidentDraft, "narrativeText" | "transcriptText">,
): string {
  return [draft.narrativeText, draft.transcriptText]
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
}

function hasLocation(
  draft: Pick<IncidentDraft, "locationLabel" | "latitude" | "longitude">,
): boolean {
  return (
    draft.locationLabel.trim().length > 0 ||
    (typeof draft.latitude === "number" && typeof draft.longitude === "number")
  );
}

function hasEvidenceTerms(value: string): boolean {
  return /(photo|video|message|email|text|record|witness|receipt|screenshot|call|medical|badge|license|camera|link)/i.test(
    value,
  );
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

function isIsoDateString(value: string | null): boolean {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()));
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

function normalizeInteger(
  value: unknown,
  min: number,
  max: number,
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return clampInteger(Math.round(value), min, max);
}

function clampInteger(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const slug = value.trim().toLowerCase();

  if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(slug)) {
    return null;
  }

  return slug;
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
