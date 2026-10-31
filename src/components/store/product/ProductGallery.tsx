"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  images,
  name,
  variant,
  discount,
}: {
  images: string[];
  name: string;
  variant: string | null;
  discount: number;
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-5">
      {/* Main frame */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-1.5">
          {variant && (
            <span className="rounded bg-charcoal-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm">
              {variant}
            </span>
          )}
          <span className="rounded border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-honey-700">
            {discount}% OFF
          </span>
        </div>
        <Image
          src={images[active]}
          alt={name}
          fill
          priority
          sizes="(min-width:1024px) 45vw, 100vw"
          className="object-contain p-6 lg:p-10"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-current={i === active ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded-lg border bg-gray-50 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-honey-500 ${
                i === active
                  ? "border-honey-500 ring-2 ring-honey-500/30"
                  : "border-gray-200 opacity-75 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="120px"
                className="object-contain p-2"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
