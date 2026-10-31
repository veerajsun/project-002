// PHONE VERIFICATION GATE (NOT IMPLEMENTED YET).
//
// An order can only be created with a VerifiedPhoneProof. This is the ONLY place such a proof can
// come from, and today it ALWAYS returns null, because no SMS provider and no server-side OTP
// check exist yet. So today NO order can be created. Do not "fake" a proof anywhere.
//
// The real version (a later step) will: read the httpOnly cookie, hash it, look up a
// phone_verifications row that is VERIFIED, unexpired and not yet used, and only then return
// { verificationId, phone } built from that DATABASE row, never from anything the browser sent.
declare const proofBrand: unique symbol;

export type VerifiedPhoneProof = {
  readonly verificationId: string;
  readonly phone: string;
  readonly [proofBrand]: true;
};

export async function getVerifiedPhone(_request: Request): Promise<VerifiedPhoneProof | null> {
  return null;
}
