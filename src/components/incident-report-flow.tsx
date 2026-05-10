"use client";

import {
  Check,
  ChevronLeft,
  LocateFixed,
  Mail,
  Mic,
  Phone,
  Plus,
  Square,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  useEffect,
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

type SaveState = "idle" | "starting" | "saving" | "saved" | "error";
type RecordingState = "idle" | "recording" | "transcribing" | "unsupported";

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
const timeChoices: {
  readonly kind: IncidentTimeKind;
  readonly label: string;
}[] = [
  { kind: "just_now", label: "Just now" },
  { kind: "an_hour_ago", label: "An hour ago" },
  { kind: "yesterday", label: "Yesterday" },
  { kind: "manual", label: "Manual" },
];

export function IncidentReportFlow({
  onBack,
  onAssessRisk,
}: {
  readonly onBack: () => void;
  readonly onAssessRisk: () => void;
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
  const [analysisState, setAnalysisState] = useState<
    "idle" | "running" | "done" | "error"
  >("idle");
  const pendingPatchRef = useRef<IncidentReportPatch | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    const source = getOrCreateDeviceSource();
    setDeviceSource(source);

    fetch("/api/incident-reports", {
      method: "POST",
      headers: {
        "x-polaris-device-source": source,
      },
    })
      .then(async (response) => {
        const payload = (await response.json()) as ApiPayload;

        if (!response.ok || !payload.report) {
          throw new Error(payload.error ?? "Unable to start report");
        }

        setReport(payload.report);
        setSaveState("saved");
      })
      .catch((nextError: unknown) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to start report",
        );
        setSaveState("error");
      });
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      stopTracks();
    };
  }, []);

  function updateDraft(
    updater: (draft: IncidentDraft) => IncidentDraft,
    patch: IncidentReportPatch,
  ) {
    setReport((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        draft: updater(current.draft),
      };
    });
    schedulePatch(patch);
  }

  function schedulePatch(patch: IncidentReportPatch) {
    pendingPatchRef.current = {
      ...pendingPatchRef.current,
      ...patch,
    };
    setSaveState("saving");

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void flushPatch();
    }, 650);
  }

  async function flushPatch() {
    if (!report || !deviceSource || !pendingPatchRef.current) {
      return;
    }

    const patch = pendingPatchRef.current;
    pendingPatchRef.current = null;
    saveTimerRef.current = null;

    try {
      const response = await fetch(`/api/incident-reports/${report.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-polaris-device-source": deviceSource,
        },
        body: JSON.stringify(patch),
      });
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
  }

  function chooseTime(kind: IncidentTimeKind) {
    const occurredAt = getPresetTime(kind);
    const incidentTime = {
      kind,
      occurredAt,
      note: "",
    };

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
  }

  function updateManualDateTime(value: string) {
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
  }

  function updateLocation(
    source: IncidentLocationSource,
    label: string,
    latitude: number | null,
    longitude: number | null,
    accuracyMeters: number | null,
  ) {
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
  }

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setError("Browser location is not available. Use manual location instead.");
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
  }

  function updateManualLocation(next: {
    readonly label?: string;
    readonly latitude?: string;
    readonly longitude?: string;
  }) {
    if (!report) {
      return;
    }

    const label = next.label ?? report.draft.locationLabel;
    const latitudeText = next.latitude ?? manualLatitude;
    const longitudeText = next.longitude ?? manualLongitude;
    const parsedLatitude = parseOptionalNumber(latitudeText);
    const parsedLongitude = parseOptionalNumber(longitudeText);
    const hasCoordinatePair =
      latitudeText.trim().length > 0 && longitudeText.trim().length > 0;
    const hasValidCoordinatePair =
      hasCoordinatePair && parsedLatitude !== null && parsedLongitude !== null;
    const latitude = hasValidCoordinatePair ? parsedLatitude : null;
    const longitude = hasValidCoordinatePair ? parsedLongitude : null;

    if (next.latitude !== undefined) {
      setManualLatitude(next.latitude);
    }
    if (next.longitude !== undefined) {
      setManualLongitude(next.longitude);
    }

    updateLocation("manual", label, latitude, longitude, null);
  }

  function updateNarrative(value: string) {
    updateDraft(
      (draft) => ({ ...draft, narrativeText: value }),
      { narrativeText: value },
    );
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
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

      recorder.start();
      setRecordingState("recording");
    } catch {
      setRecordingState("unsupported");
      setError("Microphone access was not available. Typing still works.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
      setRecordingState("transcribing");
    }
  }

  async function transcribeAudio(blob: Blob) {
    if (!report || !deviceSource) {
      return;
    }

    setRecordingState("transcribing");

    const formData = new FormData();
    formData.append("audio", blob, `incident-audio.${extensionForMime(blob.type)}`);

    try {
      const response = await fetch(
        `/api/incident-reports/${report.id}/transcribe`,
        {
          method: "POST",
          headers: {
            "x-polaris-device-source": deviceSource,
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
          : "Unable to transcribe audio",
      );
    }
  }

  async function runAnalysis() {
    if (!report || !deviceSource) {
      return;
    }

    await flushPatch();
    setAnalysisState("running");

    try {
      const response = await fetch(`/api/incident-reports/${report.id}/analyze`, {
        method: "POST",
        headers: {
          "x-polaris-device-source": deviceSource,
        },
      });
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
  }

  function addPerson() {
    updatePeopleFromCurrent((people) => [
      ...people,
      {
        displayName: "Unknown person",
        role: "",
        description: "",
        source: "user",
      },
    ]);
  }

  function updatePerson(index: number, person: IncidentPerson) {
    updatePeopleFromCurrent((people) =>
      people.map((current, itemIndex) => (itemIndex === index ? person : current)),
    );
  }

  function removePerson(index: number) {
    updatePeopleFromCurrent((people) =>
      people.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function updatePeopleFromCurrent(
    updater: (people: readonly IncidentPerson[]) => readonly IncidentPerson[],
  ) {
    let nextPeople: readonly IncidentPerson[] | null = null;

    setReport((current) => {
      if (!current) {
        return current;
      }

      nextPeople = updater(current.draft.people);

      return {
        ...current,
        draft: {
          ...current.draft,
          people: nextPeople,
        },
      };
    });

    if (nextPeople) {
      schedulePatch({ people: nextPeople });
    }
  }

  function updateChecklist(checklist: readonly IncidentChecklistItem[]) {
    updateDraft((draft) => ({ ...draft, checklist }), { checklist });
  }

  function updateContact(consent: boolean, methods = report?.draft.contactMethods ?? []) {
    updateDraft(
      (draft) => ({
        ...draft,
        contactConsent: consent,
        contactMethods: consent ? methods : [],
      }),
      {
        contact: {
          consent,
          methods: consent ? methods : [],
        },
      },
    );
  }

  const draft = report?.draft;

  return (
    <main className="mx-auto w-full max-w-[48rem] px-6 pt-8 pb-24 sm:px-10 sm:pt-12">
      <header className="flex items-center justify-between border-b border-[var(--rule)] pb-5">
        <div className="flex items-center gap-3">
          <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
          <span className="wordmark text-[0.78rem] text-[var(--ink)]">
            Polaris
          </span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[0.82rem] text-[var(--ink-3)] underline decoration-[var(--rule-strong)] underline-offset-[6px] transition-colors duration-150 ease-out hover:text-[var(--ink)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Home
        </button>
      </header>

      <section className="mt-10">
        <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
          Incident report
        </p>
        <h1 className="display mt-3 max-w-[18ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
          Record what happened while details are fresh.
        </h1>
        <div className="mt-7 grid gap-x-12 gap-y-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
          <p className="max-w-[62ch] text-[1.03rem] leading-[1.75] text-[var(--ink-2)]">
            Start with time, place, and a plain account. Polaris autosaves from
            this browser and can help turn a rough narrative into stronger
            documentation.
          </p>
          <aside className="display border-t border-[var(--rule-strong)] pt-4 text-[0.95rem] leading-[1.6] text-[var(--ink-2)] sm:mt-2">
            <p className="italic">
              <span className="not-italic numeral mr-2 text-[var(--clay)]">
                §
              </span>
              Incident reports may include identifying details when you choose
              to provide them. The safety quiz remains the no-identifying-detail
              path.
            </p>
          </aside>
        </div>
      </section>

      <StatusBar saveState={saveState} error={error} report={report} />

      {!draft ? (
        <section className="mt-12 border-t border-[var(--rule)] pt-8">
          <p className="text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Starting a report...
          </p>
        </section>
      ) : (
        <div className="mt-12">
          <IncidentSection index="I." heading="When">
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {timeChoices.map((choice) => (
                <button
                  key={choice.kind}
                  type="button"
                  onClick={() => chooseTime(choice.kind)}
                  className={`h-11 rounded-md border px-3 text-[0.9rem] transition-colors duration-150 ease-out ${
                    draft.incidentTimeKind === choice.kind
                      ? "border-[var(--clay)] bg-[var(--clay-soft)] text-[var(--clay-deep)]"
                      : "border-[var(--rule)] bg-[var(--paper-inset)] text-[var(--ink-2)] hover:border-[var(--rule-strong)]"
                  }`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
            {draft.incidentTimeKind === "manual" ? (
              <label className="mt-5 block">
                <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                  Date and time
                </span>
                <input
                  type="datetime-local"
                  value={manualDateTime}
                  onChange={(event) => updateManualDateTime(event.target.value)}
                  className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
                />
              </label>
            ) : null}
          </IncidentSection>

          <IncidentSection index="II." heading="Where">
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={requestBrowserLocation}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--clay)] px-4 text-[0.9rem] font-medium text-[var(--paper)] transition-colors duration-150 ease-out hover:bg-[var(--clay-deep)]"
              >
                <LocateFixed className="h-4 w-4" aria-hidden="true" />
                Use browser location
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <label>
                <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                  Address, venue, or description
                </span>
                <input
                  value={draft.locationLabel}
                  onChange={(event) =>
                    updateManualLocation({ label: event.target.value })
                  }
                  className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                    Latitude
                  </span>
                  <input
                    inputMode="decimal"
                    value={manualLatitude}
                    onChange={(event) =>
                      updateManualLocation({ latitude: event.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
                  />
                </label>
                <label>
                  <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                    Longitude
                  </span>
                  <input
                    inputMode="decimal"
                    value={manualLongitude}
                    onChange={(event) =>
                      updateManualLocation({ longitude: event.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[1rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
                  />
                </label>
              </div>
            </div>
          </IncidentSection>

          <IncidentSection index="III." heading="What happened">
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {recordingState === "recording" ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--ink)] px-4 text-[0.9rem] font-medium text-[var(--paper)] transition-colors duration-150 ease-out hover:bg-[var(--ink-2)]"
                >
                  <Square className="h-4 w-4" aria-hidden="true" />
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={recordingState === "transcribing"}
                  className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--clay)] px-4 text-[0.9rem] font-medium text-[var(--paper)] transition-colors duration-150 ease-out hover:bg-[var(--clay-deep)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Mic className="h-4 w-4" aria-hidden="true" />
                  {recordingState === "transcribing"
                    ? "Transcribing"
                    : "Record voice"}
                </button>
              )}
              {recordingState === "unsupported" ? (
                <p className="text-[0.86rem] text-[var(--ink-3)]">
                  Voice recording is not available in this browser.
                </p>
              ) : null}
            </div>
            {draft.transcriptText ? (
              <div className="mt-5 border-t border-[var(--rule)] pt-4">
                <p className="text-[0.82rem] font-medium tracking-[0.12em] text-[var(--ink-3)] uppercase">
                  Transcript
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
                  {draft.transcriptText}
                </p>
              </div>
            ) : null}
            <label className="mt-5 block">
              <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
                Written account
              </span>
              <textarea
                value={draft.narrativeText}
                onChange={(event) => updateNarrative(event.target.value)}
                rows={8}
                className="mt-2 w-full resize-y rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 py-3 text-[1rem] leading-relaxed transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
              />
            </label>
          </IncidentSection>

          <IncidentSection index="IV." heading="Who was involved">
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runAnalysis}
                disabled={analysisState === "running"}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--clay)] px-4 text-[0.9rem] font-medium text-[var(--paper)] transition-colors duration-150 ease-out hover:bg-[var(--clay-deep)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                {analysisState === "running" ? "Reviewing" : "Extract people"}
              </button>
              <button
                type="button"
                onClick={addPerson}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[0.9rem] font-medium text-[var(--ink)] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add person
              </button>
            </div>
            <PeopleEditor
              people={draft.people}
              onUpdatePerson={updatePerson}
              onRemovePerson={removePerson}
            />
          </IncidentSection>

          <IncidentSection index="V." heading="What next">
            <ChecklistEditor
              checklist={draft.checklist}
              onChange={updateChecklist}
            />
          </IncidentSection>

          <IncidentSection index="VI." heading="Quality score">
            <div className="mt-5 border-t-2 border-[var(--ink)] pt-6">
              <div className="flex items-baseline justify-between gap-6">
                <p className="display text-[2rem] leading-none text-[var(--ink)]">
                  {report.quality.score}
                  <span className="text-[1rem] text-[var(--ink-3)]">/100</span>
                </p>
                <p className="max-w-[34ch] text-right text-[0.88rem] leading-relaxed text-[var(--ink-3)]">
                  This score helps strengthen documentation. It never blocks
                  autosave.
                </p>
              </div>
              <div
                className="mt-5 h-2 w-full overflow-hidden rounded-full bg-[var(--paper-deep)]"
                aria-hidden="true"
              >
                <div
                  className="h-full bg-[var(--clay)] transition-[width] duration-150 ease-out"
                  style={{ width: `${report.quality.score}%` }}
                />
              </div>
              {report.quality.feedback.length > 0 ? (
                <ul className="mt-6 grid gap-3">
                  {report.quality.feedback.map((item) => (
                    <li
                      key={item}
                      className="grid grid-cols-[1.5rem_1fr] gap-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]"
                    >
                      <Check
                        className="mt-1 h-4 w-4 text-[var(--clay)]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </IncidentSection>

          <IncidentSection index="VII." heading="Contact opt-in">
            <fieldset className="mt-5">
              <legend className="sr-only">Follow-up contact consent</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ConsentButton
                  active={draft.contactConsent === true}
                  onClick={() => updateContact(true)}
                  label="Contact is allowed"
                />
                <ConsentButton
                  active={draft.contactConsent === false}
                  onClick={() => updateContact(false)}
                  label="Do not contact me"
                />
              </div>
            </fieldset>
            {draft.contactConsent === true ? (
              <ContactMethodsEditor
                methods={draft.contactMethods}
                onChange={(methods) => updateContact(true, methods)}
              />
            ) : null}
          </IncidentSection>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--rule)] pt-6">
            <button
              type="button"
              onClick={onAssessRisk}
              className="text-[0.92rem] text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-[6px] transition-colors duration-150 ease-out hover:decoration-[var(--ink-2)]"
            >
              Assess your risk instead
            </button>
            <p className="text-[0.78rem] leading-relaxed text-[var(--ink-3)]">
              Report ID: {report.id}
            </p>
          </div>
        </div>
      )}
    </main>
  );

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }
}

function StatusBar({
  saveState,
  error,
  report,
}: {
  readonly saveState: SaveState;
  readonly error: string | null;
  readonly report: IncidentClientReport | null;
}) {
  return (
    <section className="mt-8 border-y border-[var(--rule)] py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.84rem] font-medium text-[var(--ink)]">
          {statusCopy(saveState)}
        </p>
        {report?.lastAutosavedAt ? (
          <p className="text-[0.78rem] text-[var(--ink-3)]">
            Last saved {formatTime(report.lastAutosavedAt)}
          </p>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--clay-deep)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function IncidentSection({
  index,
  heading,
  children,
}: {
  readonly index: string;
  readonly heading: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-5 flex items-baseline gap-4 border-t border-[var(--rule)] pt-7">
        <span className="numeral text-[0.95rem] text-[var(--clay-deep)]">
          {index}
        </span>
        <h2 className="display text-[1.5rem] leading-tight text-[var(--ink)]">
          {heading}
        </h2>
      </div>
      {children}
    </section>
  );
}

function PeopleEditor({
  people,
  onUpdatePerson,
  onRemovePerson,
}: {
  readonly people: readonly IncidentPerson[];
  readonly onUpdatePerson: (index: number, person: IncidentPerson) => void;
  readonly onRemovePerson: (index: number) => void;
}) {
  if (people.length === 0) {
    return (
      <p className="mt-6 border-t border-[var(--rule)] pt-5 text-[0.95rem] leading-relaxed text-[var(--ink-3)] italic">
        No people listed yet.
      </p>
    );
  }

  return (
    <ol className="mt-6 border-t border-[var(--rule)]">
      {people.map((person, index) => (
        <li key={`${person.displayName}-${index}`} className="border-b border-[var(--rule)] py-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <TextInput
              label="Name or identifier"
              value={person.displayName}
              onChange={(value) =>
                onUpdatePerson(index, {
                  ...person,
                  displayName: value || "Unknown person",
                })
              }
            />
            <TextInput
              label="Role"
              value={person.role}
              onChange={(value) =>
                onUpdatePerson(index, { ...person, role: value })
              }
            />
            <button
              type="button"
              onClick={() => onRemovePerson(index)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-4 text-[0.9rem] text-[var(--ink-2)] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)] sm:mt-7 sm:w-12 sm:px-0"
              aria-label={`Remove ${person.displayName}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sm:sr-only">Remove</span>
            </button>
          </div>
          <label className="mt-4 block">
            <span className="block text-[0.82rem] font-medium text-[var(--ink)]">
              Details
            </span>
            <textarea
              value={person.description}
              onBlur={(event) =>
                onUpdatePerson(index, {
                  ...person,
                  description: event.currentTarget.value,
                })
              }
              onInput={(event) =>
                onUpdatePerson(index, {
                  ...person,
                  description: event.currentTarget.value,
                })
              }
              onChange={(event) =>
                onUpdatePerson(index, {
                  ...person,
                  description: event.target.value,
                })
              }
              rows={2}
              className="mt-2 w-full resize-y rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 py-2 text-[0.95rem] leading-relaxed transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
            />
          </label>
        </li>
      ))}
    </ol>
  );
}

