import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgePercent, CheckCircle2, ExternalLink, Flame, ImagePlus, Lock, Menu, Pencil, Plus, RefreshCw, Search, ShieldCheck, ShoppingBag, Sparkles, Star, Trash2, TrendingUp, X } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdSenseAd from './AdSenseAd';
import { PrivacyPolicy, TermsOfService, AboutUs, ContactUs, CookiePolicy } from './LegalPages';
import { useMarket } from '../lib/useMarket';
import { getUsdToInrRate, displayPrice, symbolOf, type Market } from '../lib/currency';

// Note: there is intentionally no hardcoded owner password here.
// The real check happens server-side in the create-affiliate-product
// edge function, which validates against the OWNER_PASSWORD secret.
const categories = ['Home', 'Fashion', 'Beauty', 'Tech', 'Lifestyle'];
const boards = ['General', 'Deals', "Editor's Picks", 'Trending', 'New Arrivals'];
// Extra Amazon-style nav bar entries — filter by "board" instead of category.
const boardNavItems = boards.filter((b) => b !== 'General');

// URL <-> section mapping, so every nav tab is a real, shareable, bookmarkable
// URL (like Amazon's /gp/browse.html?node=...) instead of only changing state.
// Example: clicking "Fashion" pushes /category/fashion into the address bar.
const categorySlugs: Record<string, string> = { Fashion: 'fashion', Beauty: 'beauty', Tech: 'tech', Lifestyle: 'lifestyle' };
const slugToCategory: Record<string, string> = Object.fromEntries(Object.entries(categorySlugs).map(([name, slug]) => [slug, name]));
const boardSlugs: Record<string, string> = { Deals: 'deals', "Editor's Picks": 'editors-picks', Trending: 'trending', 'New Arrivals': 'new-arrivals' };
const slugToBoard: Record<string, string> = Object.fromEntries(Object.entries(boardSlugs).map(([name, slug]) => [slug, name]));

