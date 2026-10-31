import { useSyncExternalStore } from "react";
import { getProduct } from "@/data/products";

// BROWSER-ONLY CART (placeholder until the backend exists).
// Saved in this browser's localStorage, so it is NOT a real order and is not
// shared between devices. Only slug + quantity are stored: prices always come
// from src/data/products.ts.

export type CartLine = { slug: string; quantity: number };

// UI limit per product line (not product data). Change it here if needed.
export const MAX_QTY = 10;

const STORAGE_KEY = "sabaland-cart-v1";
const EMPTY: CartLine[] = [];

let lines: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function clampQty(n: number): number {
  return Math.min(MAX_QTY, Math.max(1, Math.floor(n)));
}

function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { slug, quantity } = item as { slug?: unknown; quantity?: unknown };
    if (typeof slug !== "string" || typeof quantity !== "number") continue;
    if (!Number.isFinite(quantity) || !getProduct(slug)) continue;
    if (out.some((l) => l.slug === slug)) continue;
    out.push({ slug, quantity: clampQty(quantity) });
  }
  return out;
}

function readStorage(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? sanitize(JSON.parse(raw)) : [];
    return parsed.length ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  lines = readStorage();
}

function emit() {
  listeners.forEach((l) => l());
}

function save(next: CartLine[]) {
  lines = next.length ? next : EMPTY;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // storage may be blocked (private mode); the cart still works until reload
  }
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== null && e.key !== STORAGE_KEY) return;
  lines = readStorage();
  emit();
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): CartLine[] {
  load();
  return lines;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

/** Adds `quantity` of a product. Returns how many of it are now in the cart (0 if the slug is unknown). */
export function addToCart(slug: string, quantity: number): number {
  load();
  if (!getProduct(slug)) return 0;
  const qty = clampQty(quantity);
  const existing = lines.find((l) => l.slug === slug);
  const next = existing
    ? lines.map((l) =>
        l.slug === slug ? { ...l, quantity: clampQty(l.quantity + qty) } : l
      )
    : [...lines, { slug, quantity: qty }];
  save(next);
  return next.find((l) => l.slug === slug)?.quantity ?? 0;
}

/** Sets a line's quantity (1 to MAX_QTY). Returns the new quantity, or 0 if that product is not in the cart. */
export function setQuantity(slug: string, quantity: number): number {
  load();
  if (!lines.some((l) => l.slug === slug)) return 0;
  const qty = clampQty(quantity);
  save(lines.map((l) => (l.slug === slug ? { ...l, quantity: qty } : l)));
  return qty;
}

/** Removes a product from the cart. */
export function removeFromCart(slug: string): void {
  load();
  if (!lines.some((l) => l.slug === slug)) return;
  save(lines.filter((l) => l.slug !== slug));
}

/** Empties the cart. */
export function clearCart(): void {
  load();
  if (lines.length === 0) return;
  save([]);
}

export function useCart() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = current.reduce((n, l) => n + l.quantity, 0);
  return { lines: current, count };
}