function ChecklistEditor({
  checklist,
  onChange,
}: {
  readonly checklist: readonly IncidentChecklistItem[];
  readonly onChange: (checklist: readonly IncidentChecklistItem[]) => void;
}) {
  return (
    <ul className="mt-5 border-t border-[var(--rule)]">
      {checklist.map((item, index) => (
        <li key={item.id} className="border-b border-[var(--rule)]">
          <label
            className={`grid cursor-pointer grid-cols-[auto_1fr] gap-4 px-3 py-4 -mx-3 transition-colors duration-150 ease-out ${
              item.completed ? "bg-[var(--clay-soft)]" : "hover:bg-[var(--paper-deep)]"
            }`}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={(event) => {
                const next = checklist.map((current, itemIndex) =>
                  itemIndex === index
                    ? { ...current, completed: event.target.checked }
                    : current,
                );
                onChange(next);
              }}
              className="mt-1 h-5 w-5 accent-[var(--clay)]"
            />
            <span>
              <span className="block text-[1rem] font-medium text-[var(--ink)]">
                {item.label}
              </span>
              <span className="mt-1 block max-w-[58ch] text-[0.92rem] leading-relaxed text-[var(--ink-2)]">
                {item.rationale}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function ConsentButton({
  active,
  onClick,
  label,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-md border px-4 text-left text-[0.95rem] transition-colors duration-150 ease-out ${
        active
          ? "border-[var(--clay)] bg-[var(--clay-soft)] text-[var(--clay-deep)]"
          : "border-[var(--rule)] bg-[var(--paper-inset)] text-[var(--ink-2)] hover:border-[var(--rule-strong)]"
      }`}
    >
      {label}
    </button>
  );
}

function ContactMethodsEditor({
  methods,
  onChange,
}: {
  readonly methods: readonly { readonly type: string; readonly value: string }[];
  readonly onChange: (
    methods: readonly { readonly type: string; readonly value: string }[],
  ) => void;
}) {
  const email = methods.find((method) => method.type === "email")?.value ?? "";
  const phone = methods.find((method) => method.type === "phone")?.value ?? "";

  function update(type: "email" | "phone", value: string) {
    const others = methods.filter((method) => method.type !== type);
    onChange(value.trim() ? [...others, { type, value }] : others);
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <IconInput
        icon={<Mail className="h-4 w-4" aria-hidden="true" />}
        label="Email"
        value={email}
        onChange={(value) => update("email", value)}
      />
      <IconInput
        icon={<Phone className="h-4 w-4" aria-hidden="true" />}
        label="Phone"
        value={phone}
        onChange={(value) => update("phone", value)}
      />
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[0.82rem] font-medium text-[var(--ink)]">
        {label}
      </span>
      <input
        value={value}
        onBlur={(event) => onChange(event.currentTarget.value)}
        onInput={(event) => onChange(event.currentTarget.value)}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.95rem] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)]"
      />
    </label>
  );
}

function IconInput({
  icon,
  label,
  value,
  onChange,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
        {label}
      </span>
      <span className="mt-2 grid h-12 grid-cols-[auto_1fr] items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 transition-colors duration-150 ease-out focus-within:border-[var(--clay)] hover:border-[var(--rule-strong)]">
        <span className="text-[var(--ink-3)]">{icon}</span>
        <input
          value={value}
          onBlur={(event) => onChange(event.currentTarget.value)}
          onInput={(event) => onChange(event.currentTarget.value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 border-0 bg-transparent outline-none"
        />
      </span>
    </label>
  );
}

function StarMark({ className = "" }: { readonly className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 1.6 L13.05 10.95 L22.4 12 L13.05 13.05 L12 22.4 L10.95 13.05 L1.6 12 L10.95 10.95 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getOrCreateDeviceSource(): string {
  const existing = window.localStorage.getItem(deviceStorageKey);

  if (existing && existing.length >= 32) {
    return existing;
  }

  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const source = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
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
  const options = [
    "audio/wav",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return options.find((item) => MediaRecorder.isTypeSupported(item)) ?? "";
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes("wav")) {
    return "wav";
  }
  if (mimeType.includes("mp4")) {
    return "m4a";
  }
  if (mimeType.includes("mpeg")) {
    return "mp3";
  }
  return "webm";
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

function statusCopy(state: SaveState): string {
  switch (state) {
    case "starting":
      return "Starting report.";
    case "saving":
      return "Autosaving.";
    case "saved":
      return "Autosaved.";
    case "error":
      return "Autosave needs attention.";
    default:
      return "Ready.";
  }
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
