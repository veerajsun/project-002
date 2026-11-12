// Checkout helpers: validation, Indian states, and a browser-tab-only draft.
// NOTHING here talks to a server. Details are kept in this tab's sessionStorage
// (cleared when the tab is closed) so a page refresh does not lose them.

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

/**
 * Design-preview switch. When true, a clearly marked "preview" button lets you look at Steps 2
 * and 3 WITHOUT verifying a phone. Preview never verifies anything and never allows an order.
 * ON in `npm run dev`. OFF in a production build unless NEXT_PUBLIC_CHECKOUT_PREVIEW=true.
 */
export const CHECKOUT_PREVIEW_ALLOWED: boolean =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_CHECKOUT_PREVIEW === "true";

export type Address = {
  fullName: string;
  mobile: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pin: string;
};

export type AddressErrors = Partial<Record<keyof Address, string>>;

export type Draft = {
  step: 1 | 2 | 3;
  mobile: string; // mobile entered in step 1 (digits only)
  address: Address;
};

export const EMPTY_ADDRESS: Address = {
  fullName: "",
  mobile: "",
  house: "",
  street: "",
  landmark: "",
  city: "",
  state: "",
  pin: "",
};

export const EMPTY_DRAFT: Draft = { step: 1, mobile: "", address: EMPTY_ADDRESS };

/* ---------------- validation ---------------- */

/** Indian mobile: exactly 10 digits, starting with 6, 7, 8 or 9. */
export function validateMobile(value: string): string | null {
  if (!value) return "Enter your 10-digit mobile number.";
  if (!/^\d+$/.test(value)) return "Use digits only.";
  if (value.length !== 10) return "Mobile number must be exactly 10 digits.";
  if (!/^[6-9]/.test(value)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
  return null;
}

/** Indian PIN code: 6 digits, first digit 1-9. */
export function validatePin(value: string): string | null {
  if (!value) return "Enter your 6-digit PIN code.";
  if (!/^\d{6}$/.test(value)) return "PIN code must be exactly 6 digits.";
  if (value[0] === "0") return "PIN code cannot start with 0.";
  return null;
}

export function validateAddress(a: Address): AddressErrors {
  const e: AddressErrors = {};
  const name = a.fullName.trim();
  if (!name) e.fullName = "Enter the recipient's full name.";
  else if (name.length < 2) e.fullName = "Name is too short.";
  else if (name.length > 60) e.fullName = "Name must be 60 characters or fewer.";
  else if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(name))
    e.fullName = "Use letters only (spaces, . ' - are fine).";

  const m = validateMobile(a.mobile);
  if (m) e.mobile = m;

  if (!a.house.trim()) e.house = "Enter house / flat / building.";
  else if (a.house.trim().length > 100) e.house = "Keep this under 100 characters.";

  if (!a.street.trim()) e.street = "Enter street / area / locality.";
  else if (a.street.trim().length > 100) e.street = "Keep this under 100 characters.";

  if (a.landmark.trim().length > 100) e.landmark = "Keep this under 100 characters.";

  const city = a.city.trim();
  if (!city) e.city = "Enter your city or town.";
  else if (city.length > 60) e.city = "Keep this under 60 characters.";
  else if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(city)) e.city = "Use letters only.";

  if (!a.state) e.state = "Select your state.";
  else if (!(INDIAN_STATES as readonly string[]).includes(a.state))
    e.state = "Select a state from the list.";

  const p = validatePin(a.pin);
  if (p) e.pin = p;

  return e;
}

/* ---------------- draft storage (sessionStorage) ---------------- */

const DRAFT_KEY = "sabaland-checkout-draft-v1";

function str(x: unknown, max = 200): string {
  return typeof x === "string" ? x.slice(0, max) : "";
}

function sanitizeDraft(raw: unknown): Draft {
  if (!raw || typeof raw !== "object") return EMPTY_DRAFT;
  const r = raw as Record<string, unknown>;
  const a = (r.address && typeof r.address === "object" ? r.address : {}) as Record<string, unknown>;
  const step = r.step === 2 || r.step === 3 ? r.step : 1;
  return {
    step,
    mobile: str(r.mobile, 10).replace(/\D/g, ""),
    address: {
      fullName: str(a.fullName, 60),
      mobile: str(a.mobile, 10).replace(/\D/g, ""),
      house: str(a.house, 100),
      street: str(a.street, 100),
      landmark: str(a.landmark, 100),
      city: str(a.city, 60),
      state: str(a.state, 60),
      pin: str(a.pin, 6).replace(/\D/g, ""),
    },
  };
}

export function loadDraft(): Draft {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? sanitizeDraft(JSON.parse(raw)) : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

export function saveDraft(draft: Draft): void {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // storage may be blocked; checkout still works until the page is reloaded
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

/* ---------------- shared shapes for the review / summary ---------------- */

export type CheckoutRow = {
  slug: string;
  name: string;
  image: string;
  pack: string;
  variant: string | null;
  quantity: number;
  unitPrice: number;
  mrp: number;
  lineTotal: number;
};

export type Totals = {
  itemCount: number;
  subtotal: number;
  savings: number;
  total: number; // shipping is free across India, so total = subtotal
};
