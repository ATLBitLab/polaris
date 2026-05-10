"use client";

import { Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getOrCreateDeviceSource,
  useIncidentReport,
} from "@/components/incident-report-provider";
import {
  ReportProgress,
  ReportStepHeading,
  ReportStepNav,
} from "@/components/incident-report-chrome";

type EvidenceFile = {
  readonly id: string;
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
};

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
  "application/pdf",
] as const;

const allowedAccept = allowedMimeTypes.join(",");
const maxFileSizeBytes = 26_214_400;
const maxFileSizeLabel = "25 MB";

export default function ReportEvidencePage() {
  const { report } = useIncidentReport();
  const reportId = report?.id ?? null;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<readonly EvidenceFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      return;
    }
    let cancelled = false;
    void fetch(`/api/incident-reports/${reportId}/evidence`, {
      headers: { "x-polaris-device-source": getOrCreateDeviceSource() },
    })
      .then((response) => response.json())
      .then((payload: { files?: EvidenceFile[]; error?: string }) => {
        if (cancelled) {
          return;
        }
        if (Array.isArray(payload.files)) {
          setFiles(payload.files);
        } else if (payload.error) {
          setError(payload.error);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Unable to load uploaded files.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!reportId) {
        return;
      }

      if (!allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number])) {
        setError(`${file.name}: unsupported file type.`);
        return;
      }

      if (file.size > maxFileSizeBytes) {
        setError(`${file.name}: file is larger than ${maxFileSizeLabel}.`);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/incident-reports/${reportId}/evidence`,
        {
          method: "POST",
          headers: { "x-polaris-device-source": getOrCreateDeviceSource() },
          body: formData,
        },
      );
      const payload = (await response.json()) as {
        file?: EvidenceFile;
        error?: string;
      };

      if (!response.ok || !payload.file) {
        setError(payload.error ?? `${file.name}: upload failed.`);
        return;
      }

      const uploaded = payload.file;
      setFiles((current) => [uploaded, ...current]);
    },
    [reportId],
  );

  const handleFiles = useCallback(
    async (selected: FileList | null) => {
      if (!selected || selected.length === 0) {
        return;
      }
      setError(null);
      setIsUploading(true);
      try {
        for (const file of Array.from(selected)) {
          await uploadFile(file);
        }
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [uploadFile],
  );

  const handleRemove = useCallback(
    async (fileId: string) => {
      if (!reportId) {
        return;
      }
      const previous = files;
      setFiles((current) => current.filter((file) => file.id !== fileId));

      const response = await fetch(
        `/api/incident-reports/${reportId}/evidence/${fileId}`,
        {
          method: "DELETE",
          headers: { "x-polaris-device-source": getOrCreateDeviceSource() },
        },
      );

      if (!response.ok) {
        setFiles(previous);
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Unable to remove file.");
      }
    },
    [files, reportId],
  );

  return (
    <section>
      <ReportProgress currentSlug="evidence" />
      <ReportStepHeading
        slug="evidence"
        helper="Optional. Police reports, medical reports, or photographs help us help you with your case. Files stay private to our team."
      />

      <div className="mt-5">
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedAccept}
          multiple
          onChange={(event) => void handleFiles(event.target.files)}
          className="sr-only"
          aria-label="Upload evidence"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={!reportId || isUploading}
          iconBefore={<UploadCloud className="h-4 w-4" />}
        >
          {isUploading ? "Uploading…" : "Choose files"}
        </Button>
        <p className="mt-3 max-w-[58ch] text-[0.86rem] leading-relaxed text-[var(--ink-3)]">
          JPG, PNG, HEIC, WebP, or PDF. Up to {maxFileSizeLabel} per file.
        </p>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 text-[0.9rem] text-[var(--clay-deep)]"
        >
          {error}
        </p>
      ) : null}

      <FileList
        files={files}
        loading={loading}
        onRemove={(id) => void handleRemove(id)}
      />

      <ReportStepNav currentSlug="evidence" />
    </section>
  );
}

function FileList({
  files,
  loading,
  onRemove,
}: {
  readonly files: readonly EvidenceFile[];
  readonly loading: boolean;
  readonly onRemove: (id: string) => void;
}) {
  if (loading && files.length === 0) {
    return (
      <p className="mt-6 border-t border-[var(--rule)] pt-5 text-[0.95rem] leading-relaxed text-[var(--ink-3)] italic">
        Loading uploaded files.
      </p>
    );
  }

  if (files.length === 0) {
    return (
      <p className="mt-6 border-t border-[var(--rule)] pt-5 text-[0.95rem] leading-relaxed text-[var(--ink-3)] italic">
        No files uploaded yet.
      </p>
    );
  }

  return (
    <ul className="mt-6 border-t border-[var(--rule)]">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--rule)] py-4"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.95rem] font-medium text-[var(--ink)]">
              {file.filename}
            </p>
            <p className="text-[0.82rem] text-[var(--ink-3)]">
              {formatSize(file.sizeBytes)} · {mimeLabel(file.mimeType)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.86rem] text-[var(--ink-2)] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
            aria-label={`Remove ${file.filename}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Remove</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function mimeLabel(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "PDF";
    case "image/jpeg":
      return "JPG";
    case "image/png":
      return "PNG";
    case "image/heic":
      return "HEIC";
    case "image/webp":
      return "WebP";
    default:
      return mime;
  }
}
