import Image from "next/image";
import Link from "next/link";
import { products, shortName, discountPercent } from "@/data/products";
import { formatINR } from "@/lib/format";
import { packLabel, variantOf } from "../ProductCard";

const BADGES = [
  { icon: "local_shipping", title: "Free Shipping", text: "All-India Delivery" },
  { icon: "payments", title: "Cash on Delivery", text: "Pay on Doorstep Delivery" },
  { icon: "inventory_2", title: "Discreet Packaging", text: "Complete Privacy" },
];

export default function Hero() {
  const featured = products[0]; // first product listed on sabaland.in
  const variant = featured ? variantOf(featured.name) : null;

  return (
    <section className="relative w-full border-b border-gray-100 bg-white py-12 lg:py-20">
      <div className="relative z-10 mx-auto max-w-store px-6 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-honey-100 bg-honey-50 px-3 py-1 text-charcoal-700">
              <span className="h-2 w-2 rounded-full bg-honey-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                Official Sabland Store
              </span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-charcoal-600">Pan-India Delivery</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-honey-600">
                <span>Sabland Royal Yemeny Honey</span>
                <span className="inline-block h-px w-10 bg-honey-500/40" />
              </div>
              <h1 className="font-serif text-4xl leading-[1.12] tracking-tight text-charcoal-900 sm:text-5xl lg:text-6xl">
                Yemeni Honey –{" "}
                <span className="italic text-honey-600">Khalta</span>
              </h1>
              <p className="font-serif text-xl font-normal italic text-charcoal-700 sm:text-2xl">
                100% Natural Yemeni Honey
              </p>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-honey-100 bg-honey-50 text-honey-600">
                <span className="material-symbols-outlined text-[24px]">hive</span>
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-honey-600">
                  Our brand promise
                </div>
                <div className="mt-0.5 font-serif text-lg font-bold text-charcoal-900 sm:text-xl">
                  Premium Yemeni honey sourced from the finest apiaries.
                </div>
              </div>
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-charcoal-600">
              Sabland brings Yemeni honey from the mountains and valleys of
              Yemen to homes across India. Pure, natural, and rich in flavor.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 sm:gap-4">
              <Link
                href="/#catalog"
                className="flex items-center gap-2.5 rounded-lg bg-honey-500 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-honey-600"
              >
                <span>Order Khalta Now</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </Link>
              <Link
                href="/#how-to-use"
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-wider text-charcoal-800 transition-all hover:bg-gray-50"
              >
                <span className="material-symbols-outlined text-[20px] text-honey-600">
                  menu_book
                </span>
                <span>How to Use</span>
              </Link>
              <a
                href="mailto:support@sabaland.in"
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-5 py-3.5 text-sm font-medium text-charcoal-700 transition-all hover:bg-gray-100"
              >
                <span className="material-symbols-outlined text-[18px] text-honey-600">
                  mail
                </span>
                <span>support@sabaland.in</span>
              </a>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3 sm:gap-4">
              {BADGES.map((b) => (
                <div
                  key={b.title}
                  className="flex flex-col gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-3.5"
                >
                  <span className="material-symbols-outlined text-[22px] text-honey-600">
                    {b.icon}
                  </span>
                  <span className="text-sm font-bold text-charcoal-900">
                    {b.title}
                  </span>
                  <span className="text-xs text-charcoal-500">{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column: featured product card */}
          {featured && (
            <div className="relative flex items-center justify-center lg:col-span-5">
              <div className="flex w-full max-w-[460px] flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex w-full items-center justify-between border-b border-gray-100 pb-3">
                  <span className="rounded border border-honey-100 bg-honey-50 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest text-honey-700">
                    Featured
                  </span>
                  <span className="text-xs font-semibold text-charcoal-700">
                    {discountPercent(featured)}% OFF
                  </span>
                </div>

                <div className="group relative my-4 flex w-full justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50">
                    <Image
                      src={featured.images[0]}
                      alt={shortName(featured)}
                      fill
                      priority
                      sizes="(min-width:1024px) 40vw, 100vw"
                      className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-md border border-gray-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal-800 shadow-sm backdrop-blur-sm">
                    <span className="material-symbols-outlined text-[14px] text-honey-600">
                      inventory_2
                    </span>
                    Khalta{variant ? ` · ${variant}` : ""}
                  </div>
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-charcoal-900">
                        {shortName(featured)}
                      </h3>
                      <p className="text-xs text-charcoal-500">
                        Pack Size: {packLabel(featured.grams)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-charcoal-500 line-through">
                        {formatINR(featured.mrp)}
                      </span>
                      <span className="text-xl font-bold text-charcoal-900">
                        {formatINR(featured.price)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/products/${featured.slug}`}
                      className="w-full rounded-lg bg-honey-500 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-honey-600"
                    >
                      View Product
                    </Link>
                    <Link
                      href="/#catalog"
                      className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 bg-white py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-charcoal-800 transition-colors hover:bg-gray-50"
                    >
                      <span className="material-symbols-outlined text-[16px] text-honey-600">
                        shopping_bag
                      </span>
                      All Products
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
