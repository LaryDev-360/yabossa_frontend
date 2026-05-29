import { apiRequest, publicRequest } from "./client";
import type {
  AuthTokensResponse,
  LoginPayload,
  RegisterMerchantPayload,
  TokenPair,
  User,
} from "./types";

export async function login(payload: LoginPayload): Promise<AuthTokensResponse> {
  return publicRequest<AuthTokensResponse>("/auth/token/", {
    method: "POST",
    body: payload,
  });
}

export async function registerMerchant(
  payload: RegisterMerchantPayload,
): Promise<AuthTokensResponse> {
  return publicRequest<AuthTokensResponse>("/auth/register/merchant/", {
    method: "POST",
    body: payload,
  });
}

export async function fetchMe(): Promise<User> {
  return apiRequest<User>("/auth/me/");
}

export async function logout(refresh: string): Promise<void> {
  await apiRequest("/auth/logout/", {
    method: "POST",
    body: { refresh },
    retryOnUnauthorized: false,
  });
}

export async function refreshTokens(refresh: string): Promise<TokenPair> {
  return publicRequest<TokenPair>("/auth/token/refresh/", {
    method: "POST",
    body: { refresh },
  });
}

export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  return publicRequest("/auth/password/reset/request/", {
    method: "POST",
    body: { email },
  });
}
