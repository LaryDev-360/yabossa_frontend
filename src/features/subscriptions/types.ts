export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "EXPIRED";

export interface Subscription {
  id: string;
  merchant: string;
  merchant_email: string;
  status: SubscriptionStatus;
  monthly_price: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  start_date: string | null;
  end_date: string | null;
  activated_at: string | null;
  deactivated_at: string | null;
  is_operational: boolean;
}

export type SubscriptionAdminUpdatePayload = {
  status?: SubscriptionStatus;
  monthly_price?: string | null;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  activated_at?: string | null;
  deactivated_at?: string | null;
};
