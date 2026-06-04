import type { ApiError } from "../../api/errors";

let onSubscriptionBlocked: (() => void) | null = null;

export function setSubscriptionBlockedHandler(handler: (() => void) | null): void {
  onSubscriptionBlocked = handler;
}

export function notifySubscriptionBlocked(err: ApiError): void {
  if (err.status !== 403) {
    return;
  }
  const msg = err.message.toLowerCase();
  if (msg.includes("subscription")) {
    onSubscriptionBlocked?.();
  }
}
