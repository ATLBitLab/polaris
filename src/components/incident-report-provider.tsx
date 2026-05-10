"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  IncidentChecklistItem,
  IncidentClientReport,
  IncidentDraft,
  IncidentLocationSource,
  IncidentPerson,
  IncidentReportPatch,
  IncidentTimeKind,
} from "@/lib/incident-report";

export type SaveState = "idle" | "starting" | "saving" | "saved" | "error";
export type RecordingState =
  | "idle"
  | "recording"
  | "transcribing"
  | "unsupported";

type AnalysisState = "idle" | "running" | "done" | "error";

type ApiPayload = {
  readonly report?: IncidentClientReport;
  readonly transcript?: {
    readonly text: string;
    readonly model: string;
    readonly language: string | null;
  };
  readonly aiUsed?: boolean;
  readonly error?: string;
};

const deviceStorageKey = "polaris.incident.device.v1";
const reportIdStorageKey = "polaris.incident.report.v1";

type IncidentReportContextValue = {
  readonly report: IncidentClientReport | null;
  readonly saveState: SaveState;
  readonly error: string | null;
  readonly manualDateTime: string;
  readonly manualLatitude: string;
  readonly manualLongitude: string;
  readonly recordingState: RecordingState;
  readonly analysisState: AnalysisState;
  readonly setError: (value: string | null) => void;
  readonly chooseTime: (kind: IncidentTimeKind) => void;
  readonly updateManualDateTime: (value: string) => void;
  readonly requestBrowserLocation: () => void;
  readonly updateManualLocation: (next: {
    readonly label?: string;
    readonly latitude?: string;
    readonly longitude?: string;
  }) => void;
  readonly updateNarrative: (value: string) => void;
  readonly startRecording: () => Promise<void>;
  readonly stopRecording: () => void;
  readonly runAnalysis: () => Promise<void>;
  readonly addPerson: () => void;
  readonly updatePerson: (index: number, person: IncidentPerson) => void;
  readonly removePerson: (index: number) => void;
  readonly updateChecklist: (
    checklist: readonly IncidentChecklistItem[],
  ) => void;
  readonly updateContact: (
    consent: boolean,
    methods?: readonly { readonly type: string; readonly value: string }[],
  ) => void;
  readonly flushPendingPatches: () => Promise<void>;
  readonly resetReport: () => void;
};

const IncidentReportContext = createContext<IncidentReportContextValue | null>(
  null,
);

export function useIncidentReport(): IncidentReportContextValue {
  const value = useContext(IncidentReportContext);
  if (!value) {
    throw new Error(
      "useIncidentReport must be used inside IncidentReportProvider",
    );
  }
  return value;
}

