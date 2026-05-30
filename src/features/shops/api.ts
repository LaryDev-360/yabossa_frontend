import { apiRequest } from "../../api/client";
import type { Location, LocationPayload, Shop, ShopPayload } from "./types";

export async function listShops(): Promise<Shop[]> {
  return apiRequest<Shop[]>("/shops/");
}

export async function getShop(id: string): Promise<Shop> {
  return apiRequest<Shop>(`/shops/${id}/`);
}

export async function createShop(payload: ShopPayload): Promise<Shop> {
  return apiRequest<Shop>("/shops/", { method: "POST", body: payload });
}

export async function updateShop(id: string, payload: Partial<ShopPayload>): Promise<Shop> {
  return apiRequest<Shop>(`/shops/${id}/`, { method: "PATCH", body: payload });
}

export async function deleteShop(id: string): Promise<void> {
  await apiRequest(`/shops/${id}/`, { method: "DELETE" });
}

export async function listLocations(shopId: string): Promise<Location[]> {
  return apiRequest<Location[]>(`/shops/${shopId}/locations/`);
}

export async function createLocation(shopId: string, payload: LocationPayload): Promise<Location> {
  return apiRequest<Location>(`/shops/${shopId}/locations/`, { method: "POST", body: payload });
}

export async function updateLocation(
  shopId: string,
  locationId: string,
  payload: Partial<LocationPayload>,
): Promise<Location> {
  return apiRequest<Location>(`/shops/${shopId}/locations/${locationId}/`, {
    method: "PATCH",
    body: payload,
  });
}

export async function deleteLocation(shopId: string, locationId: string): Promise<void> {
  await apiRequest(`/shops/${shopId}/locations/${locationId}/`, { method: "DELETE" });
}
