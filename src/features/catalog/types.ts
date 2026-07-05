export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  shop: string;
  category: string | null;
  name: string;
  purchase_price: string | null;
  sale_price: string;
  scan_code: string;
  image_url: string | null;
  qr_image_url: string | null;
  reference_image_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type CategoryPayload = {
  name: string;
  description?: string;
};

export type ProductPayload = {
  shop: string;
  category?: string | null;
  name: string;
  purchase_price?: string | null;
  sale_price: string;
  is_archived?: boolean;
};

export interface ProductLookupResult {
  product_id: string;
  name: string;
  sale_price: string;
  image_url: string | null;
  quantity_available: number;
  scan_code: string;
}

export interface VisualMatchItem {
  product_id: string;
  name: string;
  sale_price: string;
  image_url: string | null;
  quantity_available: number;
  score: number;
}

export interface VisualMatchResponse {
  matches: VisualMatchItem[];
  auto_add: VisualMatchItem | null;
}

export interface ProductImageRecord {
  id: string;
  kind: string;
  image_url: string | null;
  created_at: string;
}
