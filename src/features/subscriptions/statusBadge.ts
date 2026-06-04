import type { SubscriptionStatus } from "./types";

export function subscriptionStatusBadgeColor(
  status: SubscriptionStatus,
): "success" | "warning" | "error" | "info" | "light" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "TRIAL":
      return "info";
    case "SUSPENDED":
      return "warning";
    case "EXPIRED":
    case "INACTIVE":
      return "error";
    default:
      return "light";
  }
}
