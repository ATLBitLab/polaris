import type { Metadata } from "next";
import Link from "next/link";
import { StarMark } from "@/components/incident-report-chrome";
import { NpoLoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "NPO Access · Polaris",
  description: "Private Polaris access for approved NPO partners.",
};

export default function NpoLoginPage() {
  return (
    <main className="mx-auto w-full max-w-[44rem] px-6 pt-10 pb-24 sm:px-10 sm:pt-14">
      <header className="flex items-center justify-between border-b border-[var(--rule)] pb-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm transition-opacity duration-150 ease-out hover:opacity-80"
        >
          <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
          <span className="wordmark text-[0.78rem] text-[var(--ink)]">
            Polaris
          </span>
        </Link>
        <span className="wordmark text-[0.7rem] text-[var(--ink-3)]">
          NPO access
        </span>
      </header>

      <section className="mt-12">
        <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
          Private
        </p>
        <h1 className="display mt-3 max-w-[16ch] text-[2.25rem] leading-[1.1] text-[var(--ink)] sm:text-[2.75rem]">
          Partner sign-in.
        </h1>
        <p className="mt-7 max-w-[62ch] text-[1.02rem] leading-[1.75] text-[var(--ink-2)]">
          Approved NPO partners receive a one-time sign-in link by email.
          Access is limited to reports that were explicitly shared for partner
          review and have completed blinding.
        </p>

        <NpoLoginForm />
      </section>
    </main>
  );
}
