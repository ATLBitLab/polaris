import "server-only";

import { createHash, createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  applyIncidentPatch,
  buildIncidentChecklist,
  calculateIncidentQuality,
  emptyIncidentDraft,
  fallbackIncidentAnalysis,
  isValidDeviceSource,
  isValidReportId,
  parseIncidentPatch,
  type IncidentAnalysis,
  type IncidentChecklistItem,
  type IncidentClientReport,
  type IncidentDraft,
  type IncidentPerson,
  type IncidentReportPatch,
} from "./incident-report";
import { getSupabaseAdminClient } from "./supabase-server";

type StoreResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly status: number;
      readonly error: string;
    };

type IncidentReportRow = {
  readonly id: string;
  readonly created_at: string;
  readonly updated_at: string;
  readonly last_autosaved_at: string | null;
  readonly autosave_version: number;
  readonly incident_time_kind: string | null;
  readonly incident_occurred_at: string | null;
  readonly incident_time_note: string | null;
  readonly location_source: string | null;
  readonly location_label: string | null;
  readonly location_latitude: number | null;
  readonly location_longitude: number | null;
  readonly location_accuracy_meters: number | null;
  readonly narrative_text: string | null;
  readonly transcript_text: string | null;
  readonly quality_score: number | null;
  readonly quality_feedback: unknown;
  readonly checklist_state: unknown;
  readonly contact_consent: boolean | null;
  readonly contact_decided_at: string | null;
  readonly contact_consented_at: string | null;
  readonly contact_methods: unknown;
  readonly partner_sharing_consent: boolean | null;
  readonly partner_sharing_decided_at: string | null;
  readonly partner_sharing_consented_at: string | null;
  readonly submitted_at: string | null;
  readonly device_source_hash: string;
};

type IncidentPersonRow = {
  readonly id: string;
  readonly display_name: string | null;
  readonly role: string | null;
  readonly description: string | null;
  readonly source: string | null;
  readonly confidence: number | null;
};

const reportSelect = `
  id,
  created_at,
  updated_at,
  last_autosaved_at,
  autosave_version,
  incident_time_kind,
  incident_occurred_at,
  incident_time_note,
  location_source,
  location_label,
  location_latitude,
  location_longitude,
  location_accuracy_meters,
  narrative_text,
  transcript_text,
  quality_score,
  quality_feedback,
  checklist_state,
  contact_consent,
  contact_decided_at,
  contact_consented_at,
  contact_methods,
  partner_sharing_consent,
  partner_sharing_decided_at,
  partner_sharing_consented_at,
  submitted_at,
  device_source_hash
`;

export function getDeviceSourceFromRequest(request: Request): string | null {
  const header = request.headers.get("x-polaris-device-source");
  return isValidDeviceSource(header) ? header : null;
}

export function hashDeviceSource(deviceSource: string): string {
  const secret = process.env.DEVICE_HASH_SECRET;

  if (secret) {
    return createHmac("sha256", secret).update(deviceSource).digest("hex");
  }

  return createHash("sha256").update(deviceSource).digest("hex");
}

export async function createIncidentReport(
  deviceSource: string | null,
): Promise<StoreResult<IncidentClientReport>> {
  const supabase = requireSupabase();

  if (!supabase.ok) {
    return supabase;
  }

  if (!deviceSource) {
    return { ok: false, status: 400, error: "Missing device continuity token" };
  }

  const draft = emptyIncidentDraft();
  const quality = calculateIncidentQuality(draft);
  const { data, error } = await supabase.value
    .from("incident_reports")
    .insert({
      device_source_hash: hashDeviceSource(deviceSource),
      quality_score: quality.score,
      quality_feedback: quality.feedback,
      checklist_state: draft.checklist,
    })
    .select(reportSelect)
    .single();

  if (error || !data) {
    console.error("Unable to create incident report", error);
    return { ok: false, status: 500, error: "Unable to create report" };
  }

  return {
    ok: true,
    value: toClientReport(data as IncidentReportRow, []),
  };
}

