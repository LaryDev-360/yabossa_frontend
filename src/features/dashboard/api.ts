import { apiRequest } from "../../api/client";
import type { DashboardSummary, DashboardSummaryParams } from "./types";

export function defaultDashboardPeriod(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export async function getDashboardSummary(
  params: DashboardSummaryParams,
): Promise<DashboardSummary> {
  const search = new URLSearchParams();
  if (params.from) {
    search.set("from", params.from);
  }
  if (params.to) {
    search.set("to", params.to);
  }
  if (params.shop_id) {
    search.set("shop_id", params.shop_id);
  }
  if (params.merchant_id) {
    search.set("merchant_id", params.merchant_id);
  }
  const query = search.toString();
  return apiRequest<DashboardSummary>(`/dashboard/summary/${query ? `?${query}` : ""}`);
}
