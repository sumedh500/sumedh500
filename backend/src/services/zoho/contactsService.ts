import { getZohoClient } from "./zohoClient";
import { normalizeIndianPhone } from "../../utils/phone";
import type { ZohoContact, ZohoDeal } from "../../types/zoho";

// Deals and Cases both link to Contacts, not to a raw phone number, so
// phone-based lookups for those two modules go through here first. This
// is the shared "find_contact" tool from ARCHITECTURE.md §4.
//
// Zoho's Phone-field search only supports an exact "equals" match (no
// "contains" — confirmed against the Search Records API docs), so a user
// typing "9820055667" would never match a Contact stored as
// "+919820055667". Normalizing here, on the read side, is the single
// choke point every phone-based lookup (search_deal, search_booking,
// create_case) goes through, so this one fix covers all three.
export async function findContactByPhone(phone: string): Promise<ZohoContact | null> {
  const client = getZohoClient();
  const normalized = normalizeIndianPhone(phone);
  const response = await client.get("/Contacts/search", {
    params: { criteria: `(Phone:equals:${normalized})` },
  });
  return response.data?.data?.[0] ?? null;
}

// Standard "Deals" related list on a Contact record.
export async function getDealsForContact(contactId: string): Promise<ZohoDeal[]> {
  const client = getZohoClient();
  const response = await client.get(`/Contacts/${contactId}/Deals`);
  return response.data?.data ?? [];
}
