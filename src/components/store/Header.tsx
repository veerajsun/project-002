"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "./BrandLogo";
import { useCart } from "@/lib/cart";

const NAV = [
  { label: "Catalog", href: "/#catalog" },
  { label: "Honey Heritage", href: "/#story" },
  { label: "Delivery", href: "/#delivery" },
  { label: "Support", href: "/#support" },
  { label: "Track Order", href: "/track-order" },
];

const linkClass =
  "rounded-md px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-charcoal-700 transition-colors hover:bg-gray-50 hover:text-charcoal-900";

const mobileLinkClass =
  "block border-b border-gray-100 py-3.5 text-sm font-semibold uppercase tracking-wider text-charcoal-800";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();

  return (
    <div className="sticky top-0 z-50 flex flex-col bg-white">
      {/* Announcement bar */}
      <div className="border-b border-honey-100 bg-honey-50 px-4 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-honey-700">
        <div className="mx-auto flex max-w-store items-center justify-center gap-3">
          <span className="material-symbols-outlined text-[15px] text-honey-600">
            verified
          </span>
          <span>
            All-India Free Shipping
            <span className="mx-2 text-honey-500">|</span>
            Cash on Delivery
            <span className="hidden sm:inline">
              <span className="mx-2 text-honey-500">|</span>
              Discreet Packaging
            </span>
          </span>
          <span className="material-symbols-outlined text-[15px] text-honey-600">
            local_shipping
          </span>
        </div>
      </div>

      {/* Main header */}
      <header className="border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-store items-center justify-between gap-6 px-6 lg:px-12">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <BrandLogo variant="header" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1.5 xl:flex">
            {NAV.map((item) => (
              <Link key={item.label} href={item.href} className={linkClass}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2.5 lg:gap-3">
            <a
              href="mailto:support@sabaland.in"
              className="hidden items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold tracking-wide text-charcoal-700 transition-colors hover:border-gray-300 hover:bg-gray-50 sm:inline-flex"
            >
              <span className="material-symbols-outlined text-[16px] text-honey-600">
                mail
              </span>
              <span>support@sabaland.in</span>
            </a>

            <Link
              href="/cart"
              aria-label={
                count > 0 ? `Shopping bag, ${count} items` : "Shopping bag"
              }
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-charcoal-700 transition-colors hover:bg-gray-100 hover:text-charcoal-900"
            >
              <span className="material-symbols-outlined text-[22px]">
                shopping_bag
              </span>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-honey-500 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>

            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-700 transition-colors hover:bg-gray-100 xl:hidden"
            >
              <span className="material-symbols-outlined text-[24px]">
                {open ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <nav className="border-t border-gray-100 bg-white px-6 pb-5 pt-2 xl:hidden">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={mobileLinkClass}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="mailto:support@sabaland.in"
              className="mt-4 flex items-center gap-2 text-sm text-charcoal-600"
            >
              <span className="material-symbols-outlined text-[18px] text-honey-600">
                mail
              </span>
              support@sabaland.in
            </a>
          </nav>
        )}
      </header>
    </div>
  );
}
