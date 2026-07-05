import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/errors";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { tableCol } from "../../components/ui/table/tableClasses";
import { loadLocationOptions, listSales } from "../../features/sales/api";
import type { Sale } from "../../features/sales/types";
import { formatDateTime } from "../../features/shared/format";
import { useFormatMoney } from "../../features/shared/useFormatMoney";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "../../i18n/I18nContext";
import { PlusIcon } from "../../icons";

export default function SalesListPage() {
  const { t, locale } = useTranslation();
  const formatMoney = useFormatMoney();
  const { user } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [locationLabels, setLocationLabels] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [saleData, locations] = await Promise.all([
        listSales(),
        loadLocationOptions(user?.role, user?.cashier?.shop_id),
      ]);
      setSales(saleData);
      setLocationLabels(
        Object.fromEntries(locations.map((loc) => [loc.id, `${loc.name} (${loc.shopName})`])),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("sales.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t, user?.role, user?.cashier?.shop_id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const sortedSales = useMemo(
    () => [...sales].sort((a, b) => b.sold_at.localeCompare(a.sold_at)),
    [sales],
  );

  return (
    <>
      <PageMeta title={t("sales.pageTitle")} description={t("sales.pageDescription")} />
      <PageBreadcrumb pageTitle={t("sales.title")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("sales.subtitle")}</p>
          <Link to="/sales/new">
            <Button size="sm">
              <PlusIcon className="size-4 mr-1.5" />
              {t("sales.newSale")}
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("sales.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : sortedSales.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("sales.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("sales.reference")}</TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("sales.location")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("sales.soldAt")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("sales.total")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("sales.profit")}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {sortedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className={tableCol.primary}>
                      <Link to={`/sales/${sale.id}`} className="text-brand-500 hover:underline">
                        {sale.reference}
                      </Link>
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      {locationLabels[sale.location] ?? "—"}
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      {formatDateTime(sale.sold_at, locale)}
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      {formatMoney(sale.total_amount)}
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      {formatMoney(sale.estimated_profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
