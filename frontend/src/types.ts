export type StageId = "new_lead" | "ongoing_pipeline" | "booked_vehicle" | "post_purchase";

export interface UiMessage {
  role: "user" | "assistant";
  content: string;
}
