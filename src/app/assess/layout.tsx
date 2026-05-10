import { SafetyQuizProvider } from "@/components/safety-quiz-provider";
import {
  QuizColophon,
  QuizMasthead,
} from "@/components/safety-quiz-chrome";

export default function AssessLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <SafetyQuizProvider>
      <main className="mx-auto w-full max-w-[46rem] px-6 pt-10 pb-24 sm:px-10 sm:pt-14">
        <QuizMasthead />
        {children}
        <QuizColophon />
      </main>
    </SafetyQuizProvider>
  );
}
