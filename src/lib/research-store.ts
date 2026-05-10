import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildBlindedSearchText,
  buildIncidentBlindingSourceFingerprint,
  type IncidentBlindingSource,
} from "./incident-blinding";
import { isValidReportId, type IncidentPerson } from "./incident-report";
import { hashDeviceSource } from "./incident-store";
import {
  normalizePrivateResearchIncidentRows,
  type ResearchDashboardFilters,
  type PrivateResearchIncident,
  type PrivateResearchIncidentSourceRow,
} from "./research-dashboard";
import { getSupabaseAdminClient } from "./supabase-server";
import { blindIncidentForResearch } from "./tinfoil";

export type BlindingJobResult = {
  readonly processed: number;
  readonly skipped: number;
  readonly failed: number;
};

type BlindingProcessResult =
  | { readonly ok: true; readonly value: BlindingJobResult }
  | { readonly ok: false; readonly status: number; readonly error: string };

type IncidentReportBlindingStatusRow = {
  readonly report_id: string;
  readonly status: string;
  readonly source_fingerprint: string;
};

type IncidentPeopleRow = {
  readonly display_name: string | null;
  readonly role: string | null;
  readonly description: string | null;
  readonly source: string | null;
  readonly confidence: number | null;
  readonly sort_order: number | null;
};

type IncidentReportCandidateRow = {
  readonly id: string;
  readonly updated_at: string;
  readonly submitted_at: string | null;
  readonly incident_time_kind: string | null;
  readonly incident_occurred_at: string | null;
  readonly incident_time_note: string | null;
  readonly location_source: string | null;
  readonly location_label: string | null;
  readonly location_latitude: number | null;
  readonly location_longitude: number | null;
  readonly narrative_text: string | null;
  readonly transcript_text: string | null;
  readonly device_source_hash: string;
  readonly incident_people?: readonly IncidentPeopleRow[] | null;
  readonly incident_report_blindings?:
    | readonly IncidentReportBlindingStatusRow[]
    | IncidentReportBlindingStatusRow
    | null;
};

const privateDashboardSelect = `
  report_id,
  status,
  completed_at,
  updated_at,
  incident_occurred_at,
  incident_time_kind,
  blinded_narrative,
  blinded_transcript,
  blinded_people,
  blinded_location_label,
  coarse_region,
  danger_level,
  evidence_present,
  physical_confrontation,
  model,
  incident_reports!inner(submitted_at)
`;

const blindingCandidateSelect = `
  id,
  updated_at,
  submitted_at,
  incident_time_kind,
  incident_occurred_at,
  incident_time_note,
  location_source,
  location_label,
  location_latitude,
  location_longitude,
  narrative_text,
  transcript_text,
  device_source_hash,
  incident_people(
    display_name,
    role,
    description,
    source,
    confidence,
    sort_order
  ),
  incident_report_blindings(
    report_id,
    status,
    source_fingerprint
  )
`;

export async function loadPrivateResearchIncidents(
  filters: ResearchDashboardFilters,
): Promise<readonly PrivateResearchIncident[]> {
  const supabase = requireSupabase();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("incident_report_blindings")
    .select(privateDashboardSelect)
    .eq("status", "completed")
    .not("incident_reports.submitted_at", "is", null);

  if (filters.dateFrom) {
    query = query.gte(
      "incident_occurred_at",
      new Date(`${filters.dateFrom}T00:00:00.000Z`).toISOString(),
    );
  }

  if (filters.dateTo) {
    query = query.lte(
      "incident_occurred_at",
      new Date(`${filters.dateTo}T23:59:59.999Z`).toISOString(),
    );
  }

  if (filters.region) {
    const pattern = likePattern(filters.region);
    query = query.or(
      `coarse_region.ilike.${pattern},blinded_location_label.ilike.${pattern}`,
    );
  }

  if (filters.danger) {
    query = query.eq("danger_level", filters.danger);
  }

  if (filters.evidence) {
    query = query.eq("evidence_present", filters.evidence === "yes");
  }

  if (filters.physical) {
    query = query.eq("physical_confrontation", filters.physical === "yes");
  }

  if (filters.q) {
    query = query.ilike("blinded_search_text", likePattern(filters.q));
  }

  const { data, error } = await query
    .order("incident_occurred_at", {
      ascending: false,
      nullsFirst: false,
    })
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    if (error) {
      console.error("Unable to load private research incidents", error);
    }
    return [];
  }

  return normalizePrivateResearchIncidentRows(
    data as PrivateResearchIncidentSourceRow[],
  );
}

