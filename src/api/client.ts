import { getApiBaseUrl } from "./config";
import { ApiError, parseApiError } from "./errors";
import { notifySubscriptionBlocked } from "../features/subscriptions/subscriptionNotify";
import { tokenStorage } from "../auth/tokenStorage";
import type { TokenPair } from "./types";

let refreshInFlight: Promise<string | null> | null = null;

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refresh = tokenStorage.getRefresh();
    if (!refresh) {
      return null;
    }

    const res = await fetch(`${getApiBaseUrl()}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }

    const data = (await res.json()) as TokenPair & { access: string; refresh?: string };
    tokenStorage.setAccess(data.access);
    if (data.refresh) {
      tokenStorage.setRefresh(data.refresh);
    }
    return data.access;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    retryOnUnauthorized = true,
    body,
    headers: initHeaders,
    ...rest
  } = options;

  const headers = new Headers(initHeaders);
  headers.set("Accept", "application/json");

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const access = tokenStorage.getAccess();
    if (access) {
      headers.set("Authorization", `Bearer ${access}`);
    }
  }

  const url = path.startsWith("http") ? path : `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (res.status === 401 && auth && retryOnUnauthorized) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  const payload = await parseJsonSafe(res);

  if (!res.ok) {
    const err = parseApiError(res.status, payload);
    notifySubscriptionBlocked(err);
    throw err;
  }

  return payload as T;
}

export async function publicRequest<T>(
  path: string,
  options: Omit<ApiRequestOptions, "auth"> = {},
): Promise<T> {
  return apiRequest<T>(path, { ...options, auth: false });
}

export { ApiError };
