/**
 * The only values a guard can pick when checking a visitor in. Shared by the
 * check-in form (to render the dropdowns) and the server action (to reject
 * anything else). To add or rename a choice, edit it here.
 */
export const VISIT_DESTINATIONS = ["CB", "CBE", "CBS", "GYMNASIUM"] as const;

export const VISIT_PURPOSES = [
  "To Pay",
  "To Submit File",
  "To Visit",
  "To attend event",
  "Meeting",
] as const;

export type VisitDestination = (typeof VISIT_DESTINATIONS)[number];
export type VisitPurpose = (typeof VISIT_PURPOSES)[number];
