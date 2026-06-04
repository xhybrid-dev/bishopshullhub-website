// Site contact for on-the-day / during-hire issues only.
// This is NOT the booking line — booking enquiries still route to the email.
export const SITE_CONTACT = {
  name: 'Duty Manager',
  displayPhone: '07864 241376',
  telHref: 'tel:+447864241376',
  email: 'operations@bishopshullhub.co.uk',
  emailHref: 'mailto:operations@bishopshullhub.co.uk',
  purposeShort: 'Site enquiries during your hire',
  purposeLong: 'Call or email the Duty Manager for any issues during your hire (access, facilities, on-site problems). Please do not use this contact for new bookings — booking enquiries should be sent to booking@bishopshullhub.co.uk.',
  notForBookings: 'Not for new bookings — site enquiries only',
} as const;
