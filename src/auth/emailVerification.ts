import type { User } from "../api/types";

export function isEmailVerified(user: User | null): boolean {
  return Boolean(user?.email_verified_at);
}
