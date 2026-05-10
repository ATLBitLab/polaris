import { ClipboardPenLine, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function PolarisHome() {
  return (
    <main className="mx-auto w-full max-w-[46rem] px-6 pt-10 pb-24 sm:px-10 sm:pt-14">
      <header className="flex items-center border-b border-[var(--rule)] pb-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm transition-opacity duration-150 ease-out hover:opacity-80"
        >
          <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
          <span className="wordmark text-[0.78rem] text-[var(--ink)]">
            Polaris
          </span>
        </Link>
      </header>

      <section className="mt-12">
        <h1 className="display max-w-[22ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
          Transnational repression, on the record.
        </h1>

        <p className="mt-8 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
          Polaris is designed for individuals from the Hong Kong, Tibetan,
          Uyghur, and mainland Chinese communities, as well as for allies in
          the United States who continue to experience the Chinese Communist
          Party&rsquo;s transnational repression.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/assess" className="button button-secondary">
            <span className="button-icon" aria-hidden="true">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span>Assess your risk</span>
          </Link>
          <Link href="/report" className="button button-primary">
            <span className="button-icon" aria-hidden="true">
              <ClipboardPenLine className="h-4 w-4" />
            </span>
            <span>Report an incident</span>
          </Link>
        </div>
      </section>

      <section className="mt-20 grid gap-10 border-t border-[var(--rule)] pt-8 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            I.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            Assess your risk
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            Ten short questions about your situation, asked one at a time,
            with a calm read of your exposure and a few practical steps to
            consider next.
          </p>
          <Link
            href="/assess"
            className="mt-4 inline-block text-[0.92rem] text-[var(--clay-deep)] underline decoration-[var(--rule-strong)] underline-offset-[6px] hover:text-[var(--clay)]"
          >
            Begin the assessment &rarr;
          </Link>
        </div>
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            II.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            Report an incident
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            A place to put down what happened: when, where, and what you
            remember, one section at a time. You decide whether to share
            contact details for follow-up.
          </p>
          <Link
            href="/report"
            className="mt-4 inline-block text-[0.92rem] text-[var(--clay-deep)] underline decoration-[var(--rule-strong)] underline-offset-[6px] hover:text-[var(--clay)]"
          >
            Start a report &rarr;
          </Link>
        </div>
        <div>
          <p className="numeral text-[0.86rem] text-[var(--clay-deep)]">
            III.
          </p>
          <h2 className="display mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
            See the public overview
          </h2>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
            An aggregate map and a few summary statistics drawn from
            community reports. No individual report or location is shown.
          </p>
          <Link
            href="/overview"
            className="mt-4 inline-block text-[0.92rem] text-[var(--clay-deep)] underline decoration-[var(--rule-strong)] underline-offset-[6px] hover:text-[var(--clay)]"
          >
            Open the overview &rarr;
          </Link>
        </div>
      </section>

      <section className="mt-20 border-t border-[var(--rule)] pt-8">
        <h2 className="display text-[1.6rem] leading-tight text-[var(--ink)] sm:text-[1.85rem]">
          What is Transnational Repression?
        </h2>
        <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
          When foreign governments seek to intimidate, silence, coerce,
          harass, or harm members of diaspora and exile communities, it is
          known as{" "}
          <a
            href="https://www.fbi.gov/investigate/counterintelligence/transnational-repression"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--rule-strong)] underline-offset-[4px] hover:text-[var(--ink)]"
          >
            transnational repression
          </a>
          .
        </p>
        <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-[1.75] text-[var(--ink-2)]">
          Transnational repression may take the following forms:
        </p>
        <ul className="mt-3 max-w-[62ch] list-disc space-y-1 pl-6 text-[1rem] leading-[1.75] text-[var(--ink-2)] marker:text-[var(--clay)]">
          <li>stalking</li>
          <li>online disinformation campaigns</li>
          <li>harassment</li>
          <li>intimidation or threats</li>
          <li>forcing or coercing the victim to return to their country of origin</li>
          <li>threatening or detaining family members or friends in the country of origin</li>
          <li>abusive legal practices (e.g., lawsuits, asset freezes, or withholding legal documents such as passports)</li>
          <li>cyberhacking</li>
          <li>assault</li>
          <li>attempted kidnapping</li>
          <li>attempted murder</li>
          <li>others</li>
        </ul>
      </section>
    </main>
  );
}

function StarMark({ className = "" }: { readonly className?: string }) {
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