// Amazon-style mega menu: real sub-categories per top-level category, so
// people can jump straight to "T-Shirts" or "Laptops" instead of scrolling
// the whole category. Clicking a sub-category filters by that category and
// searches for the item name.
const megaMenu: Record<string, { heading: string; items: string[] }[]> = {
  Fashion: [
    { heading: 'Clothing', items: ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Jackets & Coats', 'Ethnic Wear', 'Innerwear'] },
    { heading: 'Shoes', items: ['Sneakers', 'Formal Shoes', 'Sandals & Floaters', 'Boots', 'Sports Shoes'] },
    { heading: 'Accessories', items: ['Belts', 'Wallets', 'Watches', 'Sunglasses', 'Bags'] },
  ],
  Beauty: [
    { heading: 'Makeup', items: ['Foundation', 'Lipstick', 'Mascara', 'Kajal', 'Compact'] },
    { heading: 'Skincare', items: ['Moisturizer', 'Sunscreen', 'Face Wash', 'Serum'] },
    { heading: 'Haircare', items: ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Serum'] },
  ],
  Tech: [
    { heading: 'Mobiles', items: ['Smartphones', 'Cases & Covers', 'Chargers', 'Power Banks'] },
    { heading: 'Computers', items: ['Laptops', 'Keyboards', 'Mouse', 'Monitors'] },
    { heading: 'Audio', items: ['Headphones', 'Earbuds', 'Speakers'] },
    { heading: 'Wearables', items: ['Smartwatches', 'Fitness Bands'] },
  ],
  Lifestyle: [
    { heading: 'Home', items: ['Home Decor', 'Kitchen', 'Bedding', 'Lighting'] },
    { heading: 'Fitness', items: ['Yoga Mats', 'Gym Gear', 'Water Bottles'] },
    { heading: 'Travel', items: ['Backpacks', 'Luggage', 'Travel Accessories'] },
  ],
};

function readSectionFromUrl(): { category: string; boardFilter: string | null; luxuryMode: boolean } {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/luxury') {
    return { category: 'Home', boardFilter: null, luxuryMode: true };
  }
  const categoryMatch = path.match(/^\/category\/([a-z0-9-]+)$/);
  if (categoryMatch && slugToCategory[categoryMatch[1]]) {
    return { category: slugToCategory[categoryMatch[1]], boardFilter: null, luxuryMode: false };
  }
  const boardMatch = path.match(/^\/board\/([a-z0-9-]+)$/);
  if (boardMatch && slugToBoard[boardMatch[1]]) {
    return { category: 'Home', boardFilter: slugToBoard[boardMatch[1]], luxuryMode: false };
  }
  return { category: 'Home', boardFilter: null, luxuryMode: false };
}
const products = [
  { id: 'p1', title: 'Puff-Sleeve Square Neck Party Skater Dress', category: 'Fashion', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop', rating: 4.5, reviews: 812, price: 899, originalPrice: 3899, affiliateLink: 'https://www.amazon.com/', badge: '77% OFF', market: 'IN' },
  { id: 'p2', title: 'LAKMÉ Eyeconic Bold Volumizing Mascara + Kajal Duo', category: 'Beauty', image: 'https://images.unsplash.com/photo-1631730359585-5e3c2a2a7c4b?w=600&h=600&fit=crop', rating: 4.3, reviews: 1204, price: 429, originalPrice: 999, affiliateLink: 'https://www.amazon.com/', badge: '57% OFF', market: 'IN' },
  { id: 'p3', title: 'High-Waist Drawstring Casual Shorts, Buttery Soft', category: 'Fashion', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=600&fit=crop', rating: 4.6, reviews: 530, price: 299, originalPrice: 799, affiliateLink: 'https://www.amazon.com/', badge: 'Bestseller', market: 'IN' },
  { id: 'p4', title: '3-in-1 Dewy Glow Foundation with Shea Butter & Hyaluronic Acid', category: 'Beauty', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=600&fit=crop', rating: 4.7, reviews: 2033, price: 549, originalPrice: 1299, affiliateLink: 'https://www.amazon.com/', badge: "Editor's Pick", market: 'IN' },
  { id: 'p5', title: 'Ruched Puff-Sleeve Maxi Dress, Elegant Evening Look', category: 'Fashion', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop', rating: 4.4, reviews: 344, price: 1199, originalPrice: 4999, affiliateLink: 'https://www.amazon.com/', badge: '77% OFF', market: 'IN' },
  { id: 'p6', title: 'Wireless Noise-Cancelling Over-Ear Headphones', category: 'Tech', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop', rating: 4.5, reviews: 5421, price: 3499, originalPrice: 5999, affiliateLink: 'https://www.amazon.com/', badge: 'Top Rated', market: 'IN' },
  { id: 'p7', title: 'Minimalist Ceramic Pour-Over Coffee Set', category: 'Home', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop', rating: 4.8, reviews: 289, price: 1450, originalPrice: 2200, affiliateLink: 'https://www.amazon.com/', badge: 'New', market: 'IN' },
  { id: 'p8', title: 'Smart LED Desk Lamp with Wireless Charging Base', category: 'Tech', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=600&fit=crop', rating: 4.2, reviews: 967, price: 1799, originalPrice: 2999, affiliateLink: 'https://www.amazon.com/', badge: 'Popular', market: 'IN' },
];

const emptyForm = {
  title: '',
  description: '',
  category: 'Fashion',
  board: 'General',
  tags: '',
  image: '',
  images: [] as string[],
  price: '',
  originalPrice: '',
  affiliateLink: '',
  badge: '',
  rating: '5',
  reviews: '0',
  publishLater: false,
  publishedAt: '',
  aiModified: false,
  market: 'IN',
  luxury: false,
};

function detectGroup(p: Record<string, unknown>): 'women' | 'men' | 'unisex' | null {
  const text = `${String(p.title ?? '')} ${Array.isArray(p.tags) ? (p.tags as string[]).join(' ') : ''}`.toLowerCase();
  if (/\b(women'?s?|girls?|her|ladies)\b/.test(text)) return 'women';
  if (/\b(men'?s?|boys?|him|gentlemen)\b/.test(text)) return 'men';
  if (/\b(unisex|kids?|children)\b/.test(text)) return 'unisex';
  return null;
}

function detectTechType(p: Record<string, unknown>): string | null {
  const text = `${String(p.title ?? '')} ${Array.isArray(p.tags) ? (p.tags as string[]).join(' ') : ''}`.toLowerCase();
  if (/\b(phone|smartphone|mobile)\b/.test(text)) return 'Smartphones';
  if (/\b(laptop|notebook)\b/.test(text)) return 'Laptops';
  if (/\b(headphone|earbud|earphone)\b/.test(text)) return 'Audio';
  if (/\b(watch|smartwatch)\b/.test(text)) return 'Wearables';
  return null;
}

function sectionsFor(items: Record<string, unknown>[]): { title: string; items: Record<string, unknown>[] }[] {
  const order: string[] = [];
  const map: Record<string, Record<string, unknown>[]> = {};
  const push = (title: string, item: Record<string, unknown>) => {
    if (!map[title]) { map[title] = []; order.push(title); }
    map[title].push(item);
  };

  items.forEach((item) => {
    const cat = String(item.category ?? '');
    if (cat === 'Fashion' || cat === 'Beauty') {
      const group = detectGroup(item);
      if (group === 'women') push(`Women's ${cat}`, item);
      else if (group === 'men') push(`Men's ${cat}`, item);
      else if (group === 'unisex') { push(`Women's ${cat}`, item); push(`Men's ${cat}`, item); }
      else push(cat, item);
    } else if (cat === 'Tech') {
      const type = detectTechType(item);
      push(type ?? 'Tech', item);
    } else {
      push(cat || 'More', item);
    }
  });

  return order.map((title) => ({ title, items: map[title] }));
}

function badgeStyle(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('deal') || t.includes('limited') || t.includes('sale') || t.includes('hot')) {
    return 'border-rose-200 bg-rose-50 text-rose-600';
  }
  if (t.includes('new')) {
    return 'border-sky-200 bg-sky-50 text-sky-600';
  }
  if (t.includes('best') || t.includes('top') || t.includes('editor')) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  if (t.includes('trend')) {
    return 'border-purple-200 bg-purple-50 text-purple-600';
  }
  return 'border-black/10 bg-black/[0.04] text-black/50';
}

function badgeOverlayStyle(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('deal') || t.includes('limited') || t.includes('sale') || t.includes('hot')) return 'bg-rose-600 text-white';
  if (t.includes('new')) return 'bg-sky-600 text-white';
  if (t.includes('best') || t.includes('top') || t.includes('editor')) return 'bg-amber-500 text-white';
  if (t.includes('trend')) return 'bg-purple-600 text-white';
  return 'bg-black/70 text-white';
}

function Rating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} size={14} className={index < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-black/55'} />
        ))}
      </div>
      <span className="text-xs text-black/40">{value}/5</span>
    </div>
  );
}

function RelatedProductCard({ product, onOpen, market, usdToInrRate }: { product: Record<string, unknown>; onOpen: (id: string) => void; market: Market; usdToInrRate: number }) {
  const discount = Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100);
  const productMarket: Market = String(product.market ?? 'IN') === 'US' ? 'US' : 'IN';
  const price = displayPrice(Number(product.price), productMarket, market, usdToInrRate);
  const originalPrice = displayPrice(Number(product.originalPrice), productMarket, market, usdToInrRate);
  return (
    <button
      type="button"
      onClick={() => onOpen(String(product.id))}
      className="glass-card liquid-glass group w-32 shrink-0 overflow-hidden text-left sm:w-36"
    >
      <div className="relative h-28 w-full overflow-hidden bg-white sm:h-32">
        <img src={String(product.image)} alt={String(product.title)} loading="lazy" className="h-full w-full bg-black/[0.03] object-contain" />
        {Number.isFinite(discount) && discount > 0 && (
          <span className="absolute left-1.5 top-1.5 rounded bg-rose-600 px-1 py-0.5 text-[9px] font-bold text-white">-{discount}%</span>
        )}
      </div>
      <div className="px-1.5 pb-2 pt-1.5">
        <p className="line-clamp-2 text-[11px] font-medium leading-tight text-[#111]">{String(product.title)}</p>
        {!Boolean(product.luxury) && (
          <div className="mt-1 flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} size={9} className={i < Math.round(Number(product.rating)) ? 'fill-amber-400 text-amber-400' : 'text-black/20'} />
            ))}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-baseline gap-1">
          <span className="text-xs font-semibold text-[#111]">{price.primary}</span>
          <span className="text-[10px] text-black/35 line-through">{originalPrice.primary}</span>
        </div>
      </div>
    </button>
  );
}

function parseInlineBold(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-black/80">{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function DescriptionBody({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        const isTable = lines.length >= 2 && lines[0].includes('|') && /^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?$/.test(lines[1]);
        if (isTable) {
          const parseCells = (line: string) => line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
          const headerCells = parseCells(lines[0]);
          const rows = lines.slice(2).map(parseCells);
          return (
            <div key={i} className="my-4 overflow-x-auto rounded-lg border border-black/10">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-black/[0.03]">
                    {headerCells.map((cell, ci) => (
                      <th key={ci} className="border-b border-black/10 px-3 py-2 text-left font-semibold text-black/70">{parseInlineBold(cell)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-black/[0.06] last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2 align-top text-black/60">{parseInlineBold(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (lines.length === 1 && lines[0].length < 60 && !lines[0].endsWith('.')) {
          return <h4 key={i} className="mt-5 text-sm font-semibold text-black/70">{parseInlineBold(lines[0])}</h4>;
        }
        return (
          <p key={i} className="mt-2 text-sm leading-relaxed text-black/40">
            {lines.map((line, li) => (
              <React.Fragment key={li}>
                {parseInlineBold(line)}
                {li < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function ProductDetailPage({ product, allProducts, onBack, onOpen, market, usdToInrRate }: { product: Record<string, unknown>; allProducts: Record<string, unknown>[]; onBack: () => void; onOpen: (id: string) => void; market: Market; usdToInrRate: number }) {
  useEffect(() => {
    const title = `${String(product.title)} — Curato.picks`;
    document.title = title;

    const description = String(product.description ?? '').trim() || `${String(product.title)} — handpicked pick on Curato.picks with real ratings and a live discount.`;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute('content') ?? '';
    descriptionTag?.setAttribute('content', description.slice(0, 160));

    const tagList = Array.isArray(product.tags) ? (product.tags as string[]) : [];
    const keywords = [...tagList, String(product.category ?? ''), String(product.title)].filter(Boolean).join(', ');
    const keywordsTag = document.querySelector('meta[name="keywords"]');
    const previousKeywords = keywordsTag?.getAttribute('content') ?? '';
    if (keywords) keywordsTag?.setAttribute('content', keywords);

    const ldScript = document.createElement('script');
    ldScript.type = 'application/ld+json';
    ldScript.id = 'product-jsonld';
    ldScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: String(product.title),
      image: [String(product.image)],
      description,
      keywords: tagList.join(', ') || undefined,
      offers: {
        '@type': 'Offer',
        price: Number(product.price),
        priceCurrency: String(product.market ?? 'IN') === 'US' ? 'USD' : 'INR',
        availability: 'https://schema.org/InStock',
        url: String(product.affiliateLink),
      },
      aggregateRating: !product.luxury && Number(product.reviews) > 0 ? {
        '@type': 'AggregateRating',
        ratingValue: Number(product.rating),
        reviewCount: Number(product.reviews),
      } : undefined,
    });
    document.head.appendChild(ldScript);

    return () => {
      document.title = 'Curato.picks — Handpicked Amazon Deals & Top Recommendations';
      descriptionTag?.setAttribute('content', previousDescription);
      keywordsTag?.setAttribute('content', previousKeywords);
      document.getElementById('product-jsonld')?.remove();
    };
  }, [product.id]);

  const discount = Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100);
  const currentTags = Array.isArray(product.tags) ? (product.tags as string[]).map((t) => t.toLowerCase().trim()) : [];
  const productMarket: Market = String(product.market ?? 'IN') === 'US' ? 'US' : 'IN';
  const price = displayPrice(Number(product.price), productMarket, market, usdToInrRate);
  const originalPrice = displayPrice(Number(product.originalPrice), productMarket, market, usdToInrRate);
  const galleryImages = [String(product.image), ...(Array.isArray(product.images) ? (product.images as string[]) : [])].filter(Boolean);
  const [activeImage, setActiveImage] = useState(galleryImages[0]);
  useEffect(() => { setActiveImage(galleryImages[0]); }, [product.id]);

  const detectGroup = (p: Record<string, unknown>): string | null => {
    const text = `${String(p.title ?? '')} ${Array.isArray(p.tags) ? (p.tags as string[]).join(' ') : ''}`.toLowerCase();
    if (/\b(women'?s?|girls?|her|ladies)\b/.test(text)) return 'women';
    if (/\b(men'?s?|boys?|him|gentlemen)\b/.test(text)) return 'men';
    if (/\b(unisex|kids?|children)\b/.test(text)) return 'unisex';
    return null;
  };
  const currentGroup = detectGroup(product);

  const related = allProducts
    .filter((p) => String(p.id) !== String(product.id) && p.category === product.category)
    .map((p) => {
      const pTags = Array.isArray(p.tags) ? (p.tags as string[]).map((t) => t.toLowerCase().trim()) : [];
      const sharedTags = currentTags.filter((t) => pTags.includes(t)).length;
      const sameGroup = currentGroup && detectGroup(p) === currentGroup ? 1 : 0;
      return { item: p, score: sameGroup * 100 + sharedTags };
    })
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-[#111] antialiased">
      <header className="sticky top-0 z-30 border-b border-black/[0.07] bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-xl border border-black/[0.07] bg-white px-3 py-2 text-xs font-medium text-black/55 transition hover:border-black/[0.15]">
            <ArrowLeft size={14} /> Back
          </button>
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500"><Sparkles size={14} className="text-slate-950" /></span>
            <span className="text-sm font-bold text-[#111]">Curato<span className="text-cyan-600">.picks</span></span>
          </span>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
            <img src={activeImage} alt={String(product.title)} className="h-72 w-full bg-black/[0.03] object-contain sm:h-96" />
            {galleryImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto border-t border-black/[0.06] p-3">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition ${activeImage === img ? 'border-cyan-600 ring-1 ring-cyan-600' : 'border-black/[0.08] opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            {product.badge ? <span className={`mb-3 inline-block rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${badgeStyle(String(product.badge))}`}>{String(product.badge)}</span> : null}
            <h1 className="mb-3 text-xl font-bold text-[#111] sm:text-2xl">{String(product.title)}</h1>
            <div className="mb-4 flex items-center gap-3">
              {!Boolean(product.luxury) && (
                <>
                  <Rating value={Number(product.rating)} />
                  <span className="text-xs text-black/40">{Number(product.reviews).toLocaleString()} reviews</span>
                </>
              )}
            </div>
            <div className="mb-1 flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-semibold text-[#111]">{price.primary}</span>
              <span className="text-sm text-black/40 line-through">{originalPrice.primary}</span>
              <span className="rounded bg-rose-600 px-1.5 py-0.5 text-sm font-bold text-white">-{discount}%</span>
            </div>
            {price.native && <p className="mb-5 text-xs text-black/35">≈ {price.native} — actual amount charged on Amazon</p>}
            {!price.native && <div className="mb-6" />}
            {/* Original Shop Now button — same tracking as the product card above,
                just larger for the detail page. */}
            <a
              href={String(product.affiliateLink)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => window.storage.logClick(String(product.id))}
              className="flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold tracking-wide text-white shadow-sm transition-colors hover:bg-cyan-700"
            >
              <ShoppingBag size={16} />Shop Now<ExternalLink size={14} />
            </a>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-black/40">
              <ShieldCheck size={13} className="text-emerald-600" /> Available on Amazon — you'll check out securely on their site
            </p>
            {product.description ? (
              <div className="mt-6">
                <DescriptionBody text={String(product.description)} />
              </div>
            ) : null}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-sm font-semibold text-[#111]">Related products</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {related.map((item) => (
                <RelatedProductCard key={String(item.id)} product={item} onOpen={onOpen} market={market} usdToInrRate={usdToInrRate} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCard({ product, canDelete, onDelete, onEdit, onOpen, deleting, withinBudget, market, usdToInrRate }: { product: Record<string, unknown>; canDelete: boolean; onDelete: (id: string) => void; onEdit: (product: Record<string, unknown>) => void; onOpen: (id: string) => void; deleting: boolean; withinBudget?: boolean; market: Market; usdToInrRate: number }) {
  const discount = Math.round(((Number(product.originalPrice) - Number(product.price)) / Number(product.originalPrice)) * 100);
  const productMarket: Market = String(product.market ?? 'IN') === 'US' ? 'US' : 'IN';
  const price = displayPrice(Number(product.price), productMarket, market, usdToInrRate);
  const originalPrice = displayPrice(Number(product.originalPrice), productMarket, market, usdToInrRate);
  return (
    <article className="group relative">
      <div className="glass-card liquid-glass relative flex h-full flex-col p-2.5 sm:p-4">
        <button type="button" onClick={() => onOpen(String(product.id))} className="relative mb-3 overflow-hidden rounded-xl bg-white/40 text-left sm:mb-4">
          <img src={String(product.image)} alt={String(product.title)} loading="lazy" className="h-28 w-full bg-black/[0.03] object-contain sm:h-52" />
          {withinBudget ? <span className="absolute left-2 top-2 rounded-full border border-emerald-600/20 bg-black/70 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-400 sm:px-2.5 sm:py-1 sm:text-[10px]">Within budget</span> : product.badge ? <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide sm:px-2.5 sm:py-1 sm:text-[10px] ${badgeOverlayStyle(String(product.badge))}`}>{String(product.badge)}</span> : null}
          {canDelete && (
            <div className="absolute right-2 top-2 flex gap-1.5">
              <span
                role="button"
                onClick={(event) => { event.stopPropagation(); onEdit(product); }}
                title="Edit this listing"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white transition hover:bg-black"
              >
                <Pencil size={13} />
              </span>
              <span
                role="button"
                onClick={(event) => { event.stopPropagation(); if (!deleting) onDelete(String(product.id)); }}
                title="Delete this listing"
                className={`flex h-7 w-7 items-center justify-center rounded-full border border-rose-400/30 bg-black/70 text-rose-300 transition hover:bg-rose-500 hover:text-white ${deleting ? 'opacity-50' : ''}`}
              >
                <Trash2 size={13} />
              </span>
            </div>
          )}
        </button>
        <button type="button" onClick={() => onOpen(String(product.id))} className="text-left">
          <h3 className="mb-1.5 line-clamp-2 min-h-[2rem] text-xs font-semibold text-[#111] sm:mb-2 sm:min-h-[2.6rem] sm:text-sm">{String(product.title)}</h3>
        </button>
        {!Boolean(product.luxury) && (
          <div className="mb-2 flex items-center justify-between sm:mb-3">
            <Rating value={Number(product.rating)} />
            <span className="hidden text-[11px] text-black/40 sm:inline">{Number(product.reviews).toLocaleString()} reviews</span>
          </div>
        )}
        <div className="mb-3 mt-auto flex flex-wrap items-baseline gap-1.5 sm:mb-4 sm:gap-2">
          <span className="text-sm font-semibold text-[#111] sm:text-lg">{price.primary}</span>
          <span className="text-[10px] text-black/35 line-through sm:text-xs">{originalPrice.primary}</span>
          <span className="rounded bg-rose-600 px-1 py-0.5 text-[10px] font-bold text-white sm:text-xs">-{discount}%</span>
        </div>
        {price.native && <p className="mb-2 -mt-2 text-[10px] text-black/35">≈ {price.native} charged on Amazon</p>}
        {/* Original Shop Now button — cyan/emerald gradient, wired to Supabase click
            tracking, Meta Pixel (via window.fbq, initialized by GTM), and server-side
            Conversions API (/api/capi) with a shared event ID for de-duplication. */}
        <a
          href={String(product.affiliateLink)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => window.storage.logClick(String(product.id))}
          className="flex items-center justify-center gap-1.5 rounded-full bg-cyan-600 px-3 py-2 text-xs font-semibold tracking-wide text-white shadow-sm transition-colors hover:bg-cyan-700 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
        >
          <ShoppingBag size={16} />Shop Now<ExternalLink size={14} />
        </a>
      </div>
    </article>
  );
}

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={close}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0a0b0d] p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-white"><Lock size={16} className="text-cyan-400" />{title}</h3>
          <button onClick={close} className="text-white/40 transition hover:text-white/70"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LuxuryPage({ items, market, usdToInrRate, onOpen, onBack }: { items: Record<string, unknown>[]; market: Market; usdToInrRate: number; onOpen: (id: string) => void; onBack: () => void }) {
  useEffect(() => {
    document.title = 'Luxury — Curato.picks';
    return () => {
      document.title = 'Curato.picks — Handpicked Amazon Deals & Top Recommendations';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f4f0] text-[#111] antialiased">
      <header className="sticky top-0 z-30 border-b border-black/[0.07] bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-black/50 transition hover:text-black">
            <ArrowLeft size={16} /> Back to store
          </button>
          <span className="font-semibold tracking-tight text-[#111]">Curato<span className="text-cyan-600">.picks</span></span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 via-[#fdf8ef] to-amber-50 px-6 py-10 text-center sm:py-14">
          <span className="eyebrow-label mx-auto flex w-fit items-center gap-1.5 !text-amber-700"><Sparkles size={12} /> Luxury</span>
          <h1 className="mt-4 text-3xl font-light tracking-tight text-[#111] sm:text-4xl">For those who don't settle — the finest picks, handpicked.</h1>
        </div>

        {items.length === 0 ? (
          <p className="mt-16 text-center text-sm text-black/40">No luxury picks yet — check back soon.</p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product) => (
              <ProductCard
                key={String(product.id)}
                product={product}
                canDelete={false}
                onDelete={() => {}}
                onEdit={() => {}}
                onOpen={onOpen}
                deleting={false}
                market={market}
                usdToInrRate={usdToInrRate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewArrivalsCarousel({ posted, market, usdToInrRate, onOpen }: { posted: Record<string, unknown>[]; market: Market; usdToInrRate: number; onOpen: (id: string) => void }) {
  const items = posted.filter((p) => String((p as Record<string, unknown>).market ?? 'IN') === market && (p as Record<string, unknown>).luxury !== true).slice(0, 12);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(0);
  }, [items.length, activeIndex]);

  if (items.length === 0) return null;

  const goTo = (i: number) => setActiveIndex(((i % items.length) + items.length) % items.length);

  return (
    <section
      className="mx-auto max-w-6xl border-t border-black/[0.06] px-4 py-16 sm:px-6 lg:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="eyebrow-label">New arrivals</span>
          <h2 className="mt-5 max-w-xl text-3xl font-light leading-[1.05] tracking-tight text-[#111] sm:text-4xl">Fresh off the dashboard, ready to shop.</h2>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white text-black/50 transition hover:border-black/20 hover:text-black">
            <ArrowLeft size={16} />
          </button>
          <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-white text-black/50 transition hover:border-black/20 hover:text-black">
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative mt-10 flex h-[300px] items-center justify-center overflow-hidden sm:h-[360px]">
        {items.map((p, i) => {
          let diff = i - activeIndex;
          const half = items.length / 2;
          if (diff > half) diff -= items.length;
          if (diff < -half) diff += items.length;
          const abs = Math.abs(diff);
          if (abs > 2) return null;

          const size = abs === 0 ? { w: 220, h: 300 } : abs === 1 ? { w: 160, h: 220 } : { w: 115, h: 165 };
          const translateX = diff === 0 ? 0 : (diff / abs) * (abs === 1 ? 150 : 250);
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.55 : 0.25;
          const zIndex = 30 - abs;
          const productMarket: Market = String((p as Record<string, unknown>).market ?? 'IN') === 'US' ? 'US' : 'IN';
          const price = displayPrice(Number(p.price), productMarket, market, usdToInrRate);

          return (
            <button
              key={String(p.id)}
              type="button"
              onClick={() => (diff === 0 ? onOpen(String(p.id)) : goTo(i))}
              className="absolute overflow-hidden rounded-[28px] border border-black/[0.07] bg-white shadow-lg transition-all duration-700 ease-out"
              style={{ width: size.w, height: size.h, transform: `translateX(${translateX}px)`, opacity, zIndex }}
            >
              <img src={String(p.image)} alt={String(p.title)} className="h-full w-full object-cover" />
              {diff === 0 && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-4 pt-14">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-white">{String(p.title)}</p>
                  <p className="mt-1.5 font-mono-brand text-xs text-emerald-300">{price.primary}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-6 bg-[#111]' : 'w-1.5 bg-black/15'}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function AffiliateShowcase() {
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set('q', query); else params.delete('q');
    const search = params.toString();
    window.history.replaceState({}, '', window.location.pathname + (search ? `?${search}` : ''));
  }, [query]);
  const [budget, setBudget] = useState('');
  const [category, setCategory] = useState(() => readSectionFromUrl().category);
  const [boardFilter, setBoardFilter] = useState<string | null>(() => readSectionFromUrl().boardFilter);
  const [luxuryMode, setLuxuryMode] = useState(() => readSectionFromUrl().luxuryMode);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const megaCloseTimer = useRef<number | null>(null);
  const [posted, setPosted] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [posting, setPosting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [visitStats, setVisitStats] = useState<{ count: number; countries: { country: string; count: number }[]; clicks: number; clicksByProduct: Record<string, number> } | null>(null);
  const { market, isAuto, setMarket } = useMarket();
  const [usdToInrRate, setUsdToInrRate] = useState(83);
  useEffect(() => {
    let active = true;
    getUsdToInrRate().then((rate) => { if (active) setUsdToInrRate(rate); });
    return () => { active = false; };
  }, []);
  const isAdminHost = window.location.hostname === 'admin.curatopicks.site';
  const [view, setView] = useState<'store' | 'admin'>(() =>
    isAdminHost || window.location.pathname.replace(/\/+$/, '') === '/admin' ? 'admin' : 'store'
  );
  const [adminIntent] = useState(() =>
    isAdminHost || window.location.pathname.replace(/\/+$/, '') === '/admin'
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(() => {
    const match = window.location.pathname.match(/^\/product\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  });

  useEffect(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(/^\/product\/(.+)$/);
      setSelectedProductId(match ? decodeURIComponent(match[1]) : null);
      const section = readSectionFromUrl();
      setCategory(section.category);
      setBoardFilter(section.boardFilter);
      setLuxuryMode(section.luxuryMode);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (selectedProductId) return; // product detail page manages its own SEO tags
    const categoryKeywords: Record<string, string> = {
      Fashion: "men's dress, women's dress, men's clothing, women's clothing, women's tops, men's shirts, jeans, dresses, ethnic wear, shoes",
      Beauty: 'skincare, makeup, beauty products, haircare, cosmetics, skincare routine',
      Tech: 'headphones, gadgets, electronics, smart devices, tech accessories',
      Lifestyle: 'home decor, kitchen appliances, furniture, lifestyle products',
    };
    const keywordsTag = document.querySelector('meta[name="keywords"]');
    const previousKeywords = keywordsTag?.getAttribute('content') ?? '';
    if (category !== 'Home' && categoryKeywords[category]) {
      keywordsTag?.setAttribute('content', categoryKeywords[category]);
      document.title = `${category} Deals — Curato.picks`;
    } else {
      document.title = 'Curato.picks — Handpicked Amazon Deals & Top Recommendations';
    }
    return () => {
      keywordsTag?.setAttribute('content', previousKeywords);
    };
  }, [category, selectedProductId]);

  const openProduct = (id: string) => {
    window.history.pushState({}, '', `/product/${encodeURIComponent(id)}`);
    setSelectedProductId(id);
    window.scrollTo(0, 0);
  };

  const closeProduct = () => {
    const url = luxuryMode
      ? '/luxury'
      : boardFilter
        ? `/board/${boardSlugs[boardFilter]}`
        : category !== 'Home'
          ? `/category/${categorySlugs[category]}`
          : '/';
    window.history.pushState({}, '', url);
    setSelectedProductId(null);
  };
  const fileRef = useRef<HTMLInputElement>(null);
  const [hideHeader, setHideHeader] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y <= 80) {
        setHideHeader(false);
      } else if (y > lastY) {
        setHideHeader(true);
      } else if (y < lastY) {
        setHideHeader(false);
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    window.storage.logVisit();
  }, []);

  useEffect(() => {
    let active = true;
    window.storage
      .listProducts()
      .then((items) => { if (active) setPosted(items.filter(Boolean)); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const marketItems = useMemo(
    () =>
      [...posted, ...products].filter(
        (product) => String((product as Record<string, unknown>).market ?? 'IN') === market && (product as Record<string, unknown>).luxury !== true,
      ),
    [posted, market],
  );

  const luxuryItems = useMemo(
    () =>
      [...posted, ...products].filter(
        (product) => String((product as Record<string, unknown>).market ?? 'IN') === market && (product as Record<string, unknown>).luxury === true,
      ),
    [posted, market],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = marketItems.filter((product) => {
      const matchesCategory = category === 'Home' || product.category === category;
      if (!matchesCategory) return false;
      if (boardFilter && String((product as Record<string, unknown>).board ?? 'General') !== boardFilter) return false;
      if (!q) return true;
      const title = String(product.title ?? '').toLowerCase();
      const desc = String(product.description ?? '').toLowerCase();
      const tags = Array.isArray(product.tags) ? product.tags.join(' ').toLowerCase() : '';
      const cat = String(product.category ?? '').toLowerCase();
      return title.includes(q) || desc.includes(q) || tags.includes(q) || cat.includes(q);
    });
    const max = Number(budget);
    if (budget.trim() && !Number.isNaN(max) && max > 0) {
      return [...list].sort((a, b) => {
        const aWithin = Number(a.price) <= max ? 0 : 1;
        const bWithin = Number(b.price) <= max ? 0 : 1;
        return aWithin - bWithin;
      });
    }
    return list;
  }, [marketItems, category, boardFilter, query, budget]);

  const heroStats = useMemo(() => {
    const all = marketItems;
    const withDiscount = all.filter((p) => Number(p.originalPrice) > 0 && Number(p.price) > 0);
    const avgDiscount = withDiscount.length
      ? Math.round(
          withDiscount.reduce((sum, p) => sum + ((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100, 0) /
            withDiscount.length,
        )
      : 0;
    return {
      liveDeals: all.length,
      avgDiscount,
      categoryCount: categories.length - 1,
    };
  }, [marketItems]);

  const categoryStats = useMemo(() => {
    const all = marketItems;
    const map: Record<string, { count: number; discountSum: number; discountN: number; image: string }> = {};
    for (const p of all) {
      const cat = String(p.category ?? '');
      if (!map[cat]) map[cat] = { count: 0, discountSum: 0, discountN: 0, image: String(p.image ?? '') };
      map[cat].count += 1;
      const orig = Number(p.originalPrice);
      const price = Number(p.price);
      if (orig > 0 && price > 0) {
        map[cat].discountSum += ((orig - price) / orig) * 100;
        map[cat].discountN += 1;
      }
    }
    return categories
      .filter((c) => c !== 'Home')
      .map((c) => ({
        name: c,
        count: map[c]?.count ?? 0,
        avgDiscount: map[c]?.discountN ? Math.round(map[c].discountSum / map[c].discountN) : 0,
        image: map[c]?.image ?? '',
      }));
  }, [marketItems]);

  const selectCategory = (item: string) => {
    setCategory(item);
    setBoardFilter(null);
    setLuxuryMode(false);
    window.history.pushState({}, '', item === 'Home' ? '/' : `/category/${categorySlugs[item]}`);
    setNavLoading(true);
    window.setTimeout(() => setNavLoading(false), 450);
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectBoard = (item: string) => {
    setLuxuryMode(false);
    setBoardFilter((current) => {
      const next = current === item ? null : item;
      window.history.pushState({}, '', next ? `/board/${boardSlugs[next]}` : '/');
      return next;
    });
    setNavLoading(true);
    window.setTimeout(() => setNavLoading(false), 450);
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  const enterLuxuryMode = () => {
    setLuxuryMode(true);
    setBoardFilter(null);
    setCategory('Home');
    window.history.pushState({}, '', '/luxury');
    window.scrollTo(0, 0);
  };

  const exitLuxuryMode = () => {
    setLuxuryMode(false);
    window.history.pushState({}, '', '/');
    window.scrollTo(0, 0);
  };

  const openMegaMenu = (item: string) => {
    if (megaCloseTimer.current) window.clearTimeout(megaCloseTimer.current);
    setMegaOpen(item);
  };

  const scheduleCloseMegaMenu = () => {
    if (megaCloseTimer.current) window.clearTimeout(megaCloseTimer.current);
    megaCloseTimer.current = window.setTimeout(() => setMegaOpen(null), 200);
  };

  const selectSubcategory = (cat: string, sub: string) => {
    selectCategory(cat);
    setQuery(sub);
    setMegaOpen(null);
    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
  };

  const update = (key: string, value: string | boolean | string[]) => setForm((current) => ({ ...current, [key]: value }));
  const updateExtraImage = (index: number, url: string) =>
    setForm((current) => ({ ...current, images: current.images.map((img, i) => (i === index ? url : img)) }));
  const addExtraImage = () => setForm((current) => ({ ...current, images: [...current.images, ''] }));
  const removeExtraImage = (index: number) =>
    setForm((current) => ({ ...current, images: current.images.filter((_, i) => i !== index) }));

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!passcode.trim()) {
      setError('Enter your owner passcode.');
      return;
    }
    // The passcode is only trusted once the server confirms it — this
    // request is what actually validates it (create/edit/delete requests
    // are also re-checked server-side independently, but the dashboard
    // itself should never open on an unverified guess).
    setUnlocking(true);
    setError('');
    try {
      const stats = await window.storage.getVisitStats(passcode);
      setVisitStats(stats);
      setUnlocked(true);
      setUnlockOpen(false);
      if (!adminIntent) setPostOpen(true);
      try { localStorage.setItem('curato-owner-verified', '1'); } catch { /* ignore */ }
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        setError('Incorrect owner passcode. Please try again.');
      } else if (message.includes('429')) {
        setError('Too many attempts. Please wait a bit and try again.');
      } else {
        setError("Couldn't verify passcode. Please try again.");
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!passcode.trim()) {
      setError('Enter your owner passcode above before uploading an image.');
      return;
    }
    setUploadingImage(true);
    setError('');
    try {
      const url = await window.storage.uploadImage(file, passcode);
      update('image', url);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        setError('Incorrect owner passcode. Please try again.');
      } else {
        setError("Couldn't upload image. Please try again.");
      }
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const extraFileRef = useRef<HTMLInputElement>(null);
  const [extraUploadIndex, setExtraUploadIndex] = useState<number | null>(null);
  const [uploadingExtraIndex, setUploadingExtraIndex] = useState<number | null>(null);

  const handleExtraFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const index = extraUploadIndex;
    if (!file || index === null) return;
    if (!passcode.trim()) {
      setError('Enter your owner passcode above before uploading an image.');
      return;
    }
    setUploadingExtraIndex(index);
    setError('');
    try {
      const url = await window.storage.uploadImage(file, passcode);
      updateExtraImage(index, url);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401') || message.includes('Unauthorized')) {
        setError('Incorrect owner passcode. Please try again.');
      } else {
        setError("Couldn't upload image. Please try again.");
      }
    } finally {
      setUploadingExtraIndex(null);
      setExtraUploadIndex(null);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const price = Number(form.price);
    const originalPrice = Number(form.originalPrice);
    if (!form.title.trim() || !form.image.trim() || !form.affiliateLink.trim() || !price || !originalPrice) return setError('Please complete every required field.');
    if (!/^https?:\/\//i.test(form.affiliateLink)) return setError('Affiliate link must start with http:// or https://');
    if (form.publishLater && form.publishedAt && new Date(form.publishedAt).toString() === 'Invalid Date') return setError('Pick a valid date and time.');
    const rating = Number(form.rating);
    const reviews = Number(form.reviews);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) return setError('Rating must be between 0 and 5.');
    if (!Number.isFinite(reviews) || reviews < 0) return setError('Review count must be 0 or more.');

    const payload = {
      password: passcode,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      board: form.board,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      image: form.image.trim(),
      images: form.images.map((img) => img.trim()).filter((img) => /^https?:\/\//i.test(img)),
      price,
      originalPrice,
      affiliateLink: form.affiliateLink.trim(),
      badge: form.badge.trim() || null,
      rating,
      reviews,
      publishLater: form.publishLater,
      publishedAt: form.publishLater && form.publishedAt ? new Date(form.publishedAt).toISOString() : null,
      aiModified: form.aiModified,
      market: form.market === 'US' ? 'US' : 'IN',
      luxury: form.luxury,
    };

    setPosting(true);
    try {
      if (editingId) {
        const saved = await window.storage.updateProduct(editingId, payload);
        setPosted((items) => items.map((item) => (item.id === editingId ? saved : item)));
      } else {
        const saved = await window.storage.createProduct(payload);
        setPosted((items) => [saved, ...items]);
      }
      setForm(emptyForm);
      setPostOpen(false);
      setEditingId(null);
      setError('');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401')) {
        setError('Incorrect owner passcode. Please try again.');
        setUnlocked(false);
      } else {
        setError("Couldn't save this product. Please try again.");
      }
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = (product: Record<string, unknown>) => {
    if (!unlocked) {
      setUnlockOpen(true);
      return;
    }
    setForm({
      title: String(product.title ?? ''),
      description: String(product.description ?? ''),
      category: String(product.category ?? 'Fashion'),
      board: String(product.board ?? 'General'),
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
      image: String(product.image ?? ''),
      images: Array.isArray(product.images) ? (product.images as string[]) : [],
      price: String(product.price ?? ''),
      originalPrice: String(product.originalPrice ?? ''),
      affiliateLink: String(product.affiliateLink ?? ''),
      badge: String(product.badge ?? ''),
      rating: String(product.rating ?? '5'),
      reviews: String(product.reviews ?? '0'),
      publishLater: Boolean(product.publishLater),
      publishedAt: product.publishedAt ? String(product.publishedAt).slice(0, 16) : '',
      aiModified: Boolean(product.aiModified),
      market: String(product.market ?? 'IN') === 'US' ? 'US' : 'IN',
      luxury: Boolean(product.luxury),
    });
    setEditingId(String(product.id));
    setPostOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!unlocked) {
      setUnlockOpen(true);
      return;
    }
    if (!window.confirm('Delete this product listing? This cannot be undone.')) return;

    setDeletingId(id);
    try {
      await window.storage.deleteProduct(id, passcode);
      setPosted((items) => items.filter((item) => item.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401')) {
        setUnlocked(false);
        alert('Your owner session expired. Please unlock again and retry the delete.');
      } else {
        alert("Couldn't delete this product. Please try again.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const postModal = postOpen && unlocked && (
    <Modal title={editingId ? 'Edit product' : 'Post a product'} close={() => { setPostOpen(false); setEditingId(null); setForm(emptyForm); }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImage} className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-black/[0.07] bg-white py-6 text-black/40 transition hover:border-black/[0.15] hover:text-black disabled:opacity-60">
          {uploadingImage ? (
            <span className="text-xs">Uploading…</span>
          ) : form.image ? (
            <img src={form.image} alt="Preview" className="max-h-32 rounded-lg object-cover" />
          ) : (
            <>
              <ImagePlus size={22} />
              <span className="text-xs">Upload media</span>
            </>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        <Field label="Title">
          <input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Add a title" className={inputClass} />
        </Field>

        <Field label="Description">
          <textarea value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="Write a description" rows={3} className={`${inputClass} resize-none`} />
        </Field>

        <Field label="Image URL">
          <input value={form.image} onChange={(event) => update('image', event.target.value)} placeholder="https://…" className={inputClass} />
        </Field>

        <Field label="Additional images (optional)">
          <div className="space-y-2">
            {form.images.map((img, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={img}
                  onChange={(event) => updateExtraImage(i, event.target.value)}
                  placeholder="https://…"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => { setExtraUploadIndex(i); extraFileRef.current?.click(); }}
                  disabled={uploadingExtraIndex === i}
                  title="Upload from device"
                  className="shrink-0 rounded-xl border border-black/[0.07] bg-white p-2.5 text-black/50 transition hover:border-black/[0.15] hover:text-black disabled:opacity-60"
                >
                  <ImagePlus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => removeExtraImage(i)}
                  title="Remove"
                  className="shrink-0 rounded-xl border border-black/[0.07] bg-white p-2.5 text-black/50 transition hover:border-rose-300 hover:text-rose-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            {form.images.length < 6 && (
              <button
                type="button"
                onClick={addExtraImage}
                className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/20 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/60 transition hover:border-white/35 hover:text-white/90"
              >
                <Plus size={13} /> Add another image
              </button>
            )}
          </div>
        </Field>
        <input ref={extraFileRef} type="file" accept="image/*" onChange={handleExtraFile} className="hidden" />

        <Field label="Affiliate link">
          <input value={form.affiliateLink} onChange={(event) => update('affiliateLink', event.target.value)} placeholder="https://www.amazon.com/…" className={inputClass} />
        </Field>

        <Field label="Market">
          <select value={form.market} onChange={(event) => update('market', event.target.value)} className={inputClass}>
            <option value="IN">🇮🇳 India (amazon.in, ₹)</option>
            <option value="US">🇺🇸 United States (amazon.com, $)</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Price (${form.market === 'US' ? '$' : '₹'})`}>
            <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => update('price', event.target.value)} placeholder="899" className={inputClass} />
          </Field>
          <Field label={`Original price (${form.market === 'US' ? '$' : '₹'})`}>
            <input type="number" min="0" step="0.01" value={form.originalPrice} onChange={(event) => update('originalPrice', event.target.value)} placeholder="1999" className={inputClass} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select value={form.category} onChange={(event) => update('category', event.target.value)} className={inputClass}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Board">
            <select value={form.board} onChange={(event) => update('board', event.target.value)} className={inputClass}>
              {boards.map((item) => <option key={item}>{item}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Tags (comma separated)">
          <input value={form.tags} onChange={(event) => update('tags', event.target.value)} placeholder="summer, trending" className={inputClass} />
        </Field>

        <Field label="Badge (optional)">
          <input value={form.badge} onChange={(event) => update('badge', event.target.value)} placeholder="e.g. New" className={inputClass} />
          <p className="mt-1.5 text-[11px] text-white/35">Auto-colored by keyword: "Deal/Limited/Sale" → red, "New" → blue, "Best/Top/Editor" → amber, "Trending" → purple.</p>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Rating (0–5, your real rating)">
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => update('rating', event.target.value)} placeholder="4.5" className={inputClass} />
          </Field>
          <Field label="Number of reviews">
            <input type="number" min="0" value={form.reviews} onChange={(event) => update('reviews', event.target.value)} placeholder="0" className={inputClass} />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-xs text-white/50">
          <input type="checkbox" checked={form.publishLater} onChange={(event) => update('publishLater', event.target.checked)} className="h-3.5 w-3.5 rounded border-black/20 bg-white" />
          Schedule for later
        </label>
        {form.publishLater && (
          <Field label="Publish date & time">
            <input type="datetime-local" value={form.publishedAt} onChange={(event) => update('publishedAt', event.target.value)} className={inputClass} />
          </Field>
        )}

        <label className="flex items-center gap-2 text-xs text-white/50">
          <input type="checkbox" checked={form.aiModified} onChange={(event) => update('aiModified', event.target.checked)} className="h-3.5 w-3.5 rounded border-black/20 bg-white" />
          Disclose AI-modified content
        </label>

        <label className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-xs text-amber-300">
          <input type="checkbox" checked={form.luxury} onChange={(event) => update('luxury', event.target.checked)} className="h-3.5 w-3.5 rounded border-amber-500/40 bg-white" />
          ✨ Luxury product — only shows in the Luxury section, hidden from normal browsing/search/categories
        </label>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button disabled={posting} className="liquid-btn flex w-full items-center justify-center gap-2 py-2.5 text-sm font-semibold tracking-wide text-[#111] disabled:cursor-not-allowed disabled:opacity-60">
          <Plus size={15} />{posting ? (editingId ? 'Saving…' : 'Posting…') : (editingId ? 'Save changes' : 'Post product')}
        </button>
      </form>
    </Modal>
  );

  const modals = (
    <>
      {unlockOpen && (
        <Modal title="Owner sign-in" close={() => setUnlockOpen(false)}>
          <p className="mb-4 text-xs text-white/50">Enter the owner passcode to post a new product. Posting is restricted to the site owner only.</p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input autoFocus type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} placeholder="Passcode" className="w-full rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-black/25 transition-colors" />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button disabled={unlocking} className="liquid-btn w-full justify-center py-2.5 text-sm font-semibold tracking-wide text-[#111] disabled:cursor-not-allowed disabled:opacity-60">{unlocking ? 'Verifying…' : 'Unlock'}</button>
          </form>
        </Modal>
      )}
      {postModal}
    </>
  );

  const pathname = window.location.pathname.replace(/\/+$/, '');
  if (pathname === '/privacy') return <PrivacyPolicy />;
  if (pathname === '/terms') return <TermsOfService />;
  if (pathname === '/about') return <AboutUs />;
  if (pathname === '/contact') return <ContactUs />;
  if (pathname === '/cookies') return <CookiePolicy />;

  if (selectedProductId) {
    const allItems = [...posted, ...products];
    const activeProduct = allItems.find((item) => String(item.id) === selectedProductId);
    if (activeProduct) {
      return <ProductDetailPage product={activeProduct} allProducts={allItems} onBack={closeProduct} onOpen={openProduct} market={market} usdToInrRate={usdToInrRate} />;
    }
  }

  if (luxuryMode) {
    return <LuxuryPage items={luxuryItems} market={market} usdToInrRate={usdToInrRate} onOpen={openProduct} onBack={exitLuxuryMode} />;
  }

  if (view === 'admin' && unlocked) {
    return (
      <>
        <AdminDashboard
          posted={posted}
          visitStats={visitStats}
          onAddNew={() => { setForm(emptyForm); setEditingId(null); setPostOpen(true); }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBackToStore={() => {
            if (isAdminHost) {
              window.location.href = 'https://curatopicks.site/';
              return;
            }
            window.history.pushState({}, '', '/');
            setView('store');
          }}
          deletingId={deletingId}
        />
        {modals}
      </>
    );
  }

  if (adminIntent && !unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050607] px-4 text-[#111]">
        <div className="relative w-full max-w-sm rounded-2xl border border-black/[0.07] bg-white p-8 backdrop-blur-md">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500"><Sparkles size={18} className="text-slate-950" /></span>
            <span className="text-lg font-bold text-[#111]">Curato<span className="text-cyan-600">.picks</span></span>
          </div>
          <h1 className="mb-1 flex items-center justify-center gap-2 text-center text-base font-semibold text-[#111]">
            <Lock size={16} className="text-cyan-600" /> Admin sign-in
          </h1>
          <p className="mb-6 text-center text-xs text-white/50">Enter your owner passcode to access the dashboard.</p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              autoFocus
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Passcode"
              className="w-full rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-black/25 transition-colors"
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button disabled={unlocking} className="liquid-btn w-full justify-center py-2.5 text-sm font-semibold tracking-wide text-[#111] disabled:cursor-not-allowed disabled:opacity-60">
              {unlocking ? 'Verifying…' : 'Unlock dashboard'}
            </button>
          </form>
          <a href={isAdminHost ? 'https://curatopicks.site/' : '/'} className="mt-5 block text-center text-xs text-black/40 transition hover:text-black/55">← Back to storefront</a>
        </div>
      </div>
    );
  }

  return (
    <div className="site-intro min-h-screen bg-[#f5f4f0] text-[#111] antialiased">
      <div
        className={`fixed left-0 top-0 z-[100] h-[3px] bg-cyan-500 transition-all duration-500 ease-out ${navLoading ? 'w-2/3 opacity-100' : 'w-full opacity-0'}`}
      />
      <div className="relative">
        <header className={`sticky top-0 z-30 border-b border-black/[0.07] bg-[#f5f4f0]/80 backdrop-blur-lg transition-transform duration-300 ${hideHeader ? '-translate-y-full' : 'translate-y-0'}`}>
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <a href="#" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500"><Sparkles size={16} className="text-slate-950" /></span>
              <span className="text-lg font-bold text-[#111]">Curato<span className="text-cyan-600">.picks</span></span>
            </a>
            <div className="relative w-full lg:max-w-md">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black/40" />
              <input
                value={query}
                onChange={(event) => {
                  const next = event.target.value;
                  setQuery(next);
                  if (next.trim() && !query.trim()) {
                    setNavLoading(true);
                    window.setTimeout(() => setNavLoading(false), 450);
                    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setNavLoading(true);
                    window.setTimeout(() => setNavLoading(false), 450);
                    document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                placeholder="Search products…"
                className="w-full rounded-xl border border-black/[0.07] bg-white py-2.5 pl-10 pr-4 text-sm text-[#111] outline-none placeholder:text-black/40 focus:border-black/25 transition-colors"
              />
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-black/[0.07] bg-white p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMarket('IN')}
                className={`rounded-full px-3 py-1.5 transition-colors ${market === 'IN' ? 'bg-[#111] text-white' : 'text-black/50 hover:text-black/80'}`}
              >
                🇮🇳 India
              </button>
              <button
                type="button"
                onClick={() => setMarket('US')}
                className={`rounded-full px-3 py-1.5 transition-colors ${market === 'US' ? 'bg-[#111] text-white' : 'text-black/50 hover:text-black/80'}`}
              >
                🇺🇸 US
              </button>
              {!isAuto && (
                <button
                  type="button"
                  onClick={() => setMarket('auto')}
                  title="Switch back to auto-detecting your region"
                  className="rounded-full px-2 py-1.5 text-black/30 transition-colors hover:text-black/60"
                >
                  <RefreshCw size={12} />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="amazon-nav border-b border-black/[0.07]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-0.5 px-2 py-1.5 sm:px-4">
            <button
              type="button"
              onClick={() => setNavMenuOpen((open) => !open)}
              className="amazon-nav-item flex items-center gap-1.5 font-semibold"
            >
              <Menu size={16} /> All
            </button>

            {categories.map((item) => (
              <div
                key={item}
                className="relative"
                onMouseEnter={() => megaMenu[item] && openMegaMenu(item)}
                onMouseLeave={() => megaMenu[item] && scheduleCloseMegaMenu()}
              >
                <button
                  onClick={() => {
                    selectCategory(item);
                    if (megaMenu[item]) setMegaOpen((current) => (current === item ? null : item));
                  }}
                  className={`amazon-nav-item ${category === item && !boardFilter ? 'amazon-nav-item-active' : ''}`}
                >
                  {item}
                </button>

                {megaMenu[item] && megaOpen === item && (
                  <div
                    className="absolute left-0 top-full z-40 mt-1 flex gap-8 rounded-lg border border-black/[0.07] bg-white p-6 shadow-2xl"
                    onMouseEnter={() => openMegaMenu(item)}
                    onMouseLeave={scheduleCloseMegaMenu}
                  >
                    <button
                      type="button"
                      onClick={() => { selectCategory(item); setMegaOpen(null); }}
                      className="absolute -top-1 right-3 text-[11px] font-medium text-cyan-600 hover:text-cyan-700"
                    >
                      See all {item}
                    </button>
                    {megaMenu[item].map((col) => (
                      <div key={col.heading} className="min-w-[140px]">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/40">{col.heading}</h4>
                        <ul className="space-y-1.5">
                          {col.items.map((sub) => (
                            <li key={sub}>
                              <button
                                type="button"
                                onClick={() => selectSubcategory(item, sub)}
                                className="text-left text-sm text-black/70 transition hover:text-black hover:underline"
                              >
                                {sub}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <span className="mx-1 hidden h-5 w-px bg-white/25 sm:block" />

            {boardNavItems.map((item) => (
              <button
                key={item}
                onClick={() => selectBoard(item)}
                className={`amazon-nav-item ${boardFilter === item ? 'amazon-nav-item-active' : ''}`}
              >
                {item === 'Deals' ? <span className="flex items-center gap-1"><Flame size={13} />{item}</span> : item}
              </button>
            ))}

            <button
              onClick={enterLuxuryMode}
              className={`amazon-nav-item ml-auto flex items-center gap-1 !text-amber-300 hover:!text-amber-200 ${luxuryMode ? 'amazon-nav-item-active !text-amber-200' : ''}`}
            >
              <Sparkles size={13} /> Luxury
            </button>
          </div>

          {navMenuOpen && (
            <div className="border-t border-black/[0.07] bg-[#1a232f]">
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
                <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                  <span className="font-semibold uppercase tracking-wide text-white/50">Shop by</span>
                  {[...categories, ...boardNavItems].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        if (categories.includes(item)) selectCategory(item);
                        else selectBoard(item);
                        setNavMenuOpen(false);
                      }}
                      className="font-medium text-white/80 transition hover:text-white"
                    >
                      {item}
                    </button>
                  ))}
                  <button
                    onClick={() => { enterLuxuryMode(); setNavMenuOpen(false); }}
                    className="flex items-center gap-1 font-medium text-amber-300 transition hover:text-amber-200"
                  >
                    <Sparkles size={12} /> Luxury
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-white/10 pt-4 sm:grid-cols-4">
                  {categories.filter((c) => megaMenu[c]).map((c) => (
                    <div key={c}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">{c}</h4>
                      <ul className="space-y-1.5">
                        {megaMenu[c].flatMap((col) => col.items).slice(0, 6).map((sub) => (
                          <li key={sub}>
                            <button
                              type="button"
                              onClick={() => { selectSubcategory(c, sub); setNavMenuOpen(false); }}
                              className="text-left text-[13px] text-white/70 transition hover:text-white hover:underline"
                            >
                              {sub}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {boardFilter && (
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 pt-3 sm:px-6">
            <span className="text-xs text-black/40">Showing:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-700">
              {boardFilter}
              <button type="button" onClick={() => { setBoardFilter(null); window.history.pushState({}, '', '/'); }} aria-label="Clear board filter"><X size={12} /></button>
            </span>
          </div>
        )}

        <section className="relative -mt-px min-h-[78vh] overflow-hidden sm:min-h-[85vh]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 z-0 h-full w-full object-cover"
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/agentic-hero-9yW3wnTNMfn2U6lsVhTTZSJFEvAoSj.mp4"
          />
          {/* Progressive blur + fade into the page's off-white bg, bottom-up */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" style={{ height: '60%', background: 'linear-gradient(to top, #f5f4f0 0%, #f5f4f0 15%, rgba(245,244,240,0.85) 32%, rgba(245,244,240,0.5) 52%, rgba(245,244,240,0.15) 74%, transparent 100%)' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" style={{ height: '18%', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', maskImage: 'linear-gradient(to top, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" style={{ height: '36%', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', maskImage: 'linear-gradient(to top, black 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 100%)' }} />

          <div className="relative z-20 mx-auto flex min-h-[78vh] max-w-7xl flex-col items-center justify-end px-4 pb-16 text-center sm:min-h-[85vh] sm:px-6 sm:pb-24">
            <span className="eyebrow-label"><Sparkles size={12} /> Curato.picks</span>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-light leading-[1.05] tracking-tight text-[#111] sm:text-6xl">
              Handpicked deals,<br className="hidden sm:block" /> delivered while you scroll.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm text-black/45 sm:text-base">
              Every item below is personally reviewed and curated — real ratings, real discounts, zero guesswork. Tap a card to grab the deal on Amazon before it's gone.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="#browse" className="flex items-center gap-2 rounded-full bg-cyan-600 px-6 py-3 text-sm tracking-widest text-white shadow-sm transition-colors hover:bg-cyan-700">
                START SHOPPING <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </section>

        <section className="overflow-hidden border-t border-black/[0.06] select-none">
          <div className="flex border-b border-black/[0.06]" style={{ animation: 'marqueeLeft 28s linear infinite' }}>
            {[0, 1, 2].map((rep) => (
              <div key={rep} className="flex shrink-0">
                {[...categories.filter((c) => c !== 'Home'), ...boardNavItems].map((label) => (
                  <div key={label} className="flex shrink-0 items-center gap-3 border-r border-black/[0.06] px-8 py-4">
                    <span className="status-dot bg-black/20" />
                    <span className="marquee-chip">{label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex" style={{ animation: 'marqueeRight 22s linear infinite' }}>
            {[0, 1, 2].map((rep) => (
              <div key={rep} className="flex shrink-0">
                {['Free Amazon Delivery', 'Verified Ratings', 'Updated Daily', 'Secure Checkout', 'Real Discounts'].map((label) => (
                  <div key={label} className="flex shrink-0 items-center gap-3 border-r border-black/[0.06] px-8 py-4">
                    <span className="status-dot bg-black/12" />
                    <span className="marquee-chip text-black/35">{label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="eyebrow-label">Why shop here</span>
          <h2 className="mt-5 max-w-xl text-3xl font-light leading-[1.05] tracking-tight text-[#111] sm:text-4xl">Everything you need to buy with confidence.</h2>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Verified picks', body: 'Every product is personally checked before it goes live — no filler, no dead links.' },
              { icon: BadgePercent, title: 'Real discounts', body: "Prices and originalPrice are pulled straight from the listing, so the % off is always genuine." },
              { icon: RefreshCw, title: 'Updated daily', body: 'New deals and Editor\'s Picks are added regularly, so there is always something fresh to browse.' },
              { icon: ShoppingBag, title: 'Secure checkout', body: 'You always complete your purchase on Amazon\'s own secure checkout — we just point the way.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bento-card p-6">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-black/70">
                  <Icon size={17} strokeWidth={1.5} />
                </div>
                <h3 className="mb-2 text-lg font-light text-[#111]">{title}</h3>
                <p className="text-sm leading-relaxed text-black/45">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-4 py-16 sm:px-6 lg:px-8">
          <span className="eyebrow-label">Shop by category</span>
          <h2 className="mt-5 max-w-xl text-3xl font-light leading-[1.05] tracking-tight text-[#111] sm:text-4xl">Pick a category, we've already narrowed it down.</h2>
          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryStats.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => { selectCategory(c.name); document.getElementById('browse')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="bento-card group overflow-hidden text-left"
              >
                {c.image ? (
                  <div className="h-32 w-full overflow-hidden bg-white">
                    <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" />
                  </div>
                ) : null}
                <div className="p-5">
                  <h3 className="text-lg font-light text-[#111]">{c.name}</h3>
                  <div className="mt-3 flex items-center gap-4 font-mono-brand text-xs text-black/40">
                    <span>{c.count} items</span>
                    {c.avgDiscount > 0 && <span className="text-emerald-600">{c.avgDiscount}% avg off</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <NewArrivalsCarousel posted={posted} market={market} usdToInrRate={usdToInrRate} onOpen={openProduct} />

        {boardNavItems.some((b) => posted.some((p) => String(p.board ?? '') === b && String((p as Record<string, unknown>).market ?? 'IN') === market && (p as Record<string, unknown>).luxury !== true)) && (
          <section className="mx-auto max-w-6xl border-t border-black/[0.06] px-4 py-16 sm:px-6 lg:px-8">
            <span className="eyebrow-label">Freshly added</span>
            <h2 className="mt-5 max-w-xl text-3xl font-light leading-[1.05] tracking-tight text-[#111] sm:text-4xl">Newest listings, straight from the dashboard.</h2>
            <div className="mt-8 space-y-2">
              {[...posted]
                .filter((p) => String((p as Record<string, unknown>).market ?? 'IN') === market && (p as Record<string, unknown>).luxury !== true)
                .slice(0, 6)
                .map((p, i) => {
                  const productMarket: Market = String((p as Record<string, unknown>).market ?? 'IN') === 'US' ? 'US' : 'IN';
                  const price = displayPrice(Number(p.price), productMarket, market, usdToInrRate);
                  return (
                    <button
                      key={String(p.id)}
                      type="button"
                      onClick={() => openProduct(String(p.id))}
                      className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-black/[0.04] bg-black/[0.02] px-3 py-2.5 text-left transition-colors hover:bg-black/[0.04]"
                      style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 80}ms both` }}
                    >
                      <span className="font-mono-brand text-[10px] text-black/25">{String(p.category ?? '')}</span>
                      <span className="flex-1 truncate text-[13px] font-light text-black/70">{String(p.title).slice(0, 60)}</span>
                      <span className="font-mono-brand text-xs text-emerald-600">{price.primary}</span>
                      <span className="status-dot bg-emerald-500/70" />
                    </button>
                  );
                })}
            </div>
          </section>
        )}

        <main id="browse" className="mx-auto max-w-7xl px-4 pb-20 pt-4 sm:px-6">
          <span className="eyebrow-label mb-4 flex items-center gap-2"><TrendingUp size={12} /> Browse all</span>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs sm:w-auto">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-black/40">{symbolOf(market)}</span>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="Set your budget"
                className="w-full rounded-xl border border-black/[0.07] bg-white py-2.5 pl-7 pr-4 text-sm text-[#111] outline-none placeholder:text-black/40 focus:border-black/25 transition-colors sm:w-56"
              />
              {budget.trim() && (
                <button
                  type="button"
                  onClick={() => setBudget('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black/40 transition hover:text-black/55"
                  aria-label="Clear budget"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {loading && <span className="text-xs text-black/40">Syncing latest listings…</span>}
          </div>
          {filtered.length ? (
            budget.trim() ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((product) => (
                  <ProductCard
                    key={String(product.id)}
                    product={product}
                    canDelete={unlocked && String(product.id).startsWith('posted-')}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onOpen={openProduct}
                    deleting={deletingId === product.id}
                    withinBudget={!Number.isNaN(Number(budget)) && Number(budget) > 0 && Number(product.price) <= Number(budget)}
                    market={market}
                    usdToInrRate={usdToInrRate}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-10">
                {sectionsFor(filtered).map((section) => (
                  <div key={section.title}>
                    <h2 className="mb-4 text-lg font-bold text-[#111]">{section.title}</h2>
                    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                      {section.items.map((product) => (
                        <ProductCard
                          key={String(product.id)}
                          product={product}
                          canDelete={unlocked && String(product.id).startsWith('posted-')}
                          onDelete={handleDelete}
                          onEdit={handleEdit}
                          onOpen={openProduct}
                          deleting={deletingId === product.id}
                          market={market}
                          usdToInrRate={usdToInrRate}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-black/[0.07] bg-white p-16 text-center">
              <Search size={28} className="text-black/20" />
              <p className="text-sm text-black/40">
                {query ? <>No products match "{query}". Try a different search or category.</> : 'No products here yet — check back soon.'}
              </p>
            </div>
          )}
        </main>

        <footer className="border-t border-black/[0.07]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-500"><Sparkles size={16} className="text-slate-950" /></span>
                  <span className="text-lg font-bold text-[#111]">Curato<span className="text-cyan-600">.picks</span></span>
                </span>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-black/40">
                  Handpicked deals and top recommendations across fashion, beauty, tech, and lifestyle — curated daily so you don't have to dig through endless listings.
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#111]">Shop by Category</h3>
                <ul className="space-y-2 text-sm text-black/40">
                  {categories.map((item) => (
                    <li key={item}><button type="button" onClick={() => selectCategory(item)} className="transition hover:text-black">{item}</button></li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#111]">Useful Links</h3>
                <ul className="space-y-2 text-sm text-black/40">
                  <li><a href="/about" className="transition hover:text-black">About Us</a></li>
                  <li><a href="/contact" className="transition hover:text-black">Contact Us</a></li>
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-[#111]">Our Policies</h3>
                <ul className="space-y-2 text-sm text-black/40">
                  <li><a href="/privacy" className="transition hover:text-black">Privacy Policy</a></li>
                  <li><a href="/terms" className="transition hover:text-black">Terms of Service</a></li>
                  <li><a href="/cookies" className="transition hover:text-black">Cookie Policy</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-10 border-t border-black/[0.07] pt-6">
              <AdSenseAd slot="6225151049" className="mb-6" />
              <p className="mx-auto max-w-2xl text-center text-xs leading-relaxed text-black/40">As an Amazon Associate I earn from qualifying purchases. Prices and availability are accurate as of the date/time indicated and are subject to change.</p>
              <p className="mt-3 text-center text-[11px] text-black/40">© {new Date().getFullYear()} Curato.picks. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {modals}
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-black/[0.07] bg-white px-3.5 py-2.5 text-sm text-[#111] outline-none placeholder:text-black/40 focus:border-black/25 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-medium text-white/50">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
