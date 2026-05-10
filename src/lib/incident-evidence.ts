import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidReportId } from "./incident-report";
import { hashDeviceSource } from "./incident-store";
import {
  evidenceExtensionByMime,
  isAllowedEvidenceMime,
  isAllowedEvidenceSize,
} from "./incident-evidence-validation";
import { getSupabaseAdminClient } from "./supabase-server";

export {
  evidenceMaxFileSizeBytes,
  isAllowedEvidenceMime,
  isAllowedEvidenceSize,
} from "./incident-evidence-validation";

const bucketName = "incident-evidence";

export type EvidenceFile = {
  readonly id: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
};

type EvidenceRow = {
  readonly id: string;
  readonly storage_path: string;
  readonly filename: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly created_at: string;
};

type EvidenceResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly status: number;
      readonly error: string;
    };

export async function listEvidence(
  reportId: string,
  deviceSource: string | null,
): Promise<EvidenceResult<readonly EvidenceFile[]>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  const { data, error } = await loaded.value.supabase
    .from("incident_evidence")
    .select("id, storage_path, filename, mime_type, size_bytes, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Unable to list incident evidence", error);
    return { ok: false, status: 500, error: "Unable to list evidence" };
  }

  return {
    ok: true,
    value: (data as EvidenceRow[]).map(toEvidenceFile),
  };
}

export async function addEvidence(
  reportId: string,
  deviceSource: string | null,
  file: {
    readonly bytes: ArrayBuffer | Uint8Array;
    readonly filename: string;
    readonly mimeType: string;
    readonly sizeBytes: number;
  },
): Promise<EvidenceResult<EvidenceFile>> {
  if (!isAllowedEvidenceMime(file.mimeType)) {
    return { ok: false, status: 415, error: "Unsupported file type" };
  }

  if (!isAllowedEvidenceSize(file.sizeBytes)) {
    return { ok: false, status: 413, error: "File is too large" };
  }

  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  if (loaded.value.row.submitted_at !== null) {
    return { ok: false, status: 409, error: "Report already submitted" };
  }

  const { supabase } = loaded.value;
  const extension = evidenceExtensionByMime[file.mimeType] ?? "bin";
  const storagePath = `${reportId}/${randomUUID()}.${extension}`;
  const sanitizedFilename = sanitizeFilename(file.filename);
  const bytes =
    file.bytes instanceof Uint8Array ? file.bytes : new Uint8Array(file.bytes);

  const uploadResult = await supabase.storage
    .from(bucketName)
    .upload(storagePath, bytes, {
      contentType: file.mimeType,
      upsert: false,
    });

  if (uploadResult.error) {
    console.error("Unable to upload incident evidence", uploadResult.error);
    return { ok: false, status: 500, error: "Unable to upload file" };
  }

  const { data, error } = await supabase
    .from("incident_evidence")
    .insert({
      report_id: reportId,
      storage_path: storagePath,
      filename: sanitizedFilename,
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
    })
    .select("id, storage_path, filename, mime_type, size_bytes, created_at")
    .single();

  if (error || !data) {
    console.error("Unable to record incident evidence row", error);
    await supabase.storage.from(bucketName).remove([storagePath]);
    return { ok: false, status: 500, error: "Unable to record file" };
  }

  return { ok: true, value: toEvidenceFile(data as EvidenceRow) };
}

export async function removeEvidence(
  reportId: string,
  deviceSource: string | null,
  fileId: string,
): Promise<EvidenceResult<true>> {
  const loaded = await loadAuthorizedReport(reportId, deviceSource);

  if (!loaded.ok) {
    return loaded;
  }

  if (loaded.value.row.submitted_at !== null) {
    return { ok: false, status: 409, error: "Report already submitted" };
  }

  const { supabase } = loaded.value;
  const { data: row, error: loadError } = await supabase
    .from("incident_evidence")
    .select("id, storage_path")
    .eq("report_id", reportId)
    .eq("id", fileId)
    .maybeSingle();

  if (loadError) {
    console.error("Unable to load evidence row", loadError);
    return { ok: false, status: 500, error: "Unable to remove file" };
  }

  if (!row) {
    return { ok: false, status: 404, error: "File not found" };
  }

  const { error: deleteError } = await supabase
    .from("incident_evidence")
    .delete()
    .eq("id", fileId)
    .eq("report_id", reportId);

  if (deleteError) {
    console.error("Unable to delete evidence row", deleteError);
    return { ok: false, status: 500, error: "Unable to remove file" };
  }

  await supabase.storage.from(bucketName).remove([row.storage_path as string]);

  return { ok: true, value: true };
}

function toEvidenceFile(row: EvidenceRow): EvidenceFile {
  return {
    id: row.id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

function sanitizeFilename(value: string): string {
  const trimmed = value.trim().replace(/[\r\n\t]+/g, " ").slice(0, 200);
  return trimmed.length > 0 ? trimmed : "evidence";
}

async function loadAuthorizedReport(
  reportId: string,
  deviceSource: string | null,
): Promise<
  EvidenceResult<{
    readonly supabase: SupabaseClient;
    readonly row: { readonly id: string; readonly submitted_at: string | null };
  }>
> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Incident reporting is not configured",
    };
  }

  if (!isValidReportId(reportId) || !deviceSource) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  const { data, error } = await supabase
    .from("incident_reports")
    .select("id, submitted_at, device_source_hash")
    .eq("id", reportId)
    .single();

  if (error || !data) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  if ((data.device_source_hash as string) !== hashDeviceSource(deviceSource)) {
    return { ok: false, status: 404, error: "Report not found" };
  }

  return {
    ok: true,
    value: {
      supabase,
      row: {
        id: data.id as string,
        submitted_at: data.submitted_at as string | null,
      },
    },
  };
}
