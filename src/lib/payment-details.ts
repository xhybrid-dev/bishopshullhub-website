import { doc, type Firestore, type DocumentReference } from 'firebase/firestore';

/**
 * Bank details and the signature image are held in an admin-only subcollection
 * rather than on the enquiry itself: `booking_enquiries/{id}` is publicly
 * gettable so the hirer and the security reviewer can open their emailed links,
 * which would otherwise expose account numbers to anyone holding an enquiry id.
 */
export const PAYMENT_DOC_ID = 'payment';

export interface PaymentDetails {
  bankName: string;
  accountNumber: string;
  sortCode: string;
  accountName: string;
  /** PNG data URL of the hirer's signature. */
  signatureDataUrl?: string;
  savedAt?: string;
}

/** Fields that must never be written onto the public enquiry document. */
export const PAYMENT_FIELDS = [
  'bankName',
  'accountNumber',
  'sortCode',
  'accountName',
  'signatureDataUrl',
] as const;

export function paymentDocRef(firestore: Firestore, enquiryId: string): DocumentReference {
  return doc(firestore, 'booking_enquiries', enquiryId, 'private', PAYMENT_DOC_ID);
}

/** Strips payment fields from a confirmation object bound for the enquiry doc. */
export function withoutPaymentFields<T extends Record<string, any>>(
  confirmation: T
): Omit<T, (typeof PAYMENT_FIELDS)[number]> {
  const clean: Record<string, any> = { ...confirmation };
  for (const field of PAYMENT_FIELDS) delete clean[field];
  return clean as Omit<T, (typeof PAYMENT_FIELDS)[number]>;
}

/**
 * Reads payment details for an enquiry, falling back to the legacy inline
 * `confirmation` fields on enquiries confirmed before the split.
 */
export function readLegacyPaymentDetails(enquiry: any): PaymentDetails | null {
  const c = enquiry?.confirmation;
  if (!c) return null;
  const hasAny = PAYMENT_FIELDS.some((f) => c[f]);
  if (!hasAny) return null;
  return {
    bankName: c.bankName ?? '',
    accountNumber: c.accountNumber ?? '',
    sortCode: c.sortCode ?? '',
    accountName: c.accountName ?? '',
    signatureDataUrl: c.signatureDataUrl,
  };
}
