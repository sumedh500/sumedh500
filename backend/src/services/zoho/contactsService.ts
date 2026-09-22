import { getZohoClient } from "./zohoClient";
import type { ZohoContact, ZohoDeal } from "../../types/zoho";

// Deals and Cases both link to Contacts, not to a raw phone number, so
// phone-based lookups for those two modules go through here first. This
// is the shared "find_contact" tool from ARCHITECTURE.md §4.
export async function findContactByPhone(phone: string): Promise<ZohoContact | null> {
  const client = getZohoClient();
  const response = await client.get("/Contacts/search", {
    params: { criteria: `(Phone:equals:${phone})` },
  });
  return response.data?.data?.[0] ?? null;
}

// Standard "Deals" related list on a Contact record.
export async function getDealsForContact(contactId: string): Promise<ZohoDeal[]> {
  const client = getZohoClient();
  const response = await client.get(`/Contacts/${contactId}/Deals`);
  return response.data?.data ?? [];
}
