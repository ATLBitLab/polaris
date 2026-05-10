import {
  blindingDangerLevels,
  type BlindedPerson,
  type BlindingDangerLevel,
} from "./incident-blinding";

export type ResearchDashboardFilters = {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly region: string;
  readonly danger: BlindingDangerLevel | "";
  readonly evidence: "yes" | "no" | "";
  readonly physical: "yes" | "no" | "";
  readonly q: string;
};

export type PrivateResearchIncident = {
  readonly reportId: string;
  readonly completedAt: string | null;
  readonly updatedAt: string;
  readonly incidentOccurredAt: string | null;
  readonly incidentTimeKind: string;
  readonly blindedNarrative: string;
  readonly blindedTranscript: string;
  readonly blindedPeople: readonly BlindedPerson[];
  readonly blindedLocationLabel: string;
  readonly coarseRegion: string;
  readonly dangerLevel: BlindingDangerLevel;
  readonly evidencePresent: boolean | null;
  readonly physicalConfrontation: boolean | null;
  readonly model: string;
};

export type PrivateResearchIncidentSourceRow = {
  readonly report_id: string;
  readonly status: string;
  readonly completed_at: string | null;
  readonly updated_at: string;
  readonly incident_occurred_at: string | null;
  readonly incident_time_kind: string | null;
  readonly blinded_narrative: string | null;
  readonly blinded_transcript: string | null;
  readonly blinded_people: unknown;
  readonly blinded_location_label: string | null;
  readonly coarse_region: string | null;
  readonly danger_level: string | null;
  readonly evidence_present: boolean | null;
  readonly physical_confrontation: boolean | null;
  readonly model: string | null;
  readonly incident_reports?:
    | { readonly submitted_at?: string | null }
    | readonly { readonly submitted_at?: string | null }[]
    | null;
};

const dangerLevelSet = new Set<string>(blindingDangerLevels);

export function parseResearchDashboardFilters(
  searchParams: Record<string, string | readonly string[] | undefined>,
): ResearchDashboardFilters {
  return {
    dateFrom: normalizeDateParam(first(searchParams.from)),
    dateTo: normalizeDateParam(first(searchParams.to)),
    region: normalizeTextParam(first(searchParams.region), 80),
    danger: normalizeDangerParam(first(searchParams.danger)),
    evidence: normalizeBooleanParam(first(searchParams.evidence)),
    physical: normalizeBooleanParam(first(searchParams.physical)),
    q: normalizeTextParam(first(searchParams.q), 120),
  };
}

export function normalizePrivateResearchIncidentRows(
  rows: readonly PrivateResearchIncidentSourceRow[],
): PrivateResearchIncident[] {
  return rows
    .filter((row) => row.status === "completed")
    .filter((row) => hasSubmittedReport(row.incident_reports))
    .map((row) => ({
      reportId: row.report_id,
      completedAt: row.completed_at,
      updatedAt: row.updated_at,
      incidentOccurredAt: row.incident_occurred_at,
      incidentTimeKind: row.incident_time_kind ?? "unknown",
      blindedNarrative: row.blinded_narrative ?? "",
      blindedTranscript: row.blinded_transcript ?? "",
      blindedPeople: parseBlindedPeople(row.blinded_people),
      blindedLocationLabel: row.blinded_location_label ?? "",
      coarseRegion: row.coarse_region ?? "",
      dangerLevel: isDangerLevel(row.danger_level)
        ? row.danger_level
        : "unknown",
      evidencePresent: row.evidence_present,
      physicalConfrontation: row.physical_confrontation,
      model: row.model ?? "",
    }));
}

export function dangerLevelLabel(value: BlindingDangerLevel): string {
  switch (value) {
    case "immediate_attention_needed":
      return "Immediate attention";
    case "danger_expected_within_a_week":
      return "Danger within a week";
    case "not_immediate_danger":
      return "Not immediate";
    default:
      return "Unknown";
  }
}

function hasSubmittedReport(
  value: PrivateResearchIncidentSourceRow["incident_reports"],
): boolean {
  if (!value) {
    return false;
  }

  if (Array.isArray(value)) {
    return (
      value as readonly { readonly submitted_at?: string | null }[]
    ).some((item) => Boolean(item.submitted_at));
  }

  return Boolean(
    (value as { readonly submitted_at?: string | null }).submitted_at,
  );
}

function parseBlindedPeople(value: unknown): readonly BlindedPerson[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Record<string, unknown>;

      if (
        typeof candidate.label !== "string" ||
        typeof candidate.role !== "string" ||
        typeof candidate.description !== "string"
      ) {
        return null;
      }

      return {
        label: candidate.label,
        role: candidate.role,
        description: candidate.description,
      };
    })
    .filter((item): item is BlindedPerson => Boolean(item));
}

function first(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === "string") {
    return value;
  }

  return value?.[0];
}

function normalizeDateParam(value: string | undefined): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? "" : value;
}

function normalizeTextParam(value: string | undefined, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function normalizeDangerParam(value: string | undefined): BlindingDangerLevel | "" {
  return isDangerLevel(value) ? value : "";
}

function normalizeBooleanParam(value: string | undefined): "yes" | "no" | "" {
  return value === "yes" || value === "no" ? value : "";
}

function isDangerLevel(value: unknown): value is BlindingDangerLevel {
  return typeof value === "string" && dangerLevelSet.has(value);
}
