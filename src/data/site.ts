// Shared site contact settings.
// Change the phone number HERE and it updates everywhere it is shown.
export const CONTACT_PHONE_DIGITS = "8700914976";

/** Shown to customers, e.g. +91 87009 14976 */
export const CONTACT_PHONE_DISPLAY = `+91 ${CONTACT_PHONE_DIGITS.slice(0, 5)} ${CONTACT_PHONE_DIGITS.slice(5)}`;

/** Used for tap-to-call links */
export const CONTACT_PHONE_HREF = `tel:+91${CONTACT_PHONE_DIGITS}`;
