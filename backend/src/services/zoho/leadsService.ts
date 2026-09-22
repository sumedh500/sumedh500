import { getZohoClient } from "./zohoClient";
import type { CreateLeadInput } from "../../types/zoho";

// Used by the New Lead stage (ARCHITECTURE.md §4: create_lead tool).
export async function createLead(input: CreateLeadInput): Promise<{ id: string }> {
  const client = getZohoClient();

  const nameParts = input.name.trim().split(/\s+/);
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : nameParts[0];
  const firstName = nameParts.length > 1 ? nameParts[0] : undefined;

  const payload = {
    Last_Name: lastName, // mandatory on the Leads module
    First_Name: firstName,
    Phone: input.phone,
    Email: input.email,
    City: input.city,
    Vehicle_Model: input.vehicleModel,
    Lead_Source: input.source ?? "Chat Agent",
  };

  const response = await client.post("/Leads", { data: [payload] });
  const result = response.data?.data?.[0];

  if (result?.status !== "success") {
    throw new Error(`Zoho create lead failed: ${JSON.stringify(result)}`);
  }

  return { id: result.details.id };
}
