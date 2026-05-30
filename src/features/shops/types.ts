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
  formatted_address: string | null;
  country_code: string;
  latitude: string | null;
  longitude: string | null;
  place_id: string;
  place_provider: string;
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
  formatted_address?: string;
  country_code?: string;
  latitude?: string | null;
  longitude?: string | null;
  place_id?: string;
  place_provider?: string;
  phone_number?: string;
  is_active?: boolean;
};
