export interface Shop {
  id: string;
  merchant: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone_number: string | null;
  is_active: boolean;
  created_at: string;
}

export type ShopPayload = {
  name: string;
  description?: string;
  is_active?: boolean;
  merchant?: string;
};

export type LocationPayload = {
  name: string;
  address?: string;
  city?: string;
  phone_number?: string;
  is_active?: boolean;
};
