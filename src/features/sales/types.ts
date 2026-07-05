export interface SaleItem {
  id: string;
  product: string;
  product_name: string;
  quantity: number;
  unit_sale_price: string;
  unit_purchase_price: string | null;
  line_total: string;
  line_profit: string | null;
}

export interface Sale {
  id: string;
  location: string;
  merchant: string | null;
  cashier: string | null;
  reference: string;
  sold_at: string;
  total_amount: string;
  estimated_profit: string | null;
  items: SaleItem[];
}

export type SaleLineInput = {
  product: string;
  quantity: number;
};

export type SaleCreatePayload = {
  location: string;
  reference: string;
  items: SaleLineInput[];
  merchant?: string;
  cashier?: string;
};

export interface LocationOption {
  id: string;
  name: string;
  shopId: string;
  shopName: string;
  merchantId: string;
}

export interface PosProductOption {
  productId: string;
  name: string;
  salePrice: string;
  stockQuantity: number;
  scanCode?: string;
  imageUrl?: string | null;
}

export interface CartLine {
  productId: string;
  name: string;
  unitPrice: string;
  quantity: number;
  maxQuantity: number;
  imageUrl?: string | null;
}
