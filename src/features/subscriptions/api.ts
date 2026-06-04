import { apiRequest } from "../../api/client";
import type { Subscription, SubscriptionAdminUpdatePayload } from "./types";

export async function getMySubscription(): Promise<Subscription> {
  return apiRequest<Subscription>("/subscriptions/me/");
}

export async function listSubscriptions(): Promise<Subscription[]> {
  return apiRequest<Subscription[]>("/subscriptions/");
}

export async function updateSubscription(
  id: string,
  payload: SubscriptionAdminUpdatePayload,
): Promise<Subscription> {
  return apiRequest<Subscription>(`/subscriptions/${id}/`, {
    method: "PATCH",
    body: payload,
  });
}
