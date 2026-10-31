import Image from "next/image";
import Link from "next/link";
import { Product, shortName, discountPercent } from "@/data/products";
import { formatINR } from "@/lib/format";

// "Course" / "Direct" comes straight from the product names on sabaland.in
export function variantOf(name: string): "Direct" | "Course" | null {
  const m = name.match(/\(\s*(Course|Direct)\s*\)/i);
  if (!m) return null;
  return m[1].toLowerCase() === "course" ? "Course" : "Direct";
}

export function packLabel(grams: number): string {
  return grams >= 500 ? `${grams / 1000} kg (${grams} g)` : `${grams} g`;
}

export default function ProductCard({ product }: { product: Product }) {
  const [first, second] = product.images;
  const discount = discountPercent(product);
  const saving = product.mrp - product.price;
  const href = `/products/${product.slug}`;
  const variant = variantOf(product.name);

  return (
    <article className="group relative flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300">
      {/* Badges */}
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

      {/* Media */}
      <Link
        href={href}
        aria-label={shortName(product)}
        className="relative my-2 block h-64 w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50"
      >
        <Image
          src={first}
          alt={shortName(product)}
          fill
          sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {second && (
          <Image
            src={second}
            alt=""
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-contain bg-gray-50 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </Link>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between space-y-3 pt-3">
        <div>
          <h3 className="line-clamp-2 min-h-[2.75rem] text-sm font-semibold leading-snug text-charcoal-900 transition-colors group-hover:text-honey-600 md:text-base">
            <Link href={href}>{shortName(product)}</Link>
          </h3>
          <div className="my-1.5 inline-block rounded-md border border-amber-200/50 bg-amber-50/80 px-2 py-0.5 text-xs font-medium text-amber-800">
            Pack Size: {packLabel(product.grams)}
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-charcoal-900">
              {formatINR(product.price, 2)}
            </span>
            <span className="text-xs text-charcoal-500 line-through">
              {formatINR(product.mrp, 2)}
            </span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
              Save {formatINR(saving)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-700">
            <span className="material-symbols-outlined text-[14px]">
              check_circle
            </span>
            <span>Free shipping across India</span>
          </div>

          {product.inStock ? (
            <Link
              href={href}
              className="block rounded-lg bg-honey-500 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-honey-600"
            >
              View product
            </Link>
          ) : (
            <span className="block rounded-lg border border-gray-200 bg-gray-50 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Sold out
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
