import Link from "next/link";
import BrandLogo from "./BrandLogo";
import { products, shortName } from "@/data/products";
import { CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF } from "@/data/site";

const TRUST_LINKS = [
  { icon: "nature_people", label: "Honey heritage", href: "/#story" },
  { icon: "local_shipping", label: "Delivery information", href: "/#delivery" },
  { icon: "track_changes", label: "Track your order", href: "/track-order" },
];

const linkClass =
  "flex items-center gap-1.5 transition-colors hover:text-honey-600";

export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white text-charcoal-600">
      <div className="mx-auto max-w-store px-6 pb-10 pt-14 lg:px-12">
        <div className="grid grid-cols-1 gap-8 pb-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <BrandLogo variant="footer" />
            <p className="text-xs leading-relaxed text-charcoal-600">
              Premium Yemeni honey sourced from the finest apiaries. Pure,
              natural, and rich in flavor.
            </p>
            <div className="flex items-center gap-2.5 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <span className="material-symbols-outlined text-[22px] text-honey-600">
                local_shipping
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-charcoal-900">
                  Free shipping across India
                </div>
                <div className="text-[10px] text-charcoal-500">
                  Cash on Delivery only
                </div>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal-900">
              Shop
            </h4>
            <ul className="space-y-2 text-xs">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link href="/#catalog" className={linkClass}>
                    <span className="material-symbols-outlined text-[13px] text-honey-500">
                      arrow_right_alt
                    </span>
                    {shortName(p)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust & assurance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal-900">
              Trust &amp; Assurance
            </h4>
            <ul className="space-y-2 text-xs">
              {TRUST_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkClass}>
                    <span className="material-symbols-outlined text-[14px] text-honey-500">
                      {l.icon}
                    </span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer care */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-charcoal-900">
              Online Customer Care
            </h4>
            <div className="space-y-2.5 text-xs text-charcoal-600">
              <p className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-honey-600">
                  mail
                </span>
                <span>
                  Official Support:{" "}
                  <a
                    href="mailto:support@sabaland.in"
                    className="font-semibold text-charcoal-900 hover:text-honey-600"
                  >
                    support@sabaland.in
                  </a>
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-honey-600">
                  call
                </span>
                <span>
                  Phone:{" "}
                  <a
                    href={CONTACT_PHONE_HREF}
                    className="font-semibold text-charcoal-900 hover:text-honey-600"
                  >
                    {CONTACT_PHONE_DISPLAY}
                  </a>
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-honey-600">
                  payments
                </span>
                <span>Payment: Cash on Delivery only</span>
              </p>
              <div className="pt-2">
                <Link
                  href="/#support"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-charcoal-800 transition-colors hover:bg-gray-50"
                >
                  <span className="material-symbols-outlined text-[16px] text-honey-600">
                    support_agent
                  </span>
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 text-[11px] text-charcoal-500 md:flex-row">
          <p>© 2026 Sabland. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] uppercase tracking-wider">
            <span>Free Shipping</span>
            <span>•</span>
            <span>Cash on Delivery</span>
            <span>•</span>
            <span>Pan-India Courier</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
