import Image from "next/image";
import Link from "next/link";

const FBI_SEAL =
  "https://upload.wikimedia.org/wikipedia/commons/d/da/Seal_of_the_Federal_Bureau_of_Investigation.svg";
const AMNESTY_MARK =
  "https://www.amnesty.org/en/wp-content/plugins/wp-plugin-amnesty-branding/assets/favicons/safari-pinned-tab.svg";
const FREEDOM_HOUSE_LOGO =
  "https://freedomhouse.org/themes/custom/ts_freedomhouse/logo.svg";

const FBI_TRANSNATIONAL_REPRESSION =
  "https://www.fbi.gov/how-we-can-help-you/safety-resources/protect-yourself-from-transnational-repression";
const AMNESTY_GOING_GLOBAL =
  "https://policehumanrightsresources.org/going-global-chinas-transnational-repression-of-protesters-worldwide";
const FREEDOM_HOUSE_TR_REPORT =
  "https://freedomhouse.org/report/transnational-repression";

/** Same outer box for every brand mark so link text lines up across rows. */
const LOGO_BOX =
  "relative h-10 w-10 shrink-0 overflow-hidden bg-[var(--paper)] ring-1 ring-[var(--rule)]";

const RESOURCE_LINKS = [
  {
    href: FBI_TRANSNATIONAL_REPRESSION,
    logoSrc: FBI_SEAL,
    logoBoxClass: `${LOGO_BOX} rounded-full`,
    org: "FBI",
    title: "Transnational Repression",
  },
  {
    href: AMNESTY_GOING_GLOBAL,
    logoSrc: AMNESTY_MARK,
    logoBoxClass: `${LOGO_BOX} rounded-md`,
    org: "Amnesty International",
    title:
      "Going Global: China's Transnational Repression of Protesters Worldwide",
  },
  {
    href: FREEDOM_HOUSE_TR_REPORT,
    logoSrc: FREEDOM_HOUSE_LOGO,
    logoBoxClass: `${LOGO_BOX} rounded-md`,
    org: "Freedom House",
    title: "Transnational Repression Report",
  },
] as const;

export function SiteFooter() {
  return (
    <footer
      className="mt-auto border-t border-[var(--rule)] bg-[var(--paper-deep)]"
      role="contentinfo"
    >
      <div className="mx-auto w-full max-w-[46rem] px-6 py-8 sm:px-10 sm:py-9">
        <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
          <span className="font-bold italic text-[var(--ink)]">Polaris</span>
          {": "}
          <span className="italic">
            Guidance, protection, and impact minimization for diaspora communities
            in the United States facing transnational repression by the Chinese
            government.
          </span>
        </p>

        <p className="mt-4 text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
          Built during AI Hack for Freedom in Nashville, TN, May 9–10, 2026,
          supported by{" "}
          <a
            href="https://hrf.org"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--rule-strong)] underline-offset-[4px] hover:text-[var(--ink)]"
          >
            the Human Rights Foundation
          </a>
          . Maintained by Hong Kong activist Joey Siu.
        </p>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[0.78rem] text-[var(--ink-3)]">
          <Link
            href="/research"
            className="underline decoration-[var(--rule-strong)] underline-offset-[4px] hover:text-[var(--ink-2)]"
          >
            Researcher access
          </Link>
        </div>

        <div className="mt-6 border-t border-[var(--rule)] pt-6">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.06em] text-[var(--ink-3)]">
            Learn more about transnational repression
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {RESOURCE_LINKS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-sm text-[0.8125rem] text-[var(--ink-2)] transition-colors duration-150 hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                >
                  <span className={item.logoBoxClass}>
                    <Image
                      src={item.logoSrc}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-contain p-1.5"
                    />
                  </span>
                  <span className="min-w-0 leading-snug">
                    <span className="font-medium text-[var(--ink)]">
                      {item.org}
                    </span>
                    {" — "}
                    <span className="underline decoration-[var(--rule-strong)] underline-offset-2 group-hover:decoration-[var(--clay)]">
                      {item.title}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 border-t border-[var(--rule)] pt-6 text-[0.75rem] leading-relaxed text-[var(--ink-3)]">
          <span className="font-medium text-[var(--ink-2)]">Privacy note:</span>{" "}
          Polaris is designed around data minimization. Reports should focus on
          incident context, not sensitive identity profiling. Public
          visualizations use aggregated data and privacy thresholds to reduce
          re-identification risk.
        </p>
      </div>
    </footer>
  );
}