export function IncidentReportProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [report, setReport] = useState<IncidentClientReport | null>(null);
  const [deviceSource, setDeviceSource] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("starting");
  const [error, setError] = useState<string | null>(null);
  const [manualDateTime, setManualDateTime] = useState("");
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [analysisState, setAnalysisState] =
    useState<AnalysisState>("idle");

  const pendingPatchRef = useRef<IncidentReportPatch | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const reportRef = useRef<IncidentClientReport | null>(null);
  const deviceSourceRef = useRef<string | null>(null);

  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  useEffect(() => {
    deviceSourceRef.current = deviceSource;
  }, [deviceSource]);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const flushPatch = useCallback(async () => {
    const currentReport = reportRef.current;
    const currentDeviceSource = deviceSourceRef.current;
    if (!currentReport || !currentDeviceSource || !pendingPatchRef.current) {
      return;
    }

    const patch = pendingPatchRef.current;
    pendingPatchRef.current = null;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      const response = await fetch(
        `/api/incident-reports/${currentReport.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-polaris-device-source": currentDeviceSource,
          },
          body: JSON.stringify(patch),
        },
      );
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok || !payload.report) {
        throw new Error(payload.error ?? "Unable to save report");
      }

      if (pendingPatchRef.current) {
        setSaveState("saving");
      } else {
        setReport(payload.report);
        setSaveState("saved");
      }
      setError(null);
    } catch (nextError) {
      setSaveState("error");
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to save report",
      );
    }
  }, []);

  const flushPendingPatches = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (pendingPatchRef.current) {
      await flushPatch();
    }
  }, [flushPatch]);

  const schedulePatch = useCallback(
    (patch: IncidentReportPatch) => {
      pendingPatchRef.current = mergePatches(pendingPatchRef.current, patch);
      setSaveState("saving");

      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        void flushPatch();
      }, 650);
    },
    [flushPatch],
  );

  const updateDraft = useCallback(
    (
      updater: (draft: IncidentDraft) => IncidentDraft,
      patch: IncidentReportPatch,
    ) => {
      setReport((current) => {
        if (!current) {
          return current;
        }
        return { ...current, draft: updater(current.draft) };
      });
      schedulePatch(patch);
    },
    [schedulePatch],
  );

  const startReport = useCallback(async (source: string) => {
    setSaveState("starting");
    const storedId = window.localStorage.getItem(reportIdStorageKey);

    if (storedId) {
      try {
        const response = await fetch(
          `/api/incident-reports/${storedId}`,
          {
            headers: { "x-polaris-device-source": source },
          },
        );
        if (response.ok) {
          const payload = (await response.json()) as ApiPayload;
          if (payload.report) {
            setReport(payload.report);
            setSaveState("saved");
            seedManualFields(payload.report.draft, {
              setManualDateTime,
              setManualLatitude,
              setManualLongitude,
            });
            return;
          }
        }
      } catch {
        // fall through to create a fresh report
      }
      window.localStorage.removeItem(reportIdStorageKey);
    }

    try {
      const response = await fetch("/api/incident-reports", {
        method: "POST",
        headers: { "x-polaris-device-source": source },
      });
      const payload = (await response.json()) as ApiPayload;
      if (!response.ok || !payload.report) {
        throw new Error(payload.error ?? "Unable to start report");
      }
      window.localStorage.setItem(reportIdStorageKey, payload.report.id);
      setReport(payload.report);
      setSaveState("saved");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to start report",
      );
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    const source = getOrCreateDeviceSource();
    setDeviceSource(source);
    void startReport(source);
  }, [startReport]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      stopTracks();
    };
  }, [stopTracks]);

  const chooseTime = useCallback(
    (kind: IncidentTimeKind) => {
      const occurredAt = getPresetTime(kind);
      const incidentTime = { kind, occurredAt, note: "" };
      if (kind !== "manual") {
        setManualDateTime("");
      }
      updateDraft(
        (draft) => ({
          ...draft,
          incidentTimeKind: kind,
          incidentOccurredAt: occurredAt,
          incidentTimeNote: "",
        }),
        { incidentTime },
      );
    },
    [updateDraft],
  );

  const updateManualDateTime = useCallback(
    (value: string) => {
      setManualDateTime(value);
      const date = value ? new Date(value) : null;
      const occurredAt =
        date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
      updateDraft(
        (draft) => ({
          ...draft,
          incidentTimeKind: "manual",
          incidentOccurredAt: occurredAt,
        }),
        {
          incidentTime: {
            kind: "manual",
            occurredAt,
            note: "",
          },
        },
      );
    },
    [updateDraft],
  );

  const updateLocation = useCallback(
    (
      source: IncidentLocationSource,
      label: string,
      latitude: number | null,
      longitude: number | null,
      accuracyMeters: number | null,
    ) => {
      updateDraft(
        (draft) => ({
          ...draft,
          locationSource: source,
          locationLabel: label,
          latitude,
          longitude,
          locationAccuracyMeters: accuracyMeters,
        }),
        {
          location: {
            source,
            label,
            latitude,
            longitude,
            accuracyMeters,
          },
        },
      );
    },
    [updateDraft],
  );

  const requestBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        "Browser location is not available. Use manual location instead.",
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = roundCoordinate(position.coords.latitude);
        const longitude = roundCoordinate(position.coords.longitude);
        setManualLatitude(String(latitude));
        setManualLongitude(String(longitude));
        updateLocation(
          "browser",
          "Browser location",
          latitude,
          longitude,
          Math.round(position.coords.accuracy),
        );
      },
      () => {
        setError("Location was not shared. Manual location still works.");
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }, [updateLocation]);

  const updateManualLocation = useCallback(
    (next: {
      readonly label?: string;
      readonly latitude?: string;
      readonly longitude?: string;
    }) => {
      const currentReport = reportRef.current;
      if (!currentReport) {
        return;
      }

      const label = next.label ?? currentReport.draft.locationLabel;
      const latitudeText = next.latitude ?? manualLatitude;
      const longitudeText = next.longitude ?? manualLongitude;
      const parsedLatitude = parseOptionalNumber(latitudeText);
      const parsedLongitude = parseOptionalNumber(longitudeText);
      const hasCoordinatePair =
        latitudeText.trim().length > 0 && longitudeText.trim().length > 0;
      const hasValidCoordinatePair =
        hasCoordinatePair &&
        parsedLatitude !== null &&
        parsedLongitude !== null;
      const latitude = hasValidCoordinatePair ? parsedLatitude : null;
      const longitude = hasValidCoordinatePair ? parsedLongitude : null;

      if (next.latitude !== undefined) {
        setManualLatitude(next.latitude);
      }
      if (next.longitude !== undefined) {
        setManualLongitude(next.longitude);
      }

      updateLocation("manual", label, latitude, longitude, null);
    },
    [manualLatitude, manualLongitude, updateLocation],
  );

  const updateNarrative = useCallback(
    (value: string) => {
      updateDraft(
        (draft) => ({ ...draft, narrativeText: value }),
        { narrativeText: value },
      );
    },
    [updateDraft],
  );

  const transcribeAudio = useCallback(
    async (blob: Blob) => {
      const currentReport = reportRef.current;
      const currentDeviceSource = deviceSourceRef.current;
      if (!currentReport || !currentDeviceSource) {
        return;
      }

      setRecordingState("transcribing");

      try {
        const wavBlob = await convertRecordingToWav(blob);
        const formData = new FormData();
        formData.append("audio", wavBlob, "incident-audio.wav");

        const response = await fetch(
          `/api/incident-reports/${currentReport.id}/transcribe`,
          {
            method: "POST",
            headers: {
              "x-polaris-device-source": currentDeviceSource,
            },
            body: formData,
          },
        );
        const payload = (await response.json()) as ApiPayload;

        if (!response.ok || !payload.report) {
          throw new Error(payload.error ?? "Unable to transcribe audio");
        }

        setReport(payload.report);
        setSaveState("saved");
        setRecordingState("idle");
        setError(null);
      } catch (nextError) {
        setRecordingState("idle");
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to prepare audio for transcription",
        );
      }
    },
    [],
  );

  const startRecording = useCallback(async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setRecordingState("unsupported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        stopTracks();
        void transcribeAudio(blob);
      };

      recorder.start(1000);
      setRecordingState("recording");
    } catch {
      setRecordingState("unsupported");
      setError("Microphone access was not available. Typing still works.");
    }
  }, [stopTracks, transcribeAudio]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecordingState("transcribing");
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    const currentReport = reportRef.current;
    const currentDeviceSource = deviceSourceRef.current;
    if (!currentReport || !currentDeviceSource) {
      return;
    }

    await flushPendingPatches();
    setAnalysisState("running");

    try {
      const response = await fetch(
        `/api/incident-reports/${currentReport.id}/analyze`,
        {
          method: "POST",
          headers: { "x-polaris-device-source": currentDeviceSource },
        },
      );
      const payload = (await response.json()) as ApiPayload;

      if (!response.ok || !payload.report) {
        throw new Error(payload.error ?? "Unable to review report");
      }

      setReport(payload.report);
      setAnalysisState("done");
      setSaveState("saved");
      setError(null);
    } catch (nextError) {
      setAnalysisState("error");
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to review report",
      );
    }
  }, [flushPendingPatches]);

  const updatePeopleFromCurrent = useCallback(
    (
      updater: (
        people: readonly IncidentPerson[],
      ) => readonly IncidentPerson[],
    ) => {
      let nextPeople: readonly IncidentPerson[] | null = null;

      setReport((current) => {
        if (!current) {
          return current;
        }
        nextPeople = updater(current.draft.people);
        return {
          ...current,
          draft: { ...current.draft, people: nextPeople },
        };
      });

      if (nextPeople) {
        schedulePatch({ people: nextPeople });
      }
    },
    [schedulePatch],
  );

  const addPerson = useCallback(() => {
    updatePeopleFromCurrent((people) => [
      ...people,
      {
        displayName: "Unknown person",
        role: "",
        description: "",
        source: "user",
      },
    ]);
  }, [updatePeopleFromCurrent]);

  const updatePerson = useCallback(
    (index: number, person: IncidentPerson) => {
      updatePeopleFromCurrent((people) =>
        people.map((current, itemIndex) =>
          itemIndex === index ? person : current,
        ),
      );
    },
    [updatePeopleFromCurrent],
  );

  const removePerson = useCallback(
    (index: number) => {
      updatePeopleFromCurrent((people) =>
        people.filter((_, itemIndex) => itemIndex !== index),
      );
    },
    [updatePeopleFromCurrent],
  );

  const updateChecklist = useCallback(
    (checklist: readonly IncidentChecklistItem[]) => {
      updateDraft((draft) => ({ ...draft, checklist }), { checklist });
    },
    [updateDraft],
  );

  const updateContact = useCallback(
    (
      consent: boolean,
      methods?: readonly { readonly type: string; readonly value: string }[],
    ) => {
      const currentMethods =
        methods ?? reportRef.current?.draft.contactMethods ?? [];
      updateDraft(
        (draft) => ({
          ...draft,
          contactConsent: consent,
          contactMethods: consent ? currentMethods : [],
        }),
        {
          contact: {
            consent,
            methods: consent ? currentMethods : [],
          },
        },
      );
    },
    [updateDraft],
  );

  const resetReport = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(reportIdStorageKey);
    }
    pendingPatchRef.current = null;
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setReport(null);
    setManualDateTime("");
    setManualLatitude("");
    setManualLongitude("");
    setError(null);
    setAnalysisState("idle");
    setRecordingState("idle");
    startedRef.current = false;
    if (deviceSourceRef.current) {
      void startReport(deviceSourceRef.current);
    }
  }, [startReport]);

  const value = useMemo<IncidentReportContextValue>(
    () => ({
      report,
      saveState,
      error,
      manualDateTime,
      manualLatitude,
      manualLongitude,
      recordingState,
      analysisState,
      setError,
      chooseTime,
      updateManualDateTime,
      requestBrowserLocation,
      updateManualLocation,
      updateNarrative,
      startRecording,
      stopRecording,
      runAnalysis,
      addPerson,
      updatePerson,
      removePerson,
      updateChecklist,
      updateContact,
      flushPendingPatches,
      resetReport,
    }),
    [
      report,
      saveState,
      error,
      manualDateTime,
      manualLatitude,
      manualLongitude,
      recordingState,
      analysisState,
      chooseTime,
      updateManualDateTime,
      requestBrowserLocation,
      updateManualLocation,
      updateNarrative,
      startRecording,
      stopRecording,
      runAnalysis,
      addPerson,
      updatePerson,
      removePerson,
      updateChecklist,
      updateContact,
      flushPendingPatches,
      resetReport,
    ],
  );

  return (
    <IncidentReportContext.Provider value={value}>
      {children}
    </IncidentReportContext.Provider>
  );
}

function mergePatches(
  current: IncidentReportPatch | null,
  next: IncidentReportPatch,
): IncidentReportPatch {
  return { ...current, ...next };
}

function seedManualFields(
  draft: IncidentDraft,
  setters: {
    readonly setManualDateTime: (value: string) => void;
    readonly setManualLatitude: (value: string) => void;
    readonly setManualLongitude: (value: string) => void;
  },
) {
  if (
    draft.incidentTimeKind === "manual" &&
    typeof draft.incidentOccurredAt === "string"
  ) {
    const date = new Date(draft.incidentOccurredAt);
    if (!Number.isNaN(date.getTime())) {
      setters.setManualDateTime(toLocalDateTimeInputValue(date));
    }
  }

  if (typeof draft.latitude === "number") {
    setters.setManualLatitude(String(draft.latitude));
  }

  if (typeof draft.longitude === "number") {
    setters.setManualLongitude(String(draft.longitude));
  }
}

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getOrCreateDeviceSource(): string {
  const existing = window.localStorage.getItem(deviceStorageKey);

  if (existing && existing.length >= 32) {
    return existing;
  }

  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const source = Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  window.localStorage.setItem(deviceStorageKey, source);
  return source;
}

function getPresetTime(kind: IncidentTimeKind): string | null {
  const now = Date.now();

  switch (kind) {
    case "just_now":
      return new Date(now).toISOString();
    case "an_hour_ago":
      return new Date(now - 60 * 60 * 1000).toISOString();
    case "yesterday":
      return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    default:
      return null;
  }
}

function getSupportedAudioMimeType(): string {
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

  return options.find((item) => MediaRecorder.isTypeSupported(item)) ?? "";
}

async function convertRecordingToWav(blob: Blob): Promise<Blob> {
  if (await hasWavHeader(blob)) {
    return blob.type === "audio/wav"
      ? blob
      : blob.slice(0, blob.size, "audio/wav");
  }

  const AudioContextClass =
    window.AudioContext ??
    (window as Window & { readonly webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("This browser cannot prepare audio for transcription.");
  }

  const audioContext = new AudioContextClass();

  try {
    const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
    const resampled = await resampleAudio(decoded, 16_000);
    return encodeWav(resampled);
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

async function hasWavHeader(blob: Blob): Promise<boolean> {
  const header = new Uint8Array(await blob.slice(0, 12).arrayBuffer());

  return asciiAt(header, "RIFF", 0) && asciiAt(header, "WAVE", 8);
}

async function resampleAudio(
  audioBuffer: AudioBuffer,
  targetSampleRate: number,
): Promise<AudioBuffer> {
  if (audioBuffer.sampleRate === targetSampleRate) {
    return audioBuffer;
  }

  const frameCount = Math.max(
    1,
    Math.ceil(audioBuffer.duration * targetSampleRate),
  );
  const offlineContext = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    frameCount,
    targetSampleRate,
  );
  const source = offlineContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(offlineContext.destination);
  source.start(0);

  return offlineContext.startRendering();
}

function encodeWav(audioBuffer: AudioBuffer): Blob {
  const sampleRate = audioBuffer.sampleRate;
  const channelData = mixToMono(audioBuffer);
  const bytesPerSample = 2;
  const dataSize = channelData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;

  for (const sample of channelData) {
    const clamped = Math.max(-1, Math.min(1, sample));
    const pcm = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(offset, pcm, true);
    offset += bytesPerSample;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const channelCount = audioBuffer.numberOfChannels;
  const mono = new Float32Array(audioBuffer.length);

  for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
    const channel = audioBuffer.getChannelData(channelIndex);

    for (let sampleIndex = 0; sampleIndex < channel.length; sampleIndex += 1) {
      mono[sampleIndex] += channel[sampleIndex] / channelCount;
    }
  }

  return mono;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function asciiAt(bytes: Uint8Array, value: string, offset: number): boolean {
  if (bytes.length < offset + value.length) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (bytes[offset + index] !== value.charCodeAt(index)) {
      return false;
    }
  }

  return true;
}

function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
