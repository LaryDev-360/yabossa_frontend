export interface DashboardPeriod {
  from: string;
  to: string;
}

export interface DashboardSales {
  sale_count: number;
  revenue_total: string;
  profit_total: string | null;
}

export interface DashboardLowStock {
  open_alerts_count: number;
  stock_lines_at_or_below_threshold: number;
}

export interface DashboardTopProduct {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: string;
}

export interface DashboardSummary {
  period: DashboardPeriod;
  sales: DashboardSales;
  low_stock: DashboardLowStock;
  top_products: DashboardTopProduct[];
}

export interface DashboardSummaryParams {
  from?: string;
  to?: string;
  shop_id?: string;
  merchant_id?: string;
}
