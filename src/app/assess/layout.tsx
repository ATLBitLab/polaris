import { SafetyQuizProvider } from "@/components/safety-quiz-provider";
import { QuizMasthead } from "@/components/safety-quiz-chrome";
import { SiteFooter } from "@/components/site-footer";

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
        <SiteFooter />
      </main>
    </SafetyQuizProvider>
  );
}