export async function patchIncidentReport(
  reportId: string,
  deviceSource: string | null,
  body: unknown,
): Promise<StoreResult<IncidentClientReport>> {
  const patch = parseIncidentPatch(body);

  if (!patch) {
    return { ok: false, status: 400, error: "Invalid incident report update" };
  }

  return updateIncidentReport(reportId, deviceSource, patch);
}

export async function getIncidentReport(
  reportId: string,
  deviceSource: string | null,
): Promise<StoreResult<IncidentClientReport>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  return {
    ok: true,
    value: toClientReport(loaded.value.row, loaded.value.people),
  };
}

export async function updateIncidentReport(
  reportId: string,
  deviceSource: string | null,
  patch: IncidentReportPatch,
): Promise<StoreResult<IncidentClientReport>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  if (loaded.value.row.submitted_at !== null) {
    return { ok: false, status: 409, error: "Report already submitted" };
  }

  const { supabase, row, people } = loaded.value;
  const current = toDraft(row, people);
  const nextDraft = applyIncidentPatch(current, patch);
  const quality = calculateIncidentQuality(nextDraft);
  const checklist = nextDraft.checklist;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("incident_reports")
    .update({
      incident_time_kind: nextDraft.incidentTimeKind,
      incident_occurred_at: nextDraft.incidentOccurredAt,
      incident_time_note: nextDraft.incidentTimeNote,
      location_source: nextDraft.locationSource,
      location_label: nextDraft.locationLabel,
      location_latitude: nextDraft.latitude,
      location_longitude: nextDraft.longitude,
      location_accuracy_meters: nextDraft.locationAccuracyMeters,
      narrative_text: nextDraft.narrativeText,
      transcript_text: nextDraft.transcriptText,
      quality_score: quality.score,
      quality_feedback: quality.feedback,
      checklist_state: checklist,
      contact_consent: nextDraft.contactConsent === true,
      contact_decided_at:
        patch.contact === undefined ? row.contact_decided_at : now,
      contact_consented_at:
        nextDraft.contactConsent === true
          ? row.contact_consented_at ?? now
          : null,
      contact_methods: nextDraft.contactConsent === true ? nextDraft.contactMethods : [],
      partner_sharing_consent: nextDraft.partnerSharingConsent === true,
      partner_sharing_decided_at:
        patch.partnerSharing === undefined
          ? row.partner_sharing_decided_at
          : now,
      partner_sharing_consented_at:
        nextDraft.partnerSharingConsent === true
          ? row.partner_sharing_consented_at ?? now
          : null,
      last_autosaved_at: now,
      updated_at: now,
      autosave_version: row.autosave_version + 1,
    })
    .eq("id", reportId)
    .select(reportSelect)
    .single();

  if (error || !data) {
    console.error("Unable to update incident report", error);
    return { ok: false, status: 500, error: "Unable to save report" };
  }

  if (patch.people) {
    const peopleResult = await replaceIncidentPeople(
      supabase,
      reportId,
      patch.people,
    );

    if (!peopleResult.ok) {
      return peopleResult;
    }
  }

  const nextPeople = patch.people
    ? patch.people
    : await getIncidentPeople(supabase, reportId);

  return {
    ok: true,
    value: toClientReport(data as IncidentReportRow, nextPeople),
  };
}

export async function saveTranscript(
  reportId: string,
  deviceSource: string | null,
  transcript: {
    readonly text: string;
    readonly model: string;
    readonly language: string | null;
  },
): Promise<StoreResult<IncidentClientReport>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  if (loaded.value.row.submitted_at !== null) {
    return { ok: false, status: 409, error: "Report already submitted" };
  }

  const { supabase, row, people } = loaded.value;
  const current = toDraft(row, people);
  const nextDraft = { ...current, transcriptText: transcript.text };
  const quality = calculateIncidentQuality(nextDraft);
  const checklist = buildIncidentChecklist(nextDraft, current.checklist);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("incident_reports")
    .update({
      transcript_text: transcript.text,
      transcript_model: transcript.model,
      transcript_language: transcript.language,
      transcript_updated_at: now,
      quality_score: quality.score,
      quality_feedback: quality.feedback,
      checklist_state: checklist,
      last_autosaved_at: now,
      updated_at: now,
      autosave_version: row.autosave_version + 1,
    })
    .eq("id", reportId)
    .select(reportSelect)
    .single();

  if (error || !data) {
    console.error("Unable to save incident transcript", error);
    return { ok: false, status: 500, error: "Unable to save transcript" };
  }

  return {
    ok: true,
    value: toClientReport(data as IncidentReportRow, people),
  };
}