export async function processIncidentBlindingBatch(
  limit: number,
): Promise<BlindingJobResult> {
  const supabase = requireSupabase();
  if (!supabase) {
    return { processed: 0, skipped: 0, failed: 0 };
  }

  const normalizedLimit = Math.min(Math.max(Math.floor(limit), 1), 25);
  const scanLimit = Math.min(Math.max(normalizedLimit * 50, 250), 1000);
  const { data, error } = await supabase
    .from("incident_reports")
    .select(blindingCandidateSelect)
    .not("submitted_at", "is", null)
    .order("updated_at", { ascending: true })
    .limit(scanLimit);

  if (error || !data) {
    console.error("Unable to load incident blinding candidates", error);
    return { processed: 0, skipped: 0, failed: normalizedLimit };
  }

  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of data as IncidentReportCandidateRow[]) {
    if (processed + failed >= normalizedLimit) {
      break;
    }

    const result = await processIncidentBlindingCandidate(supabase, row);

    switch (result) {
      case "processed":
        processed += 1;
        break;
      case "failed":
        failed += 1;
        break;
      default:
        skipped += 1;
    }
  }

  return { processed, skipped, failed };
}

export async function processIncidentBlindingForReport(
  reportId: string,
  deviceSource: string | null,
): Promise<BlindingProcessResult> {
  const supabase = requireSupabase();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Incident blinding is not configured",
    };
  }

  if (!isValidReportId(reportId) || !deviceSource) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  const { data, error } = await supabase
    .from("incident_reports")
    .select(blindingCandidateSelect)
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  const row = data as IncidentReportCandidateRow;

  if (row.device_source_hash !== hashDeviceSource(deviceSource)) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  if (row.submitted_at === null) {
    return {
      ok: true,
      value: { processed: 0, skipped: 1, failed: 0 },
    };
  }

  const result = await processIncidentBlindingCandidate(supabase, row);

  return {
    ok: true,
    value: {
      processed: result === "processed" ? 1 : 0,
      skipped: result === "skipped" ? 1 : 0,
      failed: result === "failed" ? 1 : 0,
    },
  };
}

function requireSupabase(): SupabaseClient | null {
  return getSupabaseAdminClient();
}

async function processIncidentBlindingCandidate(
  supabase: SupabaseClient,
  row: IncidentReportCandidateRow,
): Promise<"processed" | "skipped" | "failed"> {
  const source = toBlindingSource(row);
  const fingerprint = buildIncidentBlindingSourceFingerprint(source);
  const existing = firstBlinding(row.incident_report_blindings);

  if (
    existing &&
    existing.status !== "failed" &&
    existing.source_fingerprint === fingerprint
  ) {
    return "skipped";
  }

  const ok = await processSingleIncidentBlinding(
    supabase,
    source,
    fingerprint,
  );

  return ok ? "processed" : "failed";
}

