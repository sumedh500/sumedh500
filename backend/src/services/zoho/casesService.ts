import { getZohoClient } from "./zohoClient";
import { findContactByPhone } from "./contactsService";
import type { CreateCaseInput } from "../../types/zoho";

// Post-Purchase / Service stage (ARCHITECTURE.md §4: create_case tool).
// Requires an existing Contact — a service case for someone with no
// purchase history in Zoho is a data-quality problem the agent should
// surface, not silently create a case for.
export async function createCase(input: CreateCaseInput): Promise<{ id: string }> {
  const client = getZohoClient();

  const contact = input.contactId
    ? { id: input.contactId }
    : input.phone
      ? await findContactByPhone(input.phone)
      : null;

  if (!contact) {
    throw new Error("No existing Contact found for this phone number — cannot link the service case.");
  }

  const payload = {
    Subject: `${input.issueType} — ${input.registrationNumber}`,
    Contact_Name: { id: contact.id },
    Registration_Number: input.registrationNumber,
    Odometer_Reading: input.odometerReading,
    Issue_Type: input.issueType,
    Preferred_Service_Center: input.preferredServiceCenter,
    Status: "Open",
  };

  const response = await client.post("/Cases", { data: [payload] });
  const result = response.data?.data?.[0];

  if (result?.status !== "success") {
    throw new Error(`Zoho create case failed: ${JSON.stringify(result)}`);
  }

  return { id: result.details.id };
}
