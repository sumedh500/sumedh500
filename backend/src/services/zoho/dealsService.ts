import axios from "axios";
import { getZohoClient } from "./zohoClient";
import { findContactByPhone, getDealsForContact } from "./contactsService";
import { BOOKING_STAGE, BookingSearchParams, DealFollowUpUpdate, DealSearchParams, ZohoDeal } from "../../types/zoho";

async function getDealById(dealId: string): Promise<ZohoDeal | null> {
  const client = getZohoClient();
  try {
    const response = await client.get(`/Deals/${dealId}`);
    return response.data?.data?.[0] ?? null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}

// Ongoing Pipeline stage (ARCHITECTURE.md §4: search_deal tool). Looks a
// deal up either directly by ID, or via the linked Contact when only a
// phone number is given — Deals has no Phone field of its own.
export async function searchDeal(params: DealSearchParams): Promise<ZohoDeal | null> {
  if (params.dealId) {
    return getDealById(params.dealId);
  }

  if (params.phone) {
    const contact = await findContactByPhone(params.phone);
    if (!contact) return null;
    const deals = await getDealsForContact(contact.id);
    return deals[0] ?? null;
  }

  throw new Error("searchDeal requires phone or dealId");
}

// Ongoing Pipeline stage (ARCHITECTURE.md §4: update_deal_followup tool).
export async function updateDealFollowUp(dealId: string, update: DealFollowUpUpdate): Promise<void> {
  const client = getZohoClient();
  const response = await client.put(`/Deals/${dealId}`, {
    data: [{ Follow_Up_Preference: update.followUpPreference }],
  });
  const result = response.data?.data?.[0];

  if (result?.status !== "success") {
    throw new Error(`Zoho update deal failed: ${JSON.stringify(result)}`);
  }
}

// Booked Vehicle stage (ARCHITECTURE.md §4: search_booking tool). Same
// underlying Deals module as searchDeal, but only returns a match once it
// has actually reached the booking stage — an in-progress quotation for
// the same phone number is deliberately not returned here.
//
// bookingId here is the human-readable Booking_Id custom field (e.g.
// "BK-2024-00123"), NOT Zoho's internal record id — customers were given
// that field's value, not a Zoho record id, so this has to be a criteria
// search rather than a direct GET /Deals/{id}.
export async function searchBooking(params: BookingSearchParams): Promise<ZohoDeal | null> {
  if (params.bookingId) {
    const client = getZohoClient();
    const response = await client.get("/Deals/search", {
      params: { criteria: `(Booking_Id:equals:${params.bookingId})` },
    });
    const deal: ZohoDeal | undefined = response.data?.data?.[0];
    return deal && deal.Stage === BOOKING_STAGE ? deal : null;
  }

  if (params.phone) {
    const contact = await findContactByPhone(params.phone);
    if (!contact) return null;
    const deals = await getDealsForContact(contact.id);
    return deals.find((deal) => deal.Stage === BOOKING_STAGE) ?? null;
  }

  throw new Error("searchBooking requires phone or bookingId");
}