async function processSingleIncidentBlinding(
  supabase: SupabaseClient,
  source: IncidentBlindingSource,
  fingerprint: string,
): Promise<boolean> {
  const now = new Date().toISOString();
  const processingResult = await supabase
    .from("incident_report_blindings")
    .upsert(
      {
        report_id: source.reportId,
        status: "processing",
        source_fingerprint: fingerprint,
        incident_time_kind: source.incidentTimeKind,
        incident_occurred_at: source.incidentOccurredAt,
        processing_started_at: now,
        updated_at: now,
        last_error: null,
      },
      { onConflict: "report_id" },
    );

  if (processingResult.error) {
    console.error("Unable to mark incident blinding as processing", {
      reportId: source.reportId,
      error: processingResult.error,
    });
    return false;
  }

  try {
    const blinding = await blindIncidentForResearch(source);
    const searchText = buildBlindedSearchText(blinding);
    const completedAt = new Date().toISOString();
    const { error } = await supabase
      .from("incident_report_blindings")
      .update({
        status: "completed",
        source_fingerprint: fingerprint,
        model_provider: "tinfoil",
        model: blinding.model,
        model_metadata: {
          blinded_at: completedAt,
        },
        blinded_narrative: blinding.blindedNarrative,
        blinded_transcript: blinding.blindedTranscript,
        blinded_people: blinding.blindedPeople,
        blinded_location_label: blinding.blindedLocationLabel,
        blinded_search_text: searchText,
        incident_time_kind: source.incidentTimeKind,
        incident_occurred_at: source.incidentOccurredAt,
        coarse_region: blinding.coarseRegion,
        danger_level: blinding.dangerLevel,
        evidence_present: blinding.evidencePresent,
        physical_confrontation: blinding.physicalConfrontation,
        completed_at: completedAt,
        failed_at: null,
        last_error: null,
        updated_at: completedAt,
      })
      .eq("report_id", source.reportId);

    if (error) {
      console.error("Unable to save completed incident blinding", {
        reportId: source.reportId,
        error,
      });
      return false;
    }

    return true;
  } catch (error) {
    const failedAt = new Date().toISOString();
    const message =
      error instanceof Error ? error.message : "Unable to blind incident";
    await supabase
      .from("incident_report_blindings")
      .update({
        status: "failed",
        failed_at: failedAt,
        last_error: message.slice(0, 2000),
        updated_at: failedAt,
      })
      .eq("report_id", source.reportId);
    console.error("Incident blinding failed", {
      reportId: source.reportId,
      error,
    });
    return false;
  }
}

function toBlindingSource(
  row: IncidentReportCandidateRow,
): IncidentBlindingSource {
  return {
    reportId: row.id,
    updatedAt: row.updated_at,
    incidentTimeKind: isIncidentTimeKind(row.incident_time_kind)
      ? row.incident_time_kind
      : "unknown",
    incidentOccurredAt: row.incident_occurred_at,
    incidentTimeNote: row.incident_time_note ?? "",
    locationSource: isLocationSource(row.location_source)
      ? row.location_source
      : "unknown",
    locationLabel: row.location_label ?? "",
    latitude: row.location_latitude,
    longitude: row.location_longitude,
    narrativeText: row.narrative_text ?? "",
    transcriptText: row.transcript_text ?? "",
    people: toIncidentPeople(row.incident_people ?? []),
  };
}

function toIncidentPeople(
  rows: readonly IncidentPeopleRow[],
): readonly IncidentPerson[] {
  return [...rows]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((person) => ({
      displayName: person.display_name ?? "Unknown person",
      role: person.role ?? "",
      description: person.description ?? "",
      source: person.source === "ai" ? "ai" : "user",
      ...(person.confidence === null || person.confidence === undefined
        ? {}
        : { confidence: person.confidence }),
    }));
}

function firstBlinding(
  value: IncidentReportCandidateRow["incident_report_blindings"],
): IncidentReportBlindingStatusRow | null {
  if (!value) {
    return null;
  }

  if ("report_id" in value) {
    return value;
  }

  return value[0] ?? null;
}

function isIncidentTimeKind(value: unknown): value is IncidentBlindingSource["incidentTimeKind"] {
  return (
    value === "unknown" ||
    value === "just_now" ||
    value === "an_hour_ago" ||
    value === "yesterday" ||
    value === "manual"
  );
}

function isLocationSource(value: unknown): value is IncidentBlindingSource["locationSource"] {
  return value === "unknown" || value === "browser" || value === "manual";
}

function likePattern(value: string): string {
  const cleaned = value.replace(/[%_,]/g, " ").replace(/\s+/g, " ").trim();
  return `%${cleaned}%`;
}
