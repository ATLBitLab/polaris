"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssessIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/assess/1");
  }, [router]);
  return (
    <p className="mt-12 text-[0.95rem] leading-relaxed text-[var(--ink-2)]">
      Loading the first question.
    </p>
  );
}
