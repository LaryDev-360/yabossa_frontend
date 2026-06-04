import { apiRequest } from "../../api/client";
import type { UserRole } from "../../api/types";
import { listLocations, listShops } from "../shops/api";
import type { Sale, SaleCreatePayload, LocationOption } from "./types";

export async function listSales(): Promise<Sale[]> {
  return apiRequest<Sale[]>("/sales/");
}

export async function getSale(id: string): Promise<Sale> {
  return apiRequest<Sale>(`/sales/${id}/`);
}

export async function createSale(payload: SaleCreatePayload): Promise<Sale> {
  return apiRequest<Sale>("/sales/", { method: "POST", body: payload });
}

export async function loadLocationOptions(
  role: UserRole | undefined,
  cashierShopId?: string | null,
): Promise<LocationOption[]> {
  const shops = await listShops();
  const visibleShops =
    role === "CASHIER" && cashierShopId
      ? shops.filter((s) => s.id === cashierShopId)
      : shops;

  const options: LocationOption[] = [];
  await Promise.all(
    visibleShops.map(async (shop) => {
      const locations = await listLocations(shop.id);
      for (const loc of locations) {
        if (!loc.is_active) {
          continue;
        }
        options.push({
          id: loc.id,
          name: loc.name,
          shopId: shop.id,
          shopName: shop.name,
          merchantId: shop.merchant,
        });
      }
    }),
  );
  return options.sort((a, b) =>
    `${a.shopName} ${a.name}`.localeCompare(`${b.shopName} ${b.name}`),
  );
}

export function newSaleReference(): string {
  return crypto.randomUUID();
}
