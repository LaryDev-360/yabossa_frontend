import type { UserRole } from "../api/types";

export function canManageCatalog(role: UserRole | undefined): boolean {
  return role === "MERCHANT" || role === "ADMIN";
}
