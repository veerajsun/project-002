"use client";

import { useEffect, useRef, useState } from "react";

// Shows /public/images/logo.jpg when it exists (see download-logo.ps1).
// If the file is missing, falls back to a text wordmark, so nothing breaks.
export default function BrandLogo({
  variant = "header",
}: {
  variant?: "header" | "footer";
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, []);

  const wordmark = (
    <span className="flex flex-col leading-none">
      <span
        className={`font-serif font-semibold uppercase tracking-wider text-charcoal-900 ${
          variant === "footer" ? "text-lg" : "text-xl"
        }`}
      >
        Sabland
      </span>
      {variant === "header" && (
        <span className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-honey-600">
          ROYAL YEMENY HONEY
        </span>
      )}
    </span>
  );

  if (failed) return wordmark;

  return (
    <span className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src="/images/logo.jpg"
        alt="Sabland Royal Yemeny Honey"
        onError={() => setFailed(true)}
        className={
          variant === "footer"
            ? "h-8 w-auto object-contain"
            : "h-10 w-auto object-contain"
        }
      />
      {variant === "footer" && (
        <span className="font-serif text-lg font-semibold uppercase text-charcoal-900">
          Sabland
        </span>
      )}
    </span>
  );
}
