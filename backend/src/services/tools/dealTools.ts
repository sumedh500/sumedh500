import { z } from "zod";
import { searchDeal, updateDealFollowUp } from "../zoho/dealsService";
import type { ToolDefinition } from "../../types/agent";

export const searchDealArgsSchema = z
  .object({
    phone: z.string().min(6).optional(),
    dealId: z.string().min(1).optional(),
  })
  .refine((val) => val.phone || val.dealId, { message: "Provide either phone or dealId" });

export const searchDealTool: ToolDefinition = {
  type: "function",
  function: {
    name: "search_deal",
    description:
      "Look up an existing prospect's deal (test drive / quotation) in Zoho CRM by phone number or " +
      "Deal ID, to check its current stage and follow-up preference.",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string", description: "The prospect's phone number" },
        dealId: { type: "string", description: "The Zoho Deal ID, if the prospect gave one instead of a phone" },
      },
      required: [],
      additionalProperties: false,
    },
  },
};

export async function handleSearchDeal(rawArgs: unknown) {
  const args = searchDealArgsSchema.parse(rawArgs);
  const deal = await searchDeal(args);

  if (!deal) {
    return { found: false, message: "No matching deal found for that phone number / Deal ID." };
  }

  return {
    found: true,
    dealId: deal.id,
    stage: deal.Stage,
    followUpPreference: deal.Follow_Up_Preference ?? null,
  };
}

export const updateDealFollowUpArgsSchema = z.object({
  dealId: z.string().min(1, "dealId is required"),
  followUpPreference: z.string().min(1, "followUpPreference is required"),
});

export const updateDealFollowUpTool: ToolDefinition = {
  type: "function",
  function: {
    name: "update_deal_followup",
    description:
      "Update the follow-up contact preference (e.g. Call, WhatsApp, Email) on an existing Deal. " +
      "Requires the Deal ID from a prior search_deal call.",
    parameters: {
      type: "object",
      properties: {
        dealId: { type: "string", description: "The Zoho Deal ID, from a prior search_deal result" },
        followUpPreference: { type: "string", description: "Preferred follow-up channel, e.g. Call, WhatsApp, Email" },
      },
      required: ["dealId", "followUpPreference"],
      additionalProperties: false,
    },
  },
};

export async function handleUpdateDealFollowUp(rawArgs: unknown) {
  const args = updateDealFollowUpArgsSchema.parse(rawArgs);
  await updateDealFollowUp(args.dealId, { followUpPreference: args.followUpPreference });
  return { updated: true, message: `Follow-up preference updated to ${args.followUpPreference}.` };
}
