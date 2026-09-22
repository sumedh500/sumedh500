import { ZodError } from "zod";
import type { StageId } from "../../types";
import type { ToolDefinition, ToolExecutionResult } from "../../types/agent";
import { createLeadTool, handleCreateLead } from "./leadTools";
import { searchDealTool, handleSearchDeal, updateDealFollowUpTool, handleUpdateDealFollowUp } from "./dealTools";
import { searchBookingTool, handleSearchBooking } from "./bookingTools";
import { createCaseTool, handleCreateCase } from "./caseTools";

type ToolHandler = (args: unknown) => Promise<unknown>;

interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}

const REGISTRY: Record<string, RegisteredTool> = {
  create_lead: { definition: createLeadTool, handler: handleCreateLead },
  search_deal: { definition: searchDealTool, handler: handleSearchDeal },
  update_deal_followup: { definition: updateDealFollowUpTool, handler: handleUpdateDealFollowUp },
  search_booking: { definition: searchBookingTool, handler: handleSearchBooking },
  create_case: { definition: createCaseTool, handler: handleCreateCase },
};

// The core lever for tool-routing accuracy (ARCHITECTURE.md §3): each
// stage only ever sees its own tools, never all five at once.
const STAGE_TOOLS: Record<StageId, string[]> = {
  new_lead: ["create_lead"],
  ongoing_pipeline: ["search_deal", "update_deal_followup"],
  booked_vehicle: ["search_booking"],
  post_purchase: ["create_case"],
};

export function getToolDefinitionsForStage(stage: StageId): ToolDefinition[] {
  return STAGE_TOOLS[stage].map((name) => REGISTRY[name].definition);
}

export async function executeTool(name: string, args: unknown): Promise<ToolExecutionResult> {
  const tool = REGISTRY[name];

  if (!tool) {
    return { ok: false, error: `Unknown tool: ${name}` };
  }

  try {
    const data = await tool.handler(args);
    return { ok: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      // Fed back to the model as the tool result — this is the field-
      // collection mechanism: a specific "what's missing" error drives the
      // model to ask the user for it on the next turn, no separate
      // pending-fields tracker needed for this.
      const issues = error.issues.map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`).join("; ");
      return { ok: false, error: `Invalid arguments — ${issues}` };
    }

    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
