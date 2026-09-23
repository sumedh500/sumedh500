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
  console.log(`Searching Zoho Contacts for Phone:equals:${normalized} (raw input: "${phone}")`);

  const response = await client.get("/Contacts/search", {
    params: { criteria: `(Phone:equals:${normalized})` },
  });

  const contact = response.data?.data?.[0] ?? null;
  console.log(contact ? `Found Contact ${contact.id}` : "No Contact matched.");
  return contact;
}

// Every field ZohoDeal (types/zoho.ts) reads. Unlike the regular Get/Search
// Records APIs (where `fields` is optional and full data comes back by
// default), Zoho's "Get Related Records" API — which is what
// GET /Contacts/{id}/Deals is — treats `fields` as mandatory. Omitting it
// silently returns a stripped-down record missing Stage and every custom
// field, which is exactly what caused search_booking (and search_deal's
// phone branch) to report "not found" even once the Contact lookup itself
// was correct.
const DEAL_RELATED_LIST_FIELDS = [
  "Deal_Name",
  "Stage",
  "Contact_Name",
  "Follow_Up_Preference",
  "VIN",
  "Allocation_Stage",
  "Payment_Link",
  "Booking_Id",
].join(",");

// Standard "Deals" related list on a Contact record.
export async function getDealsForContact(contactId: string): Promise<ZohoDeal[]> {
  const client = getZohoClient();
  const response = await client.get(`/Contacts/${contactId}/Deals`, {
    params: { fields: DEAL_RELATED_LIST_FIELDS },
  });

  const deals: ZohoDeal[] = response.data?.data ?? [];
  console.log(
    `Contact ${contactId} has ${deals.length} Deal(s): ${deals.map((d) => `${d.id}=${d.Stage}`).join(", ") || "(none)"}`
  );
  return deals;
}
