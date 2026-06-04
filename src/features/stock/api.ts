import { apiRequest } from "../../api/client";
import { listLocations, listShops } from "../shops/api";
import type {
  LocationStock,
  LocationStockContext,
  LocationStockPayload,
  LocationStockUpdatePayload,
  StockAlert,
  StockAlertResolvePayload,
} from "./types";

export async function listLocationStock(locationId: string): Promise<LocationStock[]> {
  return apiRequest<LocationStock[]>(`/locations/${locationId}/stock/`);
}

export async function createLocationStock(
  locationId: string,
  payload: LocationStockPayload,
): Promise<LocationStock> {
  return apiRequest<LocationStock>(`/locations/${locationId}/stock/`, {
    method: "POST",
    body: payload,
  });
}

export async function updateLocationStock(
  locationId: string,
  stockId: string,
  payload: LocationStockUpdatePayload,
): Promise<LocationStock> {
  return apiRequest<LocationStock>(`/locations/${locationId}/stock/${stockId}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteLocationStock(locationId: string, stockId: string): Promise<void> {
  await apiRequest(`/locations/${locationId}/stock/${stockId}/`, { method: "DELETE" });
}

export async function listStockAlerts(status?: string): Promise<StockAlert[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiRequest<StockAlert[]>(`/stock/alerts/${query}`);
}

export async function resolveStockAlert(alertId: string): Promise<StockAlert> {
  return apiRequest<StockAlert>(`/stock/alerts/${alertId}/`, {
    method: "PATCH",
    body: { status: "RESOLVED" } satisfies StockAlertResolvePayload,
  });
}

/** Build a lookup of stock line id → location/shop context (for alerts UI). */
export async function buildLocationStockIndex(): Promise<Map<string, LocationStockContext>> {
  const index = new Map<string, LocationStockContext>();
  const shops = await listShops();
  await Promise.all(
    shops.map(async (shop) => {
      const locations = await listLocations(shop.id);
      await Promise.all(
        locations.map(async (location) => {
          const lines = await listLocationStock(location.id);
          for (const line of lines) {
            index.set(line.id, {
              ...line,
              locationName: location.name,
              shopId: shop.id,
              shopName: shop.name,
            });
          }
        }),
      );
    }),
  );
  return index;
}
