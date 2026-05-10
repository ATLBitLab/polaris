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
  type QuizAnswers,
  type QuizResult,
} from "@/lib/quiz-engine";
import {
  getQuestionsForRole,
  isQuizRole,
  type AnswerKey,
  type QuestionKey,
  type QuizRole,
} from "@/lib/quiz-config";

export type QuizSaveState = "idle" | "saving" | "saved" | "skipped";

const answersStorageKey = "polaris.assess.answers.v1";
const roleStorageKey = "polaris.assess.role.v1";

type SafetyQuizContextValue = {
  readonly role: QuizRole | null;
  readonly answers: QuizAnswers;
  readonly result: QuizResult | null;
  readonly saveState: QuizSaveState;
  readonly setRole: (role: QuizRole) => void;
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

export function useQuizQuestionCount(): number {
  const { role } = useSafetyQuiz();
  if (!role) {
    return 0;
  }
  return getQuestionsForRole(role).length;
}

export function SafetyQuizProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [role, setRoleState] = useState<QuizRole | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [saveState, setSaveState] = useState<QuizSaveState>("idle");

  useEffect(() => {
    const storedRole = window.localStorage.getItem(roleStorageKey);
    if (storedRole && isQuizRole(storedRole)) {
      // SSR-safe rehydration; matches empty initial state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRoleState(storedRole);
    }

    const stored = window.localStorage.getItem(answersStorageKey);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      const restored: QuizAnswers = {};
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
      setAnswers(restored);
    } catch {
      window.localStorage.removeItem(answersStorageKey);
    }
  }, []);

  const persistAnswers = useCallback((next: QuizAnswers) => {
    if (Object.keys(next).length === 0) {
      window.localStorage.removeItem(answersStorageKey);
      return;
    }
    window.localStorage.setItem(answersStorageKey, JSON.stringify(next));
  }, []);

  const setRole = useCallback((nextRole: QuizRole) => {
    setRoleState((current) => {
      if (current === nextRole) {
        return current;
      }
      setAnswers({});
      window.localStorage.removeItem(answersStorageKey);
      window.localStorage.setItem(roleStorageKey, nextRole);
      return nextRole;
    });
    setResult(null);
    setSaveState("idle");
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
    setRoleState(null);
    setAnswers({});
    setResult(null);
    setSaveState("idle");
    window.localStorage.removeItem(answersStorageKey);
    window.localStorage.removeItem(roleStorageKey);
  }, []);

  const submitQuiz = useCallback(async () => {
    if (!role) {
      return null;
    }

    const input = parseQuizInput({ role, answers });
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
  }, [role, answers]);

  const value = useMemo<SafetyQuizContextValue>(
    () => ({
      role,
      answers,
      result,
      saveState,
      setRole,
      setAnswer,
      resetQuiz,
      submitQuiz,
    }),
    [role, answers, result, saveState, setRole, setAnswer, resetQuiz, submitQuiz],
  );

  return (
    <SafetyQuizContext.Provider value={value}>
      {children}
    </SafetyQuizContext.Provider>
  );
}
