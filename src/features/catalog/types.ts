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
