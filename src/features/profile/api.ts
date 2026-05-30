import { apiRequest } from "../../api/client";
import type { User } from "../../api/types";

export type UpdateProfilePayload = {
  full_name?: string;
  business_name?: string;
  phone_number?: string;
};

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  return apiRequest<User>("/auth/me/", {
    method: "PATCH",
    body: payload,
  });
}

export async function changePassword(
  payload: ChangePasswordPayload,
): Promise<{ detail: string }> {
  return apiRequest("/auth/password/change/", {
    method: "POST",
    body: payload,
  });
}
