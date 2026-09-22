import type { StageId } from "../types";

const STAGE_LABELS: Record<StageId, string> = {
  new_lead: "New Lead",
  ongoing_pipeline: "Ongoing Pipeline",
  booked_vehicle: "Booked Vehicle",
  post_purchase: "Post-Purchase / Service",
};

interface StageIndicatorProps {
  stage: StageId | null;
}

// Not just cosmetic — showing the classified stage live is what makes the
// stage classifier's routing decision visible/demoable, not a black box.
export function StageIndicator({ stage }: StageIndicatorProps) {
  return (
    <span className="stage-indicator" data-stage={stage ?? "none"}>
      {stage ? STAGE_LABELS[stage] : "Not started"}
    </span>
  );
}