export async function loadIncidentDraftForAnalysis(
  reportId: string,
  deviceSource: string | null,
): Promise<StoreResult<IncidentDraft>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  return {
    ok: true,
    value: toDraft(loaded.value.row, loaded.value.people),
  };
}

export async function saveIncidentAnalysis(
  reportId: string,
  deviceSource: string | null,
  analysis: IncidentAnalysis,
): Promise<StoreResult<IncidentClientReport>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  if (loaded.value.row.submitted_at !== null) {
    return { ok: false, status: 409, error: "Report already submitted" };
  }

  const { supabase, row, people } = loaded.value;
  const current = toDraft(row, people);
  const nextDraft: IncidentDraft = {
    ...current,
    people: analysis.people,
    checklist: analysis.checklist,
  };
  const quality =
    analysis.quality.feedback.length > 0
      ? analysis.quality
      : fallbackIncidentAnalysis(nextDraft).quality;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("incident_reports")
    .update({
      quality_score: quality.score,
      quality_feedback: quality.feedback,
      checklist_state: analysis.checklist,
      analysis_metadata: {
        analyzed_at: now,
      },
      last_autosaved_at: now,
      updated_at: now,
      autosave_version: row.autosave_version + 1,
    })
    .eq("id", reportId)
    .select(reportSelect)
    .single();

  if (error || !data) {
    console.error("Unable to save incident analysis", error);
    return { ok: false, status: 500, error: "Unable to save analysis" };
  }

  const peopleResult = await replaceIncidentPeople(
    supabase,
    reportId,
    analysis.people,
  );

  if (!peopleResult.ok) {
    return peopleResult;
  }

  return {
    ok: true,
    value: toClientReport(data as IncidentReportRow, analysis.people),
  };
}

export async function markIncidentReportSubmitted(
  reportId: string,
  deviceSource: string | null,
): Promise<StoreResult<IncidentClientReport>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  const { supabase, row, people } = loaded.value;

  if (row.submitted_at !== null) {
    return { ok: true, value: toClientReport(row, people) };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("incident_reports")
    .update({ submitted_at: now, updated_at: now })
    .eq("id", reportId)
    .is("submitted_at", null)
    .select(reportSelect)
    .single();

  if (error || !data) {
    console.error("Unable to mark incident report submitted", error);
    return { ok: false, status: 500, error: "Unable to submit report" };
  }

  return { ok: true, value: toClientReport(data as IncidentReportRow, people) };
}

function requireSupabase(): StoreResult<SupabaseClient> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Incident reporting is not configured",
    };
  }

  return { ok: true, value: supabase };
}

async function loadAuthorizedReport(
  reportId: string,
  deviceSource: string | null,
): Promise<
  StoreResult<{
    readonly supabase: SupabaseClient;
    readonly row: IncidentReportRow;
    readonly people: readonly IncidentPerson[];
  }>
> {
  const supabase = requireSupabase();

  if (!supabase.ok) {
    return supabase;
  }

  if (!isValidReportId(reportId) || !deviceSource) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  const { data, error } = await supabase.value
    .from("incident_reports")
    .select(reportSelect)
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  const row = data as IncidentReportRow;

  if (row.device_source_hash !== hashDeviceSource(deviceSource)) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  return {
    ok: true,
    value: {
      supabase: supabase.value,
      row,
      people: await getIncidentPeople(supabase.value, reportId),
    },
  };
}

