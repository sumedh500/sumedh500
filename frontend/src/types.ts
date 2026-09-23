export type StageId = "new_lead" | "ongoing_pipeline" | "booked_vehicle" | "post_purchase";

export interface UiMessage {
  // "hint" is a frontend-only note (never sent to or from the backend) —
  // used to surface a real seeded phone/Booking ID after a suggestion
  // that needs one, so someone other than the person who ran the seed
  // script can actually see the demo work.
  role: "user" | "assistant" | "hint";
  content: string;
}
