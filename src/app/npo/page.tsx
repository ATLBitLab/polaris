import type { Metadata } from "next";
import { Filter, LogOut, Search } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StarMark } from "@/components/incident-report-chrome";
import { Button } from "@/components/ui/button";
import {
  dangerLevelLabel,
  parseNpoDashboardFilters,
  type NpoDashboardFilters,
  type PrivateNpoIncident,
} from "@/lib/npo-dashboard";
import { loadPrivateNpoIncidents } from "@/lib/npo-store";
import { createClient } from "@/lib/supabase/server";
import { signOutNpo } from "./actions";

export const metadata: Metadata = {
  title: "NPO Dashboard · Polaris",
  description: "Private partner dashboard for blinded Polaris incidents.",
};

export const dynamic = "force-dynamic";

export default async function NpoDashboardPage({
  searchParams,
}: {
  readonly searchParams?: Promise<
    Record<string, string | readonly string[] | undefined>
  >;
}) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    redirect("/npo/login");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/npo/login");
  }

  const filters = parseNpoDashboardFilters((await searchParams) ?? {});
  const incidents = await loadPrivateNpoIncidents(filters);
  const email =
    typeof data.claims.email === "string" ? data.claims.email : "NPO user";

  return (
    <main className="mx-auto w-full max-w-[86rem] px-5 pt-8 pb-20 sm:px-8 sm:pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] pb-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-sm transition-opacity duration-150 ease-out hover:opacity-80"
        >
          <StarMark className="h-3.5 w-3.5 text-[var(--clay)]" />
          <span className="wordmark text-[0.78rem] text-[var(--ink)]">
            Polaris
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <p className="max-w-[16rem] truncate text-right text-[0.78rem] text-[var(--ink-3)]">
            {email}
          </p>
          <form action={signOutNpo}>
            <Button
              type="submit"
              variant="secondary"
              iconBefore={<LogOut className="h-4 w-4" />}
            >
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,24rem)]">
        <div>
          <p className="numeral text-[0.78rem] tracking-[0.18em] text-[var(--clay-deep)] uppercase">
            Partner dashboard
          </p>
          <h1 className="display mt-3 text-[2rem] leading-tight text-[var(--ink)] sm:text-[2.45rem]">
            Blinded shared incidents.
          </h1>
          <p className="mt-5 max-w-[70ch] text-[0.98rem] leading-[1.7] text-[var(--ink-2)]">
            This surface contains only incidents with partner-sharing consent
            and a completed blinding pass. Contact methods and raw report text
            are not shown.
          </p>
        </div>
        <div className="border-t border-[var(--rule-strong)] pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-7">
          <p className="text-[0.8rem] tracking-[0.14em] text-[var(--ink-3)] uppercase">
            Current view
          </p>
          <p className="mt-3 display text-[2.5rem] leading-none text-[var(--ink)]">
            {incidents.length}
          </p>
          <p className="mt-2 text-[0.86rem] leading-relaxed text-[var(--ink-3)]">
            Completed blinded records, capped at the 100 most relevant matches.
          </p>
        </div>
      </section>

      <FilterBar filters={filters} />

      <section className="mt-8">
        {incidents.length > 0 ? (
          <IncidentTable incidents={incidents} />
        ) : (
          <EmptyState />
        )}
      </section>
    </main>
  );
}

