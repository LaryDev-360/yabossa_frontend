export type UserRole = "MERCHANT" | "ADMIN" | "CASHIER";

export interface MeMerchant {
  business_name: string;
  phone_number: string | null;
  currency_code: string;
}

export interface MeCashier {
  phone_number: string | null;
  shop_id: string;
  shop_name: string;
}

export interface MeAdmin {
  is_super_admin: boolean;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  currency_code: string;
  merchant: MeMerchant | null;
  cashier: MeCashier | null;
  admin: MeAdmin | null;
}

export interface AuthTokensResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterMerchantPayload {
  email: string;
  password: string;
  password_confirm: string;
  full_name: string;
  business_name: string;
  phone_number?: string;
}
