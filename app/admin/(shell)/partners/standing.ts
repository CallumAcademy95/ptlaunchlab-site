import type { PartnerHealth } from "@/app/lib/partner-timeline";
import type { BadgeTone } from "../ui/praxel";

// One place both the index and the detail page read their colour from, so a
// gym cannot be amber on one screen and green on the other.
//
// Typed as a full Record: add a value to PartnerHealth without a colour here
// and the build fails, rather than shipping a chip with no tone.
export const STANDING_TONE: Record<PartnerHealth, BadgeTone> = {
  producing: "green",
  engaged: "blue",
  quiet: "amber",
  "never started": "red",
};
