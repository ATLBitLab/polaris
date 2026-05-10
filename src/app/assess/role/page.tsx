"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSafetyQuiz } from "@/components/safety-quiz-provider";
import type { QuizRole } from "@/lib/quiz-config";

type RoleOption = {
  readonly value: QuizRole;
  readonly label: string;
  readonly description: string;
};

const roleOptions: readonly RoleOption[] = [
  {
    value: "organizer",
    label: "Organizer",
    description:
      "You organize political protests, activism, or community events.",
  },
  {
    value: "participant",
    label: "Participant",
    description:
      "You only participate in protests, activism, or community events organized by others.",
  },
];

export default function AssessRolePage() {
  const router = useRouter();
  const { role, setRole } = useSafetyQuiz();
  const [selected, setSelected] = useState<QuizRole | null>(role);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );

  function handleSelect(value: QuizRole) {
    setSelected(value);
    setValidationMessage(null);
  }

  function handleContinue() {
    if (!selected) {
      setValidationMessage("Pick an option to continue.");
      return;
    }

    setRole(selected);
    router.push("/assess/1");
  }

  return (
    <>
      <p className="mt-10 text-[0.78rem] tracking-[0.16em] text-[var(--ink-3)] uppercase">
        Get started
      </p>

      <section className="mt-5">
        <div className="mb-3 border-t border-[var(--rule)] pt-7">
          <h2 className="display text-[1.5rem] leading-tight text-[var(--ink)]">
            How do you self-identify?
          </h2>
        </div>
        <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          Your answer changes which questions you see next.
        </p>

        <fieldset className="mt-5">
          <legend className="sr-only">How do you self-identify?</legend>
          <ul className="border-t border-[var(--rule)]">
            {roleOptions.map((option) => (
              <RoleRow
                key={option.value}
                value={option.value}
                checked={selected === option.value}
                onChange={() => handleSelect(option.value)}
                label={option.label}
                description={option.description}
              />
            ))}
          </ul>
        </fieldset>
      </section>

      {validationMessage ? (
        <p className="mt-8 max-w-[58ch] text-[0.9rem] leading-relaxed text-[var(--clay-deep)]">
          {validationMessage}
        </p>
      ) : null}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--rule)] pt-6">
        <Link href="/assess" className="button button-link">
          <span className="button-icon" aria-hidden="true">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span>Back</span>
        </Link>
        <Button
          type="button"
          onClick={handleContinue}
          iconAfter={<ChevronRight strokeWidth={1.75} className="h-4 w-4" />}
        >
          Continue
        </Button>
      </div>
    </>
  );
}

function RoleRow({
  value,
  checked,
  onChange,
  label,
  description,
}: {
  readonly value: QuizRole;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly label: string;
  readonly description: string;
}) {
  return (
    <li className="border-b border-[var(--rule)]">
      <label
        className={`group -mx-3 grid cursor-pointer grid-cols-[auto_1fr] items-start gap-x-4 gap-y-1 px-3 py-4 transition-colors duration-150 ease-out ${
          checked ? "bg-[var(--clay-soft)]" : "hover:bg-[var(--paper-deep)]"
        }`}
      >
        <span className="relative mt-[3px] flex h-5 w-5 items-center justify-center">
          <input
            type="radio"
            name="role"
            value={value}
            checked={checked}
            onChange={onChange}
            className="peer absolute inset-0 cursor-pointer opacity-0"
          />
          <span
            aria-hidden="true"
            className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-150 ease-out ${
              checked
                ? "border-[var(--clay)] bg-[var(--clay)]"
                : "border-[var(--rule-strong)] bg-[var(--paper-inset)] group-hover:border-[var(--ink-3)]"
            } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]`}
          >
            {checked ? (
              <span className="h-2 w-2 rounded-full bg-[var(--paper)]" />
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
