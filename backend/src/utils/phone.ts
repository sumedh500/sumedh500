// Zoho's Phone-field search only supports equals/starts_with/not_equal/in
// (no "contains"), so a user typing "9820055667" will never match a
// stored "+919820055667" via the search API itself — the fix has to be
// normalizing both sides to the same format before comparing. India-only
// (10-digit mobile numbers) since this is for an Indian OEM; extend if
// the CRM ever stores non-Indian numbers.
export function normalizeIndianPhone(rawPhone: string): string {
  const digitsOnly = rawPhone.replace(/\D/g, "");

  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }

  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    // Leading trunk prefix, e.g. 09820055667
    return `+91${digitsOnly.slice(1)}`;
  }

  // Unrecognized shape (different country code, garbled input, etc.) —
  // best effort rather than silently mangling it further.
  return digitsOnly.length > 0 ? `+${digitsOnly}` : rawPhone;
}
