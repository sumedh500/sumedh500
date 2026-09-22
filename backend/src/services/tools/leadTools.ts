import { z } from "zod";
import { createLead } from "../zoho/leadsService";
import type { ToolDefinition } from "../../types/agent";

export const createLeadArgsSchema = z.object({
  name: z.string().min(1, "name is required"),
  phone: z.string().min(6, "phone must be a valid phone number"),
  email: z.string().email("email must be a valid email address"),
  city: z.string().min(1, "city is required"),
  vehicleModel: z.string().min(1, "vehicleModel is required"),
});

export const createLeadTool: ToolDefinition = {
  type: "function",
  function: {
    name: "create_lead",
    description:
      "Create a new Lead in Zoho CRM once the visitor's name, phone, email, city, and the vehicle " +
      "model they're interested in are all known. Only call this once all five are collected.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Full name of the visitor" },
        phone: { type: "string", description: "Phone number, with country code if given" },
        email: { type: "string", description: "Email address" },
        city: { type: "string", description: "City the visitor is in" },
        vehicleModel: { type: "string", description: "Vehicle model they're interested in, e.g. XUV700" },
      },
      required: ["name", "phone", "email", "city", "vehicleModel"],
      additionalProperties: false,
    },
  },
};

export async function handleCreateLead(rawArgs: unknown) {
  const args = createLeadArgsSchema.parse(rawArgs);
  const result = await createLead(args);
  return { leadId: result.id, message: `Lead created in Zoho CRM (ID ${result.id}).` };
}
