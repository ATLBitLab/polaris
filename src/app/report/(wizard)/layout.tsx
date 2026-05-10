import {
  ReportIntro,
  ReportStatusBar,
} from "@/components/incident-report-chrome";

export default function ReportWizardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return (
    <>
      <ReportIntro />
      <ReportStatusBar />
      {children}
    </>
  );
}
