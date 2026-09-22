// Shared TypeScript types: Session, ToolDefinition, StageId, ZohoRecord, etc.
// Filled in as each phase introduces its own shapes rather than pre-guessed here.

export type StageId =
  | "new_lead"
  | "ongoing_pipeline"
  | "booked_vehicle"
  | "post_purchase";
