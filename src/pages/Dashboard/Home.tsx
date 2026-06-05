import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import PageMeta from "../../components/common/PageMeta";
import DatePicker from "../../components/form/date-picker";
import Label from "../../components/form/Label";
import Alert from "../../components/ui/alert/Alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { tableCol } from "../../components/ui/table/tableClasses";
import { defaultDashboardPeriod, getDashboardSummary } from "../../features/dashboard/api";
import DashboardKpiCard from "../../features/dashboard/components/DashboardKpiCard";
import TopProductsChart from "../../features/dashboard/components/TopProductsChart";
import type { DashboardSummary } from "../../features/dashboard/types";
import { formatDate, formatMoney } from "../../features/shared/format";
import { listShops } from "../../features/shops/api";
import type { Shop } from "../../features/shops/types";
import { useTranslation } from "../../i18n/I18nContext";
import {
  AlertHexaIcon,
  BoxCubeIcon,
  DollarLineIcon,
  GroupIcon,
  ShootingStarIcon,
} from "../../icons";

export default function Home() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const defaults = useMemo(() => defaultDashboardPeriod(), []);

  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [shopId, setShopId] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cashierShopId = user?.role === "CASHIER" ? user.cashier?.shop_id : null;
  const showShopFilter = user?.role !== "CASHIER" && shops.length > 1;

  const loadShops = useCallback(async () => {
    if (user?.role === "CASHIER") {
      return;
    }
    try {
      const data = await listShops();
      setShops(data);
    } catch {
      setShops([]);
    }
  }, [user?.role]);

  const loadSummary = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const effectiveShopId = cashierShopId ?? (shopId || undefined);
      const data = await getDashboardSummary({
        from,
        to,
        shop_id: effectiveShopId,
      });
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setError(err instanceof ApiError ? err.message : t("dashboard.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [from, to, shopId, cashierShopId, t]);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  function handlePeriodChange(selectedDates: Date[]) {
    if (selectedDates.length >= 2) {
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      setFrom(fmt(selectedDates[0]));
      setTo(fmt(selectedDates[1]));
    }
  }

  const periodLabel =
    summary &&
    t("dashboard.periodLabel", {
      from: formatDate(summary.period.from, locale),
      to: formatDate(summary.period.to, locale),
    });

  return (
    <>
      <PageMeta title={t("dashboard.pageTitle")} description={t("dashboard.pageDescription")} />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            {t("nav.dashboard")}
          </h1>
          {periodLabel && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{periodLabel}</p>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[240px]">
            <DatePicker
              id="dashboard-period"
              mode="range"
              label={t("dashboard.dateRange")}
              placeholder={t("dashboard.dateRangePlaceholder")}
              defaultDate={[from, to]}
              onChange={handlePeriodChange}
            />
          </div>
          {showShopFilter && (
            <div className="min-w-[200px]">
              <Label>{t("dashboard.shopFilter")}</Label>
              <select
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">{t("dashboard.allShops")}</option>
                {shops.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("dashboard.loadErrorTitle")} message={error} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      ) : summary ? (
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 md:gap-6">
            <DashboardKpiCard
              label={t("dashboard.saleCount")}
              value={String(summary.sales.sale_count)}
              icon={<GroupIcon className="size-6 text-gray-800 dark:text-white/90" />}
            />
            <DashboardKpiCard
              label={t("dashboard.revenue")}
              value={formatMoney(summary.sales.revenue_total, locale)}
              icon={<DollarLineIcon className="size-6 text-gray-800 dark:text-white/90" />}
            />
            <DashboardKpiCard
              label={t("dashboard.profit")}
              value={formatMoney(summary.sales.profit_total, locale)}
              icon={<ShootingStarIcon className="size-6 text-gray-800 dark:text-white/90" />}
            />
            <DashboardKpiCard
              label={t("dashboard.openAlerts")}
              value={String(summary.low_stock.open_alerts_count)}
              icon={<AlertHexaIcon className="size-6 text-gray-800 dark:text-white/90" />}
              footer={
                <Link to="/stock/alerts" className="text-sm text-brand-500 hover:underline">
                  {t("dashboard.viewAlerts")}
                </Link>
              }
            />
            <DashboardKpiCard
              label={t("dashboard.lowStockLines")}
              value={String(summary.low_stock.stock_lines_at_or_below_threshold)}
              icon={<BoxCubeIcon className="size-6 text-gray-800 dark:text-white/90" />}
            />
          </div>

          <div className="col-span-12 xl:col-span-7">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("dashboard.topProducts")}
              </h3>
              <TopProductsChart products={summary.top_products} locale={locale} />
            </div>
          </div>

          <div className="col-span-12 xl:col-span-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("dashboard.topProductsTable")}
              </h3>
              {summary.top_products.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("dashboard.noTopProducts")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader>{t("dashboard.product")}</TableCell>
                        <TableCell isHeader className={tableCol.muted}>
                          {t("dashboard.qtySold")}
                        </TableCell>
                        <TableCell isHeader className={tableCol.muted}>
                          {t("dashboard.revenue")}
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {summary.top_products.map((row) => (
                        <TableRow key={row.product_id}>
                          <TableCell className={tableCol.primary}>{row.product_name}</TableCell>
                          <TableCell className={tableCol.muted}>{row.quantity_sold}</TableCell>
                          <TableCell className={tableCol.muted}>
                            {formatMoney(row.revenue, locale)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