function FilterBar({ filters }: { readonly filters: NpoDashboardFilters }) {
  return (
    <form
      method="get"
      className="mt-10 border-y border-[var(--rule)] py-5"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]">
        <Field label="From">
          <input
            type="date"
            name="from"
            defaultValue={filters.dateFrom}
            className="h-10 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.88rem] outline-none focus:border-[var(--clay)]"
          />
        </Field>
        <Field label="To">
          <input
            type="date"
            name="to"
            defaultValue={filters.dateTo}
            className="h-10 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.88rem] outline-none focus:border-[var(--clay)]"
          />
        </Field>
        <Field label="Region">
          <input
            name="region"
            defaultValue={filters.region}
            placeholder="Region or place"
            className="h-10 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.88rem] outline-none placeholder:text-[var(--ink-3)] focus:border-[var(--clay)]"
          />
        </Field>
        <Field label="Danger">
          <select
            name="danger"
            defaultValue={filters.danger}
            className="select-native h-10 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.88rem] outline-none focus:border-[var(--clay)]"
          >
            <option value="">Any</option>
            <option value="immediate_attention_needed">Immediate</option>
            <option value="danger_expected_within_a_week">Within a week</option>
            <option value="not_immediate_danger">Not immediate</option>
            <option value="unknown">Unknown</option>
          </select>
        </Field>
        <Field label="Evidence">
          <select
            name="evidence"
            defaultValue={filters.evidence}
            className="select-native h-10 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.88rem] outline-none focus:border-[var(--clay)]"
          >
            <option value="">Any</option>
            <option value="yes">Present</option>
            <option value="no">Not noted</option>
          </select>
        </Field>
        <Field label="Physical">
          <select
            name="physical"
            defaultValue={filters.physical}
            className="select-native h-10 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.88rem] outline-none focus:border-[var(--clay)]"
          >
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </Field>
        <div className="flex items-end">
          <Button
            type="submit"
            className="h-10"
            iconBefore={<Filter className="h-4 w-4" />}
          >
            Filter
          </Button>
        </div>
      </div>
      <label className="mt-4 block">
        <span className="block text-[0.76rem] font-medium tracking-[0.12em] text-[var(--ink-3)] uppercase">
          Search blinded text
        </span>
        <span className="mt-2 grid h-10 grid-cols-[auto_1fr] items-center gap-2 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 focus-within:border-[var(--clay)]">
          <Search className="h-4 w-4 text-[var(--ink-3)]" aria-hidden="true" />
          <input
            name="q"
            defaultValue={filters.q}
            className="min-w-0 border-0 bg-transparent text-[0.9rem] outline-none"
          />
        </span>
      </label>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[0.76rem] font-medium tracking-[0.12em] text-[var(--ink-3)] uppercase">
        {label}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function IncidentTable({
  incidents,
}: {
  readonly incidents: readonly PrivateNpoIncident[];
}) {
  return (
    <div className="overflow-x-auto border-y border-[var(--rule)]">
      <table className="min-w-[72rem] border-collapse text-left">
        <thead>
          <tr className="border-b border-[var(--rule)] text-[0.72rem] tracking-[0.12em] text-[var(--ink-3)] uppercase">
            <th className="py-3 pr-4 font-medium">When</th>
            <th className="px-4 py-3 font-medium">Region</th>
            <th className="px-4 py-3 font-medium">Danger</th>
            <th className="px-4 py-3 font-medium">Evidence</th>
            <th className="px-4 py-3 font-medium">Physical</th>
            <th className="px-4 py-3 font-medium">Blinded account</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => (
            <tr
              key={incident.reportId}
              className="border-b border-[var(--rule)] align-top last:border-b-0"
            >
              <td className="w-[10rem] py-4 pr-4 text-[0.86rem] text-[var(--ink-2)]">
                {formatIncidentDate(incident.incidentOccurredAt)}
              </td>
              <td className="w-[13rem] px-4 py-4 text-[0.86rem] text-[var(--ink-2)]">
                <span className="block font-medium text-[var(--ink)]">
                  {incident.coarseRegion || "Unknown"}
                </span>
                <span className="mt-1 block text-[0.78rem] text-[var(--ink-3)]">
                  {incident.blindedLocationLabel || "No blinded location"}
                </span>
              </td>
              <td className="w-[10rem] px-4 py-4 text-[0.86rem] text-[var(--ink-2)]">
                {dangerLevelLabel(incident.dangerLevel)}
              </td>
              <td className="w-[8rem] px-4 py-4 text-[0.86rem] text-[var(--ink-2)]">
                {nullableBooleanLabel(incident.evidencePresent)}
              </td>
              <td className="w-[8rem] px-4 py-4 text-[0.86rem] text-[var(--ink-2)]">
                {nullableBooleanLabel(incident.physicalConfrontation)}
              </td>
              <td className="px-4 py-4">
                <details>
                  <summary className="cursor-pointer text-[0.92rem] font-medium text-[var(--ink)] underline decoration-[var(--rule-strong)] underline-offset-[5px]">
                    {preview(incident.blindedNarrative)}
                  </summary>
                  <div className="mt-4 max-w-[70ch] text-[0.9rem] leading-relaxed text-[var(--ink-2)]">
                    <p>{incident.blindedNarrative || "No narrative available."}</p>
                    {incident.blindedTranscript ? (
                      <>
                        <p className="mt-4 text-[0.76rem] tracking-[0.12em] text-[var(--ink-3)] uppercase">
                          Blinded transcript
                        </p>
                        <p className="mt-2">{incident.blindedTranscript}</p>
                      </>
                    ) : null}
                    {incident.blindedPeople.length > 0 ? (
                      <>
                        <p className="mt-4 text-[0.76rem] tracking-[0.12em] text-[var(--ink-3)] uppercase">
                          People
                        </p>
                        <ul className="mt-2 grid gap-2">
                          {incident.blindedPeople.map((person, index) => (
                            <li key={`${person.label}-${index}`}>
                              <span className="font-medium text-[var(--ink)]">
                                {person.label}
                              </span>
                              {person.role ? `, ${person.role}` : ""}:{" "}
                              {person.description}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <p className="mt-4 text-[0.78rem] text-[var(--ink-3)]">
                      Blinded {formatIncidentDate(incident.completedAt)} with{" "}
                      {incident.model || "configured model"}.
                    </p>
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-y border-[var(--rule)] py-10">
      <p className="display text-[1.45rem] leading-tight text-[var(--ink)]">
        No blinded shared incidents match this view.
      </p>
      <p className="mt-3 max-w-[58ch] text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
        Shared reports appear here only after the protected blinding job
        completes.
      </p>
    </div>
  );
}

function formatIncidentDate(value: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function nullableBooleanLabel(value: boolean | null): string {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Unknown";
}

function preview(value: string): string {
  if (!value.trim()) {
    return "Open details";
  }

  return value.length > 110 ? `${value.slice(0, 110).trim()}...` : value;
}
