export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) {
    return "/api/v1";
  }
  return base.replace(/\/$/, "");
}

export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME?.trim() || "TwoFStock";
}
