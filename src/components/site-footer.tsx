import Image from "next/image";

const FBI_SEAL =
  "https://upload.wikimedia.org/wikipedia/commons/d/da/Seal_of_the_Federal_Bureau_of_Investigation.svg";
const FREEDOM_HOUSE_LOGO =
  "https://freedomhouse.org/themes/custom/ts_freedomhouse/logo.svg";

const FBI_TRANSNATIONAL_REPRESSION =
  "https://www.fbi.gov/how-we-can-help-you/safety-resources/protect-yourself-from-transnational-repression";
const FREEDOM_HOUSE_TR_REPORT =
  "https://freedomhouse.org/report/transnational-repression";

/** Same outer box for every brand mark so link text lines up across rows. */
const LOGO_BOX =
  "relative h-10 w-10 shrink-0 overflow-hidden bg-[var(--paper)] ring-1 ring-[var(--rule)]";

export function SiteFooter() {
  return (
    <footer
      className="mt-auto border-t border-[var(--rule)] bg-[var(--paper-deep)]"
      role="contentinfo"
    >
      <div className="mx-auto w-full max-w-[46rem] px-6 py-8 sm:px-10 sm:py-9">
        <p className="text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
          <span className="font-medium text-[var(--ink)]">Polaris:</span>{" "}
          Guidance, protection, and impact minimization for diaspora communities
          in the United States facing transnational repression by the Chinese
          government.
        </p>

        <p className="mt-4 text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
          Maintained by Joey Siu.
        </p>

        <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--ink-2)]">
          This project was built in the context of a May 2026 hackathon in
          Nashville supported by the Human Rights Foundation.
        </p>

        <div className="mt-6 border-t border-[var(--rule)] pt-6">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.06em] text-[var(--ink-3)]">
            Learn more about transnational repression
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            <li>
              <a
                href={FBI_TRANSNATIONAL_REPRESSION}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-sm text-[0.8125rem] text-[var(--ink-2)] transition-colors duration-150 hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
              >
                <span className={`${LOGO_BOX} rounded-full`}>
                  <Image
                    src={FBI_SEAL}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-1.5"
                  />
                </span>
                <span className="min-w-0 leading-snug">
                  <span className="font-medium text-[var(--ink)]">FBI</span>
                  {" — "}
                  <span className="underline decoration-[var(--rule-strong)] underline-offset-2 group-hover:decoration-[var(--clay)]">
                    Transnational Repression
                  </span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={FREEDOM_HOUSE_TR_REPORT}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-sm text-[0.8125rem] text-[var(--ink-2)] transition-colors duration-150 hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
              >
                <span className={`${LOGO_BOX} rounded-md`}>
                  <Image
                    src={FREEDOM_HOUSE_LOGO}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-contain p-1.5"
                  />
                </span>
                <span className="min-w-0 leading-snug">
                  <span className="font-medium text-[var(--ink)]">
                    Freedom House
                  </span>
                  {" — "}
                  <span className="underline decoration-[var(--rule-strong)] underline-offset-2 group-hover:decoration-[var(--clay)]">
                    Transnational Repression Report
                  </span>
                </span>
              </a>
            </li>
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