async function getIncidentPeople(
  supabase: SupabaseClient,
  reportId: string,
): Promise<readonly IncidentPerson[]> {
  const { data, error } = await supabase
    .from("incident_people")
    .select("id, display_name, role, description, source, confidence")
    .eq("report_id", reportId)
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("Unable to load incident people", error);
    return [];
  }

  return (data as IncidentPersonRow[]).map((person) => ({
    id: person.id,
    displayName: person.display_name ?? "",
    role: person.role ?? "",
    description: person.description ?? "",
    source: person.source === "ai" ? "ai" : "user",
    ...(person.confidence === null ? {} : { confidence: person.confidence }),
  }));
}

async function replaceIncidentPeople(
  supabase: SupabaseClient,
  reportId: string,
  people: readonly IncidentPerson[],
): Promise<StoreResult<true>> {
  const deleteResult = await supabase
    .from("incident_people")
    .delete()
    .eq("report_id", reportId);

  if (deleteResult.error) {
    console.error("Unable to replace incident people", deleteResult.error);
    return { ok: false, status: 500, error: "Unable to save people" };
  }

  if (people.length === 0) {
    return { ok: true, value: true };
  }

  const { error } = await supabase.from("incident_people").insert(
    people.map((person, index) => ({
      report_id: reportId,
      display_name: person.displayName,
      role: person.role,
      description: person.description,
      source: person.source,
      confidence: person.confidence ?? null,
      sort_order: index,
    })),
  );

  if (error) {
    console.error("Unable to save incident people", error);
    return { ok: false, status: 500, error: "Unable to save people" };
  }

  return { ok: true, value: true };
}

function toClientReport(
  row: IncidentReportRow,
  people: readonly IncidentPerson[],
): IncidentClientReport {
  const draft = toDraft(row, people);
  const quality = {
    score: row.quality_score ?? calculateIncidentQuality(draft).score,
    feedback: parseStringArray(row.quality_feedback),
  };

  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastAutosavedAt: row.last_autosaved_at,
    autosaveVersion: row.autosave_version,
    submittedAt: row.submitted_at,
    draft,
    quality,
  };
}

function toDraft(
  row: IncidentReportRow,
  people: readonly IncidentPerson[],
): IncidentDraft {
  const fallback = emptyIncidentDraft();
  const checklist = parseChecklistState(row.checklist_state);
  const contactMethods = parseContactMethods(row.contact_methods);

  return {
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
    locationAccuracyMeters: row.location_accuracy_meters,
    narrativeText: row.narrative_text ?? "",
    transcriptText: row.transcript_text ?? "",
    people,
    checklist: checklist.length > 0 ? checklist : fallback.checklist,
    contactConsent:
      row.contact_decided_at === null ? null : row.contact_consent === true,
    contactMethods,
    partnerSharingConsent:
      row.partner_sharing_decided_at === null
        ? null
        : row.partner_sharing_consent === true,
  };
}

function parseChecklistState(value: unknown): IncidentChecklistItem[] {
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
        typeof candidate.id !== "string" ||
        typeof candidate.label !== "string" ||
        typeof candidate.completed !== "boolean"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        label: candidate.label,
        rationale:
          typeof candidate.rationale === "string" ? candidate.rationale : "",
        completed: candidate.completed,
      };
    })
    .filter((item): item is IncidentChecklistItem => Boolean(item));
}

function parseContactMethods(value: unknown) {
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
        typeof candidate.type !== "string" ||
        typeof candidate.value !== "string"
      ) {
        return null;
      }

      return {
        type: candidate.type,
        value: candidate.value,
        ...(typeof candidate.label === "string"
          ? { label: candidate.label }
          : {}),
      };
    })
    .filter(
      (
        item,
      ): item is { readonly type: string; readonly value: string; readonly label?: string } =>
        Boolean(item),
    );
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function isIncidentTimeKind(value: unknown): value is IncidentDraft["incidentTimeKind"] {
  return (
    value === "unknown" ||
    value === "just_now" ||
    value === "an_hour_ago" ||
    value === "yesterday" ||
    value === "manual"
  );
}

function isLocationSource(value: unknown): value is IncidentDraft["locationSource"] {
  return value === "unknown" || value === "browser" || value === "manual";
}
