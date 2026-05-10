import { IncidentReportProvider } from "@/components/incident-report-provider";
import { ReportMasthead } from "@/components/incident-report-chrome";

export default function ReportLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <IncidentReportProvider>
      <main className="mx-auto w-full max-w-[46rem] px-6 pt-10 pb-24 sm:px-10 sm:pt-14">
        <ReportMasthead />
        {children}
      </main>
    </IncidentReportProvider>
  );
}
