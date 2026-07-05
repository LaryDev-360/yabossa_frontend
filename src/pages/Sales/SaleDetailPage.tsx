import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/errors";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { tableCol } from "../../components/ui/table/tableClasses";
import { getSale, loadLocationOptions } from "../../features/sales/api";
import type { Sale } from "../../features/sales/types";
import { formatDateTime } from "../../features/shared/format";
import { useFormatMoney } from "../../features/shared/useFormatMoney";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "../../i18n/I18nContext";
import { ChevronLeftIcon } from "../../icons";

export default function SaleDetailPage() {
  const { id = "" } = useParams();
  const { t, locale } = useTranslation();
  const formatMoney = useFormatMoney();
  const { user } = useAuth();

  const [sale, setSale] = useState<Sale | null>(null);
  const [locationLabel, setLocationLabel] = useState("—");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const [saleData, locations] = await Promise.all([
        getSale(id),
        loadLocationOptions(user?.role, user?.cashier?.shop_id),
      ]);
      setSale(saleData);
      const loc = locations.find((l) => l.id === saleData.location);
      setLocationLabel(loc ? `${loc.name} (${loc.shopName})` : "—");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("sales.detailLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [id, t, user?.role, user?.cashier?.shop_id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pageTitle = sale ? t("sales.detailTitle", { reference: sale.reference }) : t("sales.title");

  const itemCount = useMemo(
    () => sale?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [sale],
  );

  return (
    <>
      <PageMeta title={t("sales.detailPageTitle")} description={t("sales.pageDescription")} />

      <div className="mb-4">
        <Link
          to="/sales"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5 mr-1" />
          {t("sales.backToSales")}
        </Link>
      </div>

      <PageBreadcrumb pageTitle={pageTitle} />

      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("sales.loadErrorTitle")} message={error} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      ) : sale ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{t("sales.location")}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {locationLabel}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{t("sales.soldAt")}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDateTime(sale.sold_at, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{t("sales.total")}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatMoney(sale.total_amount)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">{t("sales.profit")}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatMoney(sale.estimated_profit)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {t("sales.itemCount", { count: itemCount })}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("sales.lineItems")}
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader>{t("sales.product")}</TableCell>
                    <TableCell isHeader className={tableCol.muted}>
                      {t("sales.quantity")}
                    </TableCell>
                    <TableCell isHeader className={tableCol.muted}>
                      {t("sales.unitPrice")}
                    </TableCell>
                    <TableCell isHeader className={tableCol.muted}>
                      {t("sales.lineTotal")}
                    </TableCell>
                    <TableCell isHeader className={tableCol.muted}>
                      {t("sales.lineProfit")}
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {sale.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className={tableCol.primary}>{item.product_name}</TableCell>
                      <TableCell className={tableCol.muted}>{item.quantity}</TableCell>
                      <TableCell className={tableCol.muted}>
                        {formatMoney(item.unit_sale_price)}
                      </TableCell>
                      <TableCell className={tableCol.muted}>
                        {formatMoney(item.line_total)}
                      </TableCell>
                      <TableCell className={tableCol.muted}>
                        {formatMoney(item.line_profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
