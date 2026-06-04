import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import { canManageCatalog } from "../../auth/roles";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { tableCol } from "../../components/ui/table/tableClasses";
import { listProducts } from "../../features/catalog/api";
import {
  buildLocationStockIndex,
  listStockAlerts,
  resolveStockAlert,
} from "../../features/stock/api";
import type { LocationStockContext, StockAlert } from "../../features/stock/types";
import { formatDate } from "../../features/shared/format";
import { useConfirm } from "../../context/ConfirmContext";
import { useTranslation } from "../../i18n/I18nContext";
import { CheckLineIcon } from "../../icons";

export default function StockAlertsPage() {
  const { t, locale } = useTranslation();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);

  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [stockIndex, setStockIndex] = useState<Map<string, LocationStockContext>>(new Map());
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [showResolved, setShowResolved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [alertData, index, products] = await Promise.all([
        listStockAlerts(showResolved ? undefined : "OPEN"),
        buildLocationStockIndex(),
        listProducts(),
      ]);
      setAlerts(alertData);
      setStockIndex(index);
      setProductNames(Object.fromEntries(products.map((p) => [p.id, p.name])));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("alerts.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [showResolved, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleAlerts = useMemo(() => {
    if (showResolved) {
      return alerts;
    }
    return alerts.filter((a) => a.status === "OPEN");
  }, [alerts, showResolved]);

  async function handleResolve(alert: StockAlert) {
    const ok = await confirm({ message: t("alerts.resolveConfirm") });
    if (!ok) {
      return;
    }
    setResolvingId(alert.id);
    try {
      await resolveStockAlert(alert.id);
      await loadData();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : t("alerts.resolveError"));
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <>
      <PageMeta title={t("alerts.pageTitle")} description={t("alerts.pageDescription")} />
      <PageBreadcrumb pageTitle={t("alerts.title")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("alerts.subtitle")}</p>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            {t("alerts.showResolved")}
          </label>
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("alerts.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : visibleAlerts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("alerts.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("alerts.product")}</TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("alerts.location")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("alerts.shop")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("alerts.quantity")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("alerts.threshold")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.status}>
                    {t("alerts.status")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.date}>
                    {t("alerts.triggered")}
                  </TableCell>
                  {canWrite && (
                    <TableCell isHeader className={tableCol.actions}>
                      {t("common.actions")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {visibleAlerts.map((alert) => {
                  const ctx = stockIndex.get(alert.location_stock);
                  const productName = ctx ? productNames[ctx.product] ?? "—" : "—";
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className={tableCol.primary}>
                        {ctx ? (
                          <Link
                            to={`/shops/${ctx.shopId}/locations/${ctx.location}/stock`}
                            className="text-brand-500 hover:underline"
                          >
                            {productName}
                          </Link>
                        ) : (
                          productName
                        )}
                      </TableCell>
                      <TableCell className={tableCol.muted}>
                        {ctx ? (
                          <Link
                            to={`/shops/${ctx.shopId}/locations/${ctx.location}/stock`}
                            className="hover:text-brand-500"
                          >
                            {ctx.locationName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className={tableCol.muted}>{ctx?.shopName ?? "—"}</TableCell>
                      <TableCell className={tableCol.muted}>{alert.current_stock}</TableCell>
                      <TableCell className={tableCol.muted}>{alert.threshold}</TableCell>
                      <TableCell className={tableCol.status}>
                        <Badge size="sm" color={alert.status === "OPEN" ? "warning" : "light"}>
                          {alert.status === "OPEN" ? t("alerts.open") : t("alerts.resolved")}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${tableCol.date} ${tableCol.muted}`}>
                        {formatDate(alert.triggered_at, locale)}
                      </TableCell>
                      {canWrite && (
                        <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                          {alert.status === "OPEN" && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={resolvingId === alert.id}
                              onClick={() => void handleResolve(alert)}
                            >
                              <CheckLineIcon className="size-4 mr-1" />
                              {resolvingId === alert.id ? t("alerts.resolving") : t("alerts.resolve")}
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
