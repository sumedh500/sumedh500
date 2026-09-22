// Seeds Zoho CRM with the 3 mock records the brief asks for: 1 Lead,
// 1 in-progress Deal (Ongoing Pipeline), 1 Deal at the booking stage
// (Booked Vehicle). Also creates 2 supporting Contacts, since Deals link
// to Contacts rather than carrying their own phone number — this mirrors
// Zoho's normal Lead -> Contact conversion, done by hand here since
// seeding doesn't go through the actual convert action.
//
// Usage (from backend/): npm run seed:zoho

import "dotenv/config";
import { getZohoClient } from "../src/services/zoho/zohoClient";
import { createLead } from "../src/services/zoho/leadsService";
import { BOOKING_STAGE } from "../src/types/zoho";

async function createContact(data: Record<string, unknown>): Promise<string> {
  const client = getZohoClient();
  const response = await client.post("/Contacts", { data: [data] });
  const result = response.data?.data?.[0];

  if (result?.status !== "success") {
    throw new Error(`Failed to create Contact: ${JSON.stringify(result)}`);
  }

  return result.details.id;
}

async function createDeal(data: Record<string, unknown>): Promise<string> {
  const client = getZohoClient();
  const response = await client.post("/Deals", { data: [data] });
  const result = response.data?.data?.[0];

  if (result?.status !== "success") {
    throw new Error(`Failed to create Deal: ${JSON.stringify(result)}`);
  }

  return result.details.id;
}

async function main() {
  console.log("Seeding Zoho CRM with mock records...\n");

  // 1. New Lead
  const lead = await createLead({
    name: "Aditi Sharma",
    phone: "+919820011223",
    email: "aditi.sharma@example.com",
    city: "Pune",
    vehicleModel: "XUV700",
  });
  console.log(`Lead created: ${lead.id}  (Aditi Sharma, +919820011223 -- XUV700)`);

  const pipelineContactId = await createContact({
    Last_Name: "Mehta",
    First_Name: "Rohan",
    Phone: "+919820033445",
    Email: "rohan.mehta@example.com",
  });

  const bookingContactId = await createContact({
    Last_Name: "Iyer",
    First_Name: "Priya",
    Phone: "+919820055667",
    Email: "priya.iyer@example.com",
  });

  // 2. Ongoing Pipeline deal
  const dealId = await createDeal({
    Deal_Name: "Rohan Mehta - XUV700 Quotation",
    Stage: "Proposal/Price Quote",
    Contact_Name: { id: pipelineContactId },
    Follow_Up_Preference: "WhatsApp",
  });
  console.log(`Deal created: ${dealId}  (Rohan Mehta, +919820033445 -- Proposal/Price Quote)`);

  // 3. Booked Vehicle deal
  const bookingId = await createDeal({
    Deal_Name: "Priya Iyer - Scorpio-N Booking",
    Stage: BOOKING_STAGE,
    Contact_Name: { id: bookingContactId },
    Booking_Id: "BK-2024-00123",
    VIN: "MA1TB2GH3PJ123456",
    Allocation_Stage: "In Transit",
    Payment_Link: "https://pay.mahindra.example.com/BK-2024-00123",
  });
  console.log(`Booking created: ${bookingId}  (Priya Iyer, +919820055667 -- Booking_Id BK-2024-00123)`);

  console.log("\nDone. Use these for manual testing:");
  console.log("  New Lead flow:        (creates a fresh lead, no lookup needed)");
  console.log("  Ongoing Pipeline:     phone +919820033445 or Deal ID above");
  console.log("  Booked Vehicle:       phone +919820055667 or Booking ID BK-2024-00123");
}

main().catch((error) => {
  console.error("Seed failed:", error.response?.data ?? error.message ?? error);
  process.exit(1);
});
