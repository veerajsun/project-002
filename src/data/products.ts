// SOURCE: https://sabaland.in/collections/all (4 products) - verified 23 Oct 2026.
// Names, prices (INR), MRPs and photo sets are copied from the live site.
// Not on the site, so NOT included: ratings, reviews, stock counts, batch codes.
// inStock: catalog page says "In stock (4)", but product pages also show a
// "Sold out" label - confirm in Shopify before launch.

export type Product = {
  slug: string; // our own URL slug (not from Shopify)
  name: string; // exact name on sabaland.in
  grams: number;
  price: number; // current selling price, INR
  mrp: number; // regular price, INR
  images: string[]; // files in /public/images/products (see download-images.ps1)
  sourceUrl: string; // live product page
  inStock: boolean;
};

export const products: Product[] = [
  {
    slug: "khalta-500g",
    name: "Khalta Yamani Honey 0.5 kg | For Man Power | khalta Honey ( Direct )",
    grams: 500,
    price: 2099,
    mrp: 2999,
    images: [
      "/images/products/khalta-500g-1.jpg",
      "/images/products/khalta-500g-2.jpg",
      "/images/products/khalta-500g-3.webp",
      "/images/products/khalta-500g-4.webp",
      "/images/products/khalta-500g-5.webp",
      "/images/products/khalta-500g-6.webp",
    ],
    sourceUrl: "https://sabaland.in/products/khaltahoney",
    inStock: true,
  },
  {
    slug: "khalta-1kg",
    name: "Khalta Yamani Honey 1 kg | For Man Power | khalta yamini Honey ( Direct )",
    grams: 1000,
    price: 3199,
    mrp: 5099,
    images: [
      "/images/products/khalta-1kg-1.png",
      "/images/products/khalta-1kg-2.jpg",
      "/images/products/khalta-1kg-3.webp",
      "/images/products/khalta-1kg-4.webp",
      "/images/products/khalta-1kg-5.webp",
    ],
    sourceUrl: "https://sabaland.in/products/khalta-yamani-honey",
    inStock: true,
  },
  {
    slug: "khalta-250g-course",
    name: "Khalta Yamani Honey 250 g | For Man Power | khalta yamini Honey (Course )",
    grams: 250,
    price: 1299,
    mrp: 1999,
    images: [
      "/images/products/khalta-250g-course-1.jpg",
      "/images/products/khalta-250g-course-2.jpg",
      "/images/products/khalta-250g-course-3.jpg",
    ],
    sourceUrl:
      "https://sabaland.in/products/khalta-yamani-honey-1-kg-for-man-power-khalta-yamini-honey-copy",
    inStock: true,
  },
  {
    slug: "khalta-250g-direct",
    // brand renamed Sabaland -> Sabland (display name)
    name: "Sabland Yamani Honey Khalta Direct 250gram | For Man Power | Khalta Honey ( Direct )",
    grams: 250,
    price: 1299,
    mrp: 1999,
    images: [
      "/images/products/khalta-250g-direct-1.jpg",
      "/images/products/khalta-250g-direct-2.jpg",
      "/images/products/khalta-500g-5.webp", // site reuses this same photo here
    ],
    sourceUrl:
      "https://sabaland.in/products/khalta-yamani-honey-0-5-kg-for-man-power-khalta-honey-copy",
    inStock: true,
  },
];

export function shortName(p: Product): string {
  return p.name.split("|")[0].trim();
}

export function discountPercent(p: Product): number {
  return Math.round((1 - p.price / p.mrp) * 100);
}

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
