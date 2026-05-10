"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";
import { Button } from "@/components/ui/button";
import { toRomanNumeral } from "@/components/safety-quiz-chrome";
import {
  totalQuestionCount,
  useSafetyQuiz,
} from "@/components/safety-quiz-provider";
import {
  quizConfig,
  type AnswerKey,
  type QuestionKey,
} from "@/lib/quiz-config";

export default function AssessQuestionPage({
  params,
}: {
  readonly params: Promise<{ readonly step: string }>;
}) {
  const { step } = use(params);
  const stepIndex = Number(step);
  const router = useRouter();
  const { answers, setAnswer, submitQuiz } = useSafetyQuiz();
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  if (
    !Number.isInteger(stepIndex) ||
    stepIndex < 1 ||
    stepIndex > totalQuestionCount
  ) {
    notFound();
  }

  const question = quizConfig.questions[stepIndex - 1];
  const isLast = stepIndex === totalQuestionCount;
  const previousHref = stepIndex > 1 ? `/assess/${stepIndex - 1}` : "/";
  const selectedAnswer = answers[question.key];

  function handleSelect(answerKey: AnswerKey) {
    setAnswer(question.key, answerKey);
    setValidationMessage(null);
  }

  async function handleContinue() {
    if (!selectedAnswer) {
      setValidationMessage("Pick an option to continue.");
      return;
    }

    if (!isLast) {
      router.push(`/assess/${stepIndex + 1}`);
      return;
    }

    setSubmitting(true);
    const result = await submitQuiz();
    setSubmitting(false);

    if (!result) {
      setValidationMessage(
        "Answer each question before seeing the plan. Use Back to fill in any missed prompts.",
      );
      return;
    }

    router.push("/assess/plan");
  }

  return (
    <>
      <p className="mt-10 text-[0.78rem] tracking-[0.16em] text-[var(--ink-3)] uppercase">
        Question {stepIndex} of {totalQuestionCount}
      </p>

      <Section
        index={stepIndex}
        heading={question.prompt}
        helper={question.helper}
      >
        <fieldset className="mt-5">
          <legend className="sr-only">{question.prompt}</legend>
          <ChoiceList>
            {question.answers.map((option) => (
              <ChoiceRow
                key={option.key}
                name={question.key}
                value={option.key}
                checked={selectedAnswer === option.key}
                onChange={() => handleSelect(option.key)}
                answerKey={option.key}
                label={option.label}
                description={option.description}
              />
            ))}
          </ChoiceList>
        </fieldset>
      </Section>

      {validationMessage ? (
        <p className="mt-8 max-w-[58ch] text-[0.9rem] leading-relaxed text-[var(--clay-deep)]">
          {validationMessage}
        </p>
      ) : null}

      <div className="mt-12 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--rule)] pt-6">
        <Link href={previousHref} className="button button-link">
          <span className="button-icon" aria-hidden="true">
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span>{stepIndex > 1 ? "Back" : "Home"}</span>
        </Link>
        <Button
          type="button"
          onClick={() => {
            void handleContinue();
          }}
          disabled={submitting}
          iconAfter={<ChevronRight strokeWidth={1.75} className="h-4 w-4" />}
        >
          {isLast ? (submitting ? "Scoring" : "See the plan") : "Continue"}
        </Button>
      </div>
    </>
  );
}

function Section({
  index,
  heading,
  helper,
  children,
}: {
  readonly index: number;
  readonly heading: string;
  readonly helper: string;
  readonly children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-baseline gap-4 border-t border-[var(--rule)] pt-7">
        <span className="numeral min-w-[2.5rem] text-[0.95rem] text-[var(--clay-deep)]">
          {toRomanNumeral(index)}.
        </span>
        <h2 className="display text-[1.5rem] leading-tight text-[var(--ink)]">
          {heading}
        </h2>
      </div>
      <p className="mt-2 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
        {helper}
      </p>
      {children}
    </section>
  );
}

function ChoiceList({ children }: { readonly children: React.ReactNode }) {
  return <ul className="border-t border-[var(--rule)]">{children}</ul>;
}

function ChoiceRow({
  name,
  value,
  checked,
  onChange,
  answerKey,
  label,
  description,
}: {
  readonly name: QuestionKey;
  readonly value: string;
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly answerKey: AnswerKey;
  readonly label: string;
  readonly description: string;
}) {
  return (
    <li className="border-b border-[var(--rule)]">
      <label
        className={`group -mx-3 grid cursor-pointer grid-cols-[auto_auto_1fr] items-start gap-x-4 gap-y-1 px-3 py-4 transition-colors duration-150 ease-out ${
          checked ? "bg-[var(--clay-soft)]" : "hover:bg-[var(--paper-deep)]"
        }`}
      >
        <span className="relative mt-[3px] flex h-5 w-5 items-center justify-center">
          <input
            type="radio"
            name={name}
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
        <span className="numeral mt-[1px] w-5 text-[0.95rem] text-[var(--clay-deep)]">
          {answerKey}.
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
