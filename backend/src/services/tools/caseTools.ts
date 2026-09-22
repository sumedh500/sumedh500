import { z } from "zod";
import { createCase } from "../zoho/casesService";
import type { ToolDefinition } from "../../types/agent";

export const createCaseArgsSchema = z.object({
  phone: z.string().min(6, "phone is required to find the owner's Contact record"),
  registrationNumber: z.string().min(1, "registrationNumber is required"),
  odometerReading: z.number().nonnegative("odometerReading must be a non-negative number"),
  issueType: z.string().min(1, "issueType is required"),
  preferredServiceCenter: z.string().min(1, "preferredServiceCenter is required"),
});

export const createCaseTool: ToolDefinition = {
  type: "function",
  function: {
    name: "create_case",
    description:
      "Create a service/complaint case in Zoho CRM for an existing owner, linked to their Contact " +
      "record. Requires their phone number (to find the Contact), registration number, odometer " +
      "reading, issue/service type, and preferred service center.",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string", description: "Owner's phone number, used to find their existing Contact" },
        registrationNumber: { type: "string", description: "Vehicle registration number" },
        odometerReading: { type: "number", description: "Current odometer reading in km" },
        issueType: { type: "string", description: "Type of issue or service requested" },
        preferredServiceCenter: { type: "string", description: "Preferred service center name or location" },
      },
      required: ["phone", "registrationNumber", "odometerReading", "issueType", "preferredServiceCenter"],
      additionalProperties: false,
    },
  },
};

export async function handleCreateCase(rawArgs: unknown) {
  const args = createCaseArgsSchema.parse(rawArgs);
  const result = await createCase(args);
  return { caseId: result.id, message: `Service case created (ID ${result.id}).` };
}
