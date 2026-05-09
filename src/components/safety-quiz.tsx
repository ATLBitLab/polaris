"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  quizConfig,
  type EventTypeKey,
  type LocationKey,
  type RoleKey,
} from "@/lib/quiz-config";
import { scoreQuiz, type QuizResult } from "@/lib/quiz-engine";

const defaultInput = {
  location: "metro_atlanta" as LocationKey,
  role: "community_member" as RoleKey,
  eventTypes: ["low_key_social"] as EventTypeKey[],
};

const bandTone = {
  lower:
    "border-[oklch(71%_0.07_165)] bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  moderate:
    "border-[oklch(72%_0.076_75)] bg-[var(--caution-soft)] text-[oklch(33%_0.055_72)]",
  elevated:
    "border-[oklch(70%_0.082_48)] bg-[var(--attention-soft)] text-[oklch(32%_0.06_48)]",
} as const;

type SaveState = "idle" | "saving" | "saved" | "skipped";

export function SafetyQuiz() {
  const [location, setLocation] = useState<LocationKey>(defaultInput.location);
  const [role, setRole] = useState<RoleKey>(defaultInput.role);
  const [eventTypes, setEventTypes] = useState<EventTypeKey[]>(
    defaultInput.eventTypes,
  );
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const currentResult = useMemo(
    () => scoreQuiz({ location, role, eventTypes }),
    [eventTypes, location, role],
  );

  const locationGroups = useMemo(
    () => ({
      metro: quizConfig.locationBuckets.filter((item) => item.kind === "metro"),
      state: quizConfig.locationBuckets.filter((item) => item.kind === "state"),
      fallback: quizConfig.locationBuckets.filter(
        (item) => item.kind === "fallback",
      ),
    }),
    [],
  );

  function toggleEventType(eventType: EventTypeKey) {
    setEventTypes((current) => {
      if (current.includes(eventType)) {
        const next = current.filter((item) => item !== eventType);
        return next.length > 0 ? next : current;
      }

      return [...current, eventType];
    });
    setResult(null);
    setSaveState("idle");
  }

  async function submitQuiz(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextResult = scoreQuiz({ location, role, eventTypes });

    setResult(nextResult);
    setSaveState("saving");

    try {
      const response = await fetch("/api/quiz-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, role, eventTypes }),
      });

      const payload = (await response.json()) as { saved?: boolean };
      setSaveState(response.ok && payload.saved ? "saved" : "skipped");
    } catch {
      setSaveState("skipped");
    }
  }

  function resetQuiz() {
    setLocation(defaultInput.location);
    setRole(defaultInput.role);
    setEventTypes(defaultInput.eventTypes);
    setResult(null);
    setSaveState("idle");
  }

  const selectedLocation = quizConfig.locationBuckets.find(
    (item) => item.key === location,
  );
  const selectedRole = quizConfig.roleOptions.find((item) => item.key === role);

  return (
    <main className="min-h-screen px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="grid gap-5 border-b border-[var(--border)] pb-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] md:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
              Polaris
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-[var(--foreground)] sm:text-4xl">
              Safety Quiz
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Choose broad details about the event. The result is a calm
              planning band and a short action list.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4 text-sm leading-6 text-[var(--muted)]">
            <LockKeyhole
              className="mt-1 h-4 w-4 flex-none text-[var(--accent-strong)]"
              aria-hidden="true"
            />
            <p>
              No names, contact info, street addresses, exact coordinates,
              accounts, or IP addresses are stored by this form.
            </p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)]">
          <form className="flex flex-col gap-7" onSubmit={submitQuiz}>
            <section className="border-b border-[var(--border)] pb-7">
              <label
                htmlFor="location"
                className="text-base font-semibold text-[var(--foreground)]"
              >
                State or metro
              </label>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Use the broadest bucket that still feels useful for planning.
              </p>
              <select
                id="location"
                value={location}
                onChange={(event) => {
                  setLocation(event.target.value as LocationKey);
                  setResult(null);
                  setSaveState("idle");
                }}
                className="mt-4 min-h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-base text-[var(--foreground)] shadow-sm transition-colors duration-150 ease-out hover:border-[var(--accent)]"
              >
                <optgroup label="Metro areas">
                  {locationGroups.metro.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="States">
                  {locationGroups.state.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Other">
                  {locationGroups.fallback.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </section>

            <fieldset className="border-b border-[var(--border)] pb-7">
              <legend className="text-base font-semibold text-[var(--foreground)]">
                Role
              </legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {quizConfig.roleOptions.map((option) => (
                  <label
                    key={option.key}
                    className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-lg border p-4 transition duration-150 ease-out ${
                      role === option.key
                        ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.key}
                      checked={role === option.key}
                      onChange={() => {
                        setRole(option.key);
                        setResult(null);
                        setSaveState("idle");
                      }}
                      className="mt-1 h-4 w-4 accent-[var(--accent)]"
                    />
                    <span>
                      <span className="block font-medium text-[var(--foreground)]">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                        {option.rationale}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="pb-2">
              <legend className="text-base font-semibold text-[var(--foreground)]">
                Event types
              </legend>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Select every type that applies.
              </p>
              <div className="mt-4 grid gap-3">
                {quizConfig.eventTypes.map((option) => {
                  const checked = eventTypes.includes(option.key);

                  return (
                    <label
                      key={option.key}
                      className={`grid cursor-pointer grid-cols-[auto_1fr_auto] items-start gap-3 rounded-lg border p-4 transition duration-150 ease-out ${
                        checked
                          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={option.key}
                        checked={checked}
                        onChange={() => toggleEventType(option.key)}
                        className="mt-1 h-4 w-4 accent-[var(--accent)]"
                      />
                      <span>
                        <span className="block font-medium text-[var(--foreground)]">
                          {option.label}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                          {option.description}
                        </span>
                      </span>
                      {checked ? (
                        <Check
                          className="mt-1 h-5 w-5 text-[var(--accent-strong)]"
                          aria-hidden="true"
                        />
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center">
              <button
                type="submit"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[var(--accent-strong)] px-5 text-sm font-semibold text-[oklch(96%_0.009_150)] shadow-sm transition duration-150 ease-out hover:bg-[var(--accent)]"
              >
                See plan
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={resetQuiz}
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition duration-150 ease-out hover:border-[var(--accent)]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Start over
              </button>
            </div>
          </form>

          <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Current inputs
              </p>
              <dl className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted)]">Location</dt>
                  <dd className="text-right font-medium text-[var(--foreground)]">
                    {selectedLocation?.label}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted)]">Role</dt>
                  <dd className="text-right font-medium text-[var(--foreground)]">
                    {selectedRole?.shortLabel}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted)]">Planning band</dt>
                  <dd className="text-right font-medium text-[var(--foreground)]">
                    {currentResult.riskLabel}
                  </dd>
                </div>
              </dl>
            </section>

            {result ? (
              <ResultPanel
                result={result}
                saveState={saveState}
                onRevise={() => {
                  setResult(null);
                  setSaveState("idle");
                }}
              />
            ) : (
              <section className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
                <ShieldCheck
                  className="h-5 w-5 text-[var(--accent-strong)]"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                  The plan appears here
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Answer the quiz to see a prioritized action list for event
                  safety and identity protection.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function ResultPanel({
  result,
  saveState,
  onRevise,
}: {
  readonly result: QuizResult;
  readonly saveState: SaveState;
  readonly onRevise: () => void;
}) {
  return (
    <section
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            Result
          </p>
          <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {result.riskLabel} planning band
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-semibold ${bandTone[result.riskBand]}`}
        >
          {result.riskLabel}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
        {result.rationale}
      </p>

      <div className="mt-6 flex flex-col gap-5">
        {result.guidanceGroups.map((group) => (
          <section key={group.key}>
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              {group.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              {group.description}
            </p>
            <ol className="mt-3 grid gap-3">
              {group.items.map((item, index) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[2rem_1fr] gap-3 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--accent-strong)]">
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--foreground)]">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-[var(--muted)]">
                      {item.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onRevise}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--foreground)] transition duration-150 ease-out hover:border-[var(--accent)]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Revise answers
        </button>
        <p className="text-xs leading-5 text-[var(--muted)]">
          {saveState === "saving"
            ? "Saving anonymous aggregate result."
            : saveState === "saved"
              ? "Anonymous aggregate result saved."
              : saveState === "skipped"
                ? "Result shown. Analytics were not saved."
                : "Result ready."}
        </p>
      </div>
    </section>
  );
}
