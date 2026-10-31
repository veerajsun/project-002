"use client";

import { useState } from "react";
import { products } from "@/data/products";
import ProductCard, { variantOf } from "../ProductCard";

type Tab = "all" | "Direct" | "Course";

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "All Products" },
  { key: "Direct", label: "Direct" },
  { key: "Course", label: "Course" },
];

export default function CatalogSection() {
  const [tab, setTab] = useState<Tab>("all");

  const visible =
    tab === "all"
      ? products
      : products.filter((p) => variantOf(p.name) === tab);

  return (
    <section id="catalog" className="w-full scroll-mt-32 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-store px-6 lg:px-12">
        <div className="flex flex-col justify-between gap-6 border-b border-gray-100 pb-10 md:flex-row md:items-end">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-honey-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                Sabland Catalog
              </span>
            </div>
            <h2 className="font-serif text-3xl text-charcoal-900 sm:text-4xl">
              Sabland Khalta Catalog
            </h2>
            <p className="max-w-xl text-sm text-charcoal-600">
              Choose from our Khalta Yamani honey range. Free shipping across
              India, paid by Cash on Delivery.
            </p>
          </div>

          <div
            role="group"
            aria-label="Filter products"
            className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={tab === t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-md px-3.5 py-1.5 text-xs uppercase tracking-wider transition-colors ${
                  tab === t.key
                    ? "bg-white font-bold text-charcoal-900 shadow-sm"
                    : "text-charcoal-600 hover:text-charcoal-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
