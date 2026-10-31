import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StoreShell from "@/components/store/StoreShell";
import ProductCard, { packLabel, variantOf } from "@/components/store/ProductCard";
import ProductGallery from "@/components/store/product/ProductGallery";
import AddToCart from "@/components/store/product/AddToCart";
import HowToUse from "@/components/store/home/HowToUse";
import DeliverySection from "@/components/store/home/DeliverySection";
import { products, getProduct, shortName, discountPercent } from "@/data/products";
import { formatINR } from "@/lib/format";

// Only the 4 products in src/data/products.ts exist; any other slug shows the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "Product not found | Sabland Yemeny Honey" };
  return {
    title: `${shortName(product)} | Sabland Yemeny Honey`,
    description: `${shortName(product)} (${packLabel(product.grams)}). Free shipping across India. Cash on Delivery.`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const name = shortName(product);
  const variant = variantOf(product.name);
  const discount = discountPercent(product);
  const saving = product.mrp - product.price;
  const others = products.filter((p) => p.slug !== product.slug);

  const facts: { label: string; value: string }[] = [
    { label: "Product", value: product.name },
    { label: "Pack size", value: packLabel(product.grams) },
    { label: "Price", value: formatINR(product.price, 2) },
    { label: "Regular price (MRP)", value: formatINR(product.mrp, 2) },
    { label: "You save", value: `${formatINR(saving, 2)} (${discount}% off)` },
    { label: "Shipping", value: "Free across India" },
    { label: "Payment", value: "Cash on Delivery only" },
  ];

  return (
    <StoreShell>
      <main className="w-full bg-white">
        {/* Breadcrumb + top chips */}
        <section className="w-full border-b border-gray-100 bg-gray-50">
          <div className="mx-auto flex max-w-store flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-12">
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-2 text-xs uppercase tracking-wider text-charcoal-500"
            >
              <Link href="/" className="transition-colors hover:text-honey-600">
                Home
              </Link>
              <span className="material-symbols-outlined text-[14px] text-gray-400">
                chevron_right
              </span>
              <Link href="/#catalog" className="transition-colors hover:text-honey-600">
                Catalog
              </Link>
              <span className="material-symbols-outlined text-[14px] text-gray-400">
                chevron_right
              </span>
              <span className="truncate font-semibold text-charcoal-900">{name}</span>
            </nav>
            <div className="hidden items-center gap-6 text-[11px] font-semibold uppercase tracking-widest text-charcoal-500 md:flex">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-honey-600">lock</span>
                100% Discreet Packaging
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-honey-600">
                  local_shipping
                </span>
                Free Shipping Across India
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-honey-600">payments</span>
                Cash on Delivery
              </span>
            </div>
          </div>
        </section>

        {/* Gallery + purchase panel */}
        <section className="w-full bg-white py-10 lg:py-16">
          <div className="mx-auto max-w-store px-6 lg:px-12">
            <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-6">
                <ProductGallery
                  key={product.slug}
                  images={product.images}
                  name={name}
                  variant={variant}
                  discount={discount}
                />
              </div>

              <div className="flex flex-col gap-6 lg:col-span-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest">
                    <span className="text-honey-600">Sabland Royal Yemeny Honey</span>
                    {variant && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-honey-500" />
                        <span className="text-charcoal-500">{variant}</span>
                      </>
                    )}
                  </div>
                  <h1 className="font-serif text-3xl leading-tight tracking-tight text-charcoal-900 sm:text-4xl lg:text-5xl">
                    {name}
                  </h1>
                </div>

                {/* Price */}
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="font-serif text-3xl font-bold text-charcoal-900">
                      {formatINR(product.price, 2)}
                    </span>
                    <span className="text-base text-charcoal-500 line-through">
                      {formatINR(product.mrp, 2)}
                    </span>
                    <span className="rounded border border-honey-100 bg-honey-50 px-2.5 py-0.5 text-xs font-bold uppercase text-honey-700">
                      Save {formatINR(saving)} ({discount}% off)
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-charcoal-600">
                    <span className="material-symbols-outlined text-[16px] text-honey-600">
                      local_shipping
                    </span>
                    Free shipping across India. Pay by Cash on Delivery.
                  </p>
                </div>

                {/* Pack selection: links to each real product */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-widest text-charcoal-900">
                      Available packs
                    </span>
                    <span className="text-[11px] font-semibold uppercase text-honey-700">
                      Selected: {packLabel(product.grams)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {products.map((p) => {
                      const current = p.slug === product.slug;
                      return (
                        <Link
                          key={p.slug}
                          href={`/products/${p.slug}`}
                          aria-current={current ? "page" : undefined}
                          className={`rounded-lg border p-3.5 transition-colors ${
                            current
                              ? "border-honey-500 bg-honey-50/40 ring-2 ring-honey-500/30"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-charcoal-900">
                              {packLabel(p.grams)}
                            </span>
                            <span
                              className={`h-3.5 w-3.5 rounded-full border ${
                                current ? "border-honey-500 bg-honey-500" : "border-gray-300 bg-white"
                              }`}
                            />
                          </div>
                          <div className="mt-1 text-xs text-charcoal-500">
                            Khalta{variantOf(p.name) ? ` · ${variantOf(p.name)}` : ""}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-charcoal-900">
                            {formatINR(p.price)}
                          </div>
                          <div className="mt-0.5 text-[10px] font-semibold uppercase text-honey-700">
                            Save {formatINR(p.mrp - p.price)}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity + Add to Cart */}
                <AddToCart slug={product.slug} name={name} inStock={product.inStock} />

                <div className="flex flex-col items-start justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-[11px] font-semibold text-charcoal-600 sm:flex-row sm:items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-honey-600">
                      payments
                    </span>
                    Cash on Delivery only. Pay in cash when your order arrives.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-honey-600">
                      inventory_2
                    </span>
                    100% discreet packaging
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: "schedule", title: "3–7 Days", text: "Business days after dispatch" },
                    { icon: "local_shipping", title: "Free Shipping", text: "Across India" },
                    { icon: "payments", title: "Cash on Delivery", text: "Pay on arrival" },
                  ].map((t) => (
                    <div
                      key={t.title}
                      className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-3 text-center"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-honey-50 text-honey-600">
                        <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase text-charcoal-900">
                        {t.title}
                      </span>
                      <span className="text-[11px] leading-tight text-charcoal-500">{t.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product details */}
        <section className="w-full border-y border-gray-200/80 bg-gray-50 py-16">
          <div className="mx-auto grid max-w-store grid-cols-1 gap-10 px-6 lg:grid-cols-12 lg:gap-14 lg:px-12">
            <div className="space-y-4 lg:col-span-7">
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                Product details
              </span>
              <h2 className="font-serif text-3xl text-charcoal-900 sm:text-4xl">About this honey</h2>
              <p className="text-[15px] leading-relaxed text-charcoal-600">
                Khalta is a natural wellness formula crafted with traditional herbs
                and essential micronutrients.
              </p>
              <p className="text-[15px] leading-relaxed text-charcoal-600">
                Sabland brings Yemeni honey from the mountains and valleys of
                Yemen to homes across India. Every order is shipped with 100%
                discreet packaging.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-serif text-xl text-charcoal-900">At a glance</h3>
                <dl className="mt-4 divide-y divide-gray-100 text-sm">
                  {facts.map((f) => (
                    <div key={f.label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:justify-between sm:gap-4">
                      <dt className="text-charcoal-500">{f.label}</dt>
                      <dd className="font-semibold text-charcoal-900 sm:text-right">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* Existing homepage sections, reused as they are */}
        <HowToUse />
        <DeliverySection />

        {/* Other products */}
        <section className="w-full bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-store px-6 lg:px-12">
            <div className="space-y-2 border-b border-gray-100 pb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-honey-600">
                More from Sabland
              </span>
              <h2 className="font-serif text-3xl text-charcoal-900 sm:text-4xl">Other Khalta packs</h2>
            </div>
            <div className="grid grid-cols-1 gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </StoreShell>
  );
}
