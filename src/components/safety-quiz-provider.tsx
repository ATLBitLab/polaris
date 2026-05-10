"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  isAnswerKey,
  isQuestionKey,
  parseQuizInput,
  scoreQuiz,
  type QuizResult,
} from "@/lib/quiz-engine";
import {
  quizConfig,
  type AnswerKey,
  type QuestionKey,
} from "@/lib/quiz-config";

export type QuizSaveState = "idle" | "saving" | "saved" | "skipped";

type PartialAnswers = Partial<Record<QuestionKey, AnswerKey>>;

const answersStorageKey = "polaris.assess.answers.v1";

type SafetyQuizContextValue = {
  readonly answers: PartialAnswers;
  readonly result: QuizResult | null;
  readonly saveState: QuizSaveState;
  readonly setAnswer: (questionKey: QuestionKey, answerKey: AnswerKey) => void;
  readonly resetQuiz: () => void;
  readonly submitQuiz: () => Promise<QuizResult | null>;
};

const SafetyQuizContext = createContext<SafetyQuizContextValue | null>(null);

export function useSafetyQuiz(): SafetyQuizContextValue {
  const value = useContext(SafetyQuizContext);
  if (!value) {
    throw new Error("useSafetyQuiz must be used inside SafetyQuizProvider");
  }
  return value;
}

export function SafetyQuizProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saveState, setSaveState] = useState<QuizSaveState>("idle");

  useEffect(() => {
    const stored = window.localStorage.getItem(answersStorageKey);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      const restored: PartialAnswers = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (
          typeof key === "string" &&
          isQuestionKey(key) &&
          typeof value === "string" &&
          isAnswerKey(value)
        ) {
          restored[key] = value;
        }
      }
      // SSR-safe rehydration of saved answers; the empty initial state matches
      // the server render, then the effect updates once with the stored values.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(restored);
    } catch {
      window.localStorage.removeItem(answersStorageKey);
    }
  }, []);

  const persistAnswers = useCallback((next: PartialAnswers) => {
    if (Object.keys(next).length === 0) {
      window.localStorage.removeItem(answersStorageKey);
      return;
    }
    window.localStorage.setItem(answersStorageKey, JSON.stringify(next));
  }, []);

  const setAnswer = useCallback(
    (questionKey: QuestionKey, answerKey: AnswerKey) => {
      setAnswers((current) => {
        const next = { ...current, [questionKey]: answerKey };
        persistAnswers(next);
        return next;
      });
      setResult(null);
      setSaveState("idle");
    },
    [persistAnswers],
  );

  const resetQuiz = useCallback(() => {
    setAnswers({});
    setResult(null);
    setSaveState("idle");
    window.localStorage.removeItem(answersStorageKey);
  }, []);

  const submitQuiz = useCallback(async () => {
    const input = parseQuizInput({ answers });
    if (!input) {
      return null;
    }

    const nextResult = scoreQuiz(input);
    setResult(nextResult);
    setSaveState("saving");

    try {
      const response = await fetch("/api/quiz-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { saved?: boolean };
      setSaveState(response.ok && payload.saved ? "saved" : "skipped");
    } catch {
      setSaveState("skipped");
    }

    return nextResult;
  }, [answers]);

  const value = useMemo<SafetyQuizContextValue>(
    () => ({
      answers,
      result,
      saveState,
      setAnswer,
      resetQuiz,
      submitQuiz,
    }),
    [answers, result, saveState, setAnswer, resetQuiz, submitQuiz],
  );

  return (
    <SafetyQuizContext.Provider value={value}>
      {children}
    </SafetyQuizContext.Provider>
  );
}

export const totalQuestionCount = quizConfig.questions.length;
