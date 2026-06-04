export type StockAlertStatus = "OPEN" | "RESOLVED";

export interface LocationStock {
  id: string;
  location: string;
  product: string;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export type LocationStockPayload = {
  product: string;
  quantity: number;
  low_stock_threshold?: number;
};

export type LocationStockUpdatePayload = {
  quantity?: number;
  low_stock_threshold?: number;
};

export interface StockAlert {
  id: string;
  location_stock: string;
  threshold: number;
  current_stock: number;
  status: StockAlertStatus;
  triggered_at: string;
  resolved_at: string | null;
}

export type StockAlertResolvePayload = {
  status: "RESOLVED";
};

export interface LocationStockContext extends LocationStock {
  locationName: string;
  shopId: string;
  shopName: string;
}

export function isLowStock(line: Pick<LocationStock, "quantity" | "low_stock_threshold">): boolean {
  return line.quantity <= line.low_stock_threshold;
}
