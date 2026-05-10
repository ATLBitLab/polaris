"use client";

import { MailCheck, Send } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { requestNpoMagicLink } from "./actions";
import { initialNpoLoginState } from "./state";

export function NpoLoginForm() {
  const [state, formAction, pending] = useActionState(
    requestNpoMagicLink,
    initialNpoLoginState,
  );

  return (
    <form action={formAction} className="mt-8 max-w-[28rem]">
      <label className="block">
        <span className="block text-[0.86rem] font-medium text-[var(--ink)]">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-2 h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper-inset)] px-3 text-[0.95rem] text-[var(--ink)] outline-none transition-colors duration-150 ease-out hover:border-[var(--rule-strong)] focus:border-[var(--clay)]"
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          iconBefore={<Send className="h-4 w-4" />}
        >
          {pending ? "Sending" : "Send sign-in link"}
        </Button>
      </div>

      {state.message ? (
        <p
          className={`mt-5 max-w-[58ch] text-[0.92rem] leading-relaxed ${
            state.status === "error"
              ? "text-[var(--clay-deep)]"
              : "text-[var(--ink-2)]"
          }`}
        >
          {state.status === "sent" ? (
            <MailCheck
              className="mr-2 inline h-4 w-4 align-[-2px] text-[var(--clay)]"
              aria-hidden="true"
            />
          ) : null}
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
