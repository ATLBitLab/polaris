"use client";

import { Mail, Phone } from "lucide-react";
import { useIncidentReport } from "@/components/incident-report-provider";
import {
  ReportProgress,
  ReportStepHeading,
  ReportStepNav,
} from "@/components/incident-report-chrome";

export default function ReportContactPage() {
  const { report, updateContact, updatePartnerSharing } = useIncidentReport();
  const draft = report?.draft;

  return (
    <section>
      <ReportProgress currentSlug="contact" />
      <ReportStepHeading
        slug="contact"
        helper="Choose whether someone may follow up. Methods stay limited to what you choose."
      />

      {draft ? (
        <>
          <fieldset className="mt-5">
            <legend className="sr-only">Follow-up contact consent</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <ConsentButton
                active={draft.contactConsent === true}
                onClick={() => updateContact(true)}
                label="Contact is allowed"
              />
              <ConsentButton
                active={draft.contactConsent === false}
                onClick={() => updateContact(false)}
                label="Do not contact me"
              />
            </div>
          </fieldset>
          {draft.contactConsent === true ? (
            <ContactMethodsEditor
              methods={draft.contactMethods}
              onChange={(methods) => updateContact(true, methods)}
            />
          ) : null}

          <div className="mt-10 border-t border-[var(--rule)] pt-7">
            <fieldset>
              <legend className="text-[0.86rem] font-medium text-[var(--ink)]">
                Researcher access
              </legend>
              <p className="mt-2 max-w-[62ch] text-[0.92rem] leading-relaxed text-[var(--ink-2)]">
                If you allow this, approved researchers may see a blinded
                version after names, contact clues, exact addresses, and unique
                identifying details are removed. Your contact methods are never
                shown there.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <ConsentButton
                  active={draft.partnerSharingConsent === true}
                  onClick={() => updatePartnerSharing(true)}
                  label="Share blinded report"
                />
                <ConsentButton
                  active={draft.partnerSharingConsent === false}
                  onClick={() => updatePartnerSharing(false)}
                  label="Do not share"
                />
              </div>
            </fieldset>
          </div>
        </>
      ) : (
        <p className="mt-6 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
          Starting a report.
        </p>
      )}

      <ReportStepNav currentSlug="contact" continueLabel="Submit report" />
    </section>
  );
}

function ConsentButton({
  active,
  onClick,
  label,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 rounded-md border px-4 text-left text-[0.95rem] transition-colors duration-150 ease-out ${
        active
          ? "border-[var(--clay)] bg-[var(--clay-soft)] text-[var(--clay-deep)]"
          : "border-[var(--rule)] bg-[var(--paper-inset)] text-[var(--ink-2)] hover:border-[var(--rule-strong)]"
      }`}
    >
      {label}
    </button>
  );
}

function ContactMethodsEditor({
  methods,
  onChange,
}: {
  readonly methods: readonly { readonly type: string; readonly value: string }[];
  readonly onChange: (
    methods: readonly { readonly type: string; readonly value: string }[],
  ) => void;
}) {
  const email = methods.find((method) => method.type === "email")?.value ?? "";
  const phone = methods.find((method) => method.type === "phone")?.value ?? "";

  function update(type: "email" | "phone", value: string) {
    const others = methods.filter((method) => method.type !== type);
    onChange(value.trim() ? [...others, { type, value }] : others);
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      <IconInput
        icon={<Mail className="h-4 w-4" aria-hidden="true" />}
        label="Email"
        value={email}
        onChange={(value) => update("email", value)}
        type="email"
        autoComplete="email"
        inputMode="email"
        name="email"
      />
      <IconInput
        icon={<Phone className="h-4 w-4" aria-hidden="true" />}
        label="Phone"
        value={phone}
        onChange={(value) => update("phone", value)}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        name="tel"
      />
    </div>
  );
}

function IconInput({
  icon,
  label,
  value,
  onChange,
  type,
  autoComplete,
  inputMode,
  name,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly type?: React.HTMLInputTypeAttribute;
  readonly autoComplete?: string;
  readonly inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  readonly name?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
        {label}
      </span>
      <span className="mt-2 grid h-12 grid-cols-[auto_1fr] items-center gap-3 rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 transition-colors duration-150 ease-out focus-within:border-[var(--clay)] hover:border-[var(--rule-strong)]">
        <span className="text-[var(--ink-3)]">{icon}</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          name={name}
          className="h-full min-w-0 border-0 bg-transparent outline-none"
        />
      </span>
    </label>
  );
}
