"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  quizConfig,
  type EventTypeKey,
  type LocationKey,
  type RoleKey,
} from "@/lib/quiz-config";
import { scoreQuiz, type QuizResult } from "@/lib/quiz-engine";

const defaultInput = {
  location: "other_us" as LocationKey,
  role: "community_member" as RoleKey,
  eventTypes: ["low_key_social"] as EventTypeKey[],
};

type SaveState = "idle" | "saving" | "saved" | "skipped";

const numerals = ["I.", "II.", "III."] as const;

function StarMark({ className = "" }: { className?: string }) {
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

export function SafetyQuiz() {
  const [location, setLocation] = useState<LocationKey>(defaultInput.location);
  const [role, setRole] = useState<RoleKey>(defaultInput.role);
  const [eventTypes, setEventTypes] = useState<EventTypeKey[]>(
    defaultInput.eventTypes,
  );
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

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

  function clearResult() {
    setResult(null);
    setSaveState("idle");
  }

  function toggleEventType(eventType: EventTypeKey) {
    setEventTypes((current) => {
      if (current.includes(eventType)) {
        const next = current.filter((item) => item !== eventType);
        return next.length > 0 ? next : current;
      }
      return [...current, eventType];
    });
    clearResult();
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

    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        document.getElementById("plan-anchor")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }

  function resetQuiz() {
    setLocation(defaultInput.location);
    setRole(defaultInput.role);
    setEventTypes(defaultInput.eventTypes);
    clearResult();
  }

  return (
    <main className="mx-auto w-full max-w-[44rem] px-6 pt-10 pb-24 sm:px-10 sm:pt-14">
      <Masthead />

      <Hero />

      <Ornament />

      <form onSubmit={submitQuiz} className="mt-12">
        <Section index={0} heading="Where the event is">
          <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Use the broadest bucket that still feels useful. Polaris does not
            ask for an address, a venue, or coordinates.
          </p>

          <label htmlFor="location" className="sr-only">
            State or metro
          </label>
          <select
            id="location"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value as LocationKey);
              clearResult();
            }}
            className="select-native mt-5 h-12 w-full rounded-md border border-[var(--rule)] px-4 text-[1rem] text-[var(--ink)] transition-colors duration-150 ease-out hover:border-[var(--rule-strong)] focus:border-[var(--clay)]"
          >
            <option value="other_us">Choose a state or metro</option>
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
              {locationGroups.fallback
                .filter((item) => item.key !== "other_us")
                .map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
            </optgroup>
          </select>
        </Section>

        <Section index={1} heading="Your role">
          <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Attending and organizing call for slightly different plans.
          </p>

          <fieldset className="mt-5">
            <legend className="sr-only">Role</legend>
            <ChoiceList>
              {quizConfig.roleOptions.map((option) => (
                <ChoiceRow
                  key={option.key}
                  type="radio"
                  name="role"
                  value={option.key}
                  checked={role === option.key}
                  onChange={() => {
                    setRole(option.key);
                    clearResult();
                  }}
                  label={option.label}
                  description={option.rationale}
                />
              ))}
            </ChoiceList>
          </fieldset>
        </Section>

        <Section index={2} heading="What kind of event">
          <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Select every type that applies. The more honest the picture, the
            more useful the plan.
          </p>

          <fieldset className="mt-5">
            <legend className="sr-only">Event types</legend>
            <ChoiceList>
              {quizConfig.eventTypes.map((option) => (
                <ChoiceRow
                  key={option.key}
                  type="checkbox"
                  value={option.key}
                  checked={eventTypes.includes(option.key)}
                  onChange={() => toggleEventType(option.key)}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </ChoiceList>
          </fieldset>
        </Section>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="submit"
            className="inline-flex h-11 items-center gap-3 rounded-md bg-[var(--clay)] px-5 text-[0.92rem] font-medium tracking-wide text-[var(--paper)] transition-colors duration-150 ease-out hover:bg-[var(--clay-deep)] focus:bg-[var(--clay-deep)]"
          >
            See the plan
            <span aria-hidden="true" className="text-base leading-none">
              ›
            </span>
          </button>
          <button
            type="button"
            onClick={resetQuiz}
            className="text-[0.9rem] text-[var(--ink-3)] underline decoration-[var(--rule-strong)] decoration-[1px] underline-offset-[6px] transition-colors duration-150 ease-out hover:text-[var(--ink)] hover:decoration-[var(--ink-3)]"
          >
            Start over
          </button>
        </div>
      </form>

      <div id="plan-anchor" />
      {result ? (
        <ResultPanel
          result={result}
          saveState={saveState}
          onRevise={clearResult}
        />
      ) : (
        <PlaceholderPlan />
      )}

      <Colophon />
    </main>
  );
}

function Masthead() {
  return (
    <header className="flex items-center justify-between border-b border-[var(--rule)] pb-5">
      <div className="flex items-center gap-3">
        <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
        <span className="wordmark text-[0.78rem] text-[var(--ink)]">
          Polaris
        </span>
      </div>
      <span className="text-[0.72rem] tracking-[0.18em] text-[var(--ink-3)] uppercase">
        A planning tool
      </span>
    </header>
  );
}

function Hero() {
  return (
    <section className="mt-12">
      <h1 className="display max-w-[18ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
        Plan ahead with a steady hand.
      </h1>

      <div className="mt-8 grid gap-x-12 gap-y-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
        <p className="max-w-[60ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
          Polaris is a quiet way to think through your plans for a community
          event. Answer three broad questions; receive a short, considered
          list of practical steps. Your answers stay on this page. Nothing
          identifying is stored.
        </p>

        <aside className="display border-t border-[var(--rule-strong)] pt-4 text-[0.95rem] leading-[1.6] text-[var(--ink-2)] sm:mt-2">
          <p className="italic">
            <span className="not-italic numeral mr-2 text-[var(--clay)]">
              §
            </span>
            A planning aid, not a verdict. No names, addresses, accounts, or
            coordinates leave this page.
          </p>
        </aside>
      </div>
    </section>
  );
}

function Ornament() {
  return (
    <div
      className="mt-16 flex items-center justify-center gap-5 text-[var(--clay)]"
      aria-hidden="true"
    >
      <span className="h-px w-12 bg-[var(--rule-strong)]" />
      <StarMark className="h-2.5 w-2.5" />
      <span className="h-px w-12 bg-[var(--rule-strong)]" />
    </div>
  );
}

function Section({
  index,
  heading,
  children,
}: {
  readonly index: number;
  readonly heading: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-5 flex items-baseline gap-4 border-t border-[var(--rule)] pt-7">
        <span className="numeral text-[0.95rem] text-[var(--clay-deep)]">
          {numerals[index]}
        </span>
        <h2 className="display text-[1.5rem] leading-tight text-[var(--ink)]">
          {heading}
        </h2>
      </div>
      {children}
    </section>
  );
}

function ChoiceList({ children }: { readonly children: React.ReactNode }) {
  return (
    <ul className="border-t border-[var(--rule)]">{children}</ul>
  );
}

function ChoiceRow({
  type,
  name,
  value,
  checked,
  onChange,
  label,
  description,
}: {
  readonly type: "radio" | "checkbox";
  readonly name?: string;
  readonly value: string;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly label: string;
  readonly description: string;
}) {
  return (
    <li className="border-b border-[var(--rule)]">
      <label
        className={`group grid cursor-pointer grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 px-3 py-4 transition-colors duration-150 ease-out -mx-3 ${
          checked
            ? "bg-[var(--clay-soft)]"
            : "hover:bg-[var(--paper-deep)]"
        }`}
      >
        <span className="relative mt-[3px] flex h-5 w-5 items-center justify-center">
          <input
            type={type}
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
            className="peer absolute inset-0 cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center border transition-colors duration-150 ease-out ${
              type === "radio" ? "rounded-full" : "rounded-[3px]"
            } ${
              checked
                ? "border-[var(--clay)] bg-[var(--clay)]"
                : "border-[var(--rule-strong)] bg-[var(--paper-inset)] group-hover:border-[var(--ink-3)]"
            } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]`}
          >
            {checked ? (
              type === "radio" ? (
                <span className="h-2 w-2 rounded-full bg-[var(--paper)]" />
              ) : (
                <svg
                  viewBox="0 0 16 16"
                  className="h-3 w-3 text-[var(--paper)]"
                  aria-hidden="true"
                >
                  <path
                    d="M3.5 8.5 L6.5 11.5 L12.5 4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )
            ) : null}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[1rem] font-medium text-[var(--ink)]">
            {label}
          </span>
          <span className="mt-1 block max-w-[58ch] text-[0.92rem] leading-relaxed text-[var(--ink-2)]">
            {description}
          </span>
        </span>
      </label>
    </li>
  );
}

function PlaceholderPlan() {
  return (
    <section className="mt-16 border-t border-[var(--rule)] pt-10">
      <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--ink-3)] uppercase">
        Your plan
      </p>
      <p className="mt-4 max-w-[58ch] text-[1.0625rem] leading-[1.7] text-[var(--ink-3)] italic">
        Once you answer the three questions above, a short prioritized list of
        practical steps will appear here.
      </p>
    </section>
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
      className="mt-16 border-t-2 border-[var(--ink)] pt-10"
      aria-live="polite"
    >
      <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
        Your plan
      </p>

      <h2 className="display mt-3 max-w-[20ch] text-[2rem] leading-[1.15] text-[var(--ink)] sm:text-[2.25rem]">
        {result.riskLabel} planning band.
      </h2>

      <p className="mt-6 max-w-[60ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
        {result.rationale}
      </p>

      <div className="mt-12 grid gap-12">
        {result.guidanceGroups.map((group) => (
          <div key={group.key}>
            <div className="flex items-baseline gap-3">
              <StarMark className="h-2.5 w-2.5 text-[var(--clay)]" />
              <h3 className="display text-[1.25rem] leading-tight text-[var(--ink)]">
                {group.title}
              </h3>
            </div>
            <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
              {group.description}
            </p>
            <ol className="mt-6 grid gap-7">
              {group.items.map((item, index) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[2.25rem_1fr] gap-x-4"
                >
                  <span className="numeral pt-[2px] text-[0.95rem] tabular-nums text-[var(--clay-deep)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[1rem] font-medium text-[var(--ink)]">
                      {item.title}
                    </p>
                    <p className="mt-1.5 max-w-[58ch] text-[0.95rem] leading-[1.65] text-[var(--ink-2)]">
                      {item.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-[var(--rule)] pt-6">
        <button
          type="button"
          onClick={onRevise}
          className="text-[0.92rem] text-[var(--ink)] underline decoration-[var(--rule-strong)] decoration-[1px] underline-offset-[6px] transition-colors duration-150 ease-out hover:decoration-[var(--ink-2)]"
        >
          Revise your answers
        </button>
        <p className="text-[0.78rem] leading-relaxed text-[var(--ink-3)]">
          {saveStateCopy(saveState)}
        </p>
      </div>
    </section>
  );
}

function saveStateCopy(state: SaveState): string {
  switch (state) {
    case "saving":
      return "Saving an anonymous aggregate of this result.";
    case "saved":
      return "Anonymous aggregate saved. No identifying details left this page.";
    case "skipped":
      return "Plan ready. Nothing was saved.";
    default:
      return "Plan ready.";
  }
}

function Colophon() {
  return (
    <footer className="mt-24 border-t border-[var(--rule)] pt-10">
      <div className="flex items-center gap-3">
        <StarMark className="h-3 w-3 text-[var(--clay)]" />
        <span className="wordmark text-[0.7rem] text-[var(--ink-2)]">
          Polaris
        </span>
      </div>
      <p className="mt-4 max-w-[58ch] text-[0.875rem] leading-[1.7] text-[var(--ink-3)]">
        A planning tool, not a verdict. Polaris offers structure for thinking
        through ordinary preparations. Your circumstances will always have
        details this tool cannot see.
      </p>
      <p className="mt-3 max-w-[58ch] text-[0.8rem] leading-[1.7] text-[var(--ink-3)]">
        What stays here: your answers. What leaves: nothing identifying. No
        names, accounts, addresses, or coordinates are stored by this form.
      </p>
    </footer>
  );
}
