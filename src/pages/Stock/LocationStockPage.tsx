import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
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
import type { Product } from "../../features/catalog/types";
import { formatDate } from "../../features/shared/format";
import { deleteLocationStock, listLocationStock } from "../../features/stock/api";
import StockLineFormModal from "../../features/stock/components/StockLineFormModal";
import { isLowStock, type LocationStock } from "../../features/stock/types";
import { getShop, listLocations } from "../../features/shops/api";
import type { Location, Shop } from "../../features/shops/types";
import { useConfirm } from "../../context/ConfirmContext";
import { useTranslation } from "../../i18n/I18nContext";
import { ChevronLeftIcon, PencilIcon, PlusIcon, TrashBinIcon } from "../../icons";

export default function LocationStockPage() {
  const { shopId = "", locationId = "" } = useParams();
  const { t, locale } = useTranslation();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);

  const [shop, setShop] = useState<Shop | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [stockLines, setStockLines] = useState<LocationStock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<LocationStock | null>(null);

  const productNames = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name])),
    [products],
  );

  const shopProducts = useMemo(
    () => products.filter((p) => p.shop === shopId && !p.is_archived),
    [products, shopId],
  );

  const existingProductIds = useMemo(
    () => new Set(stockLines.map((line) => line.product)),
    [stockLines],
  );

  const loadData = useCallback(async () => {
    if (!shopId || !locationId) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const [shopData, locations, lines, productData] = await Promise.all([
        getShop(shopId),
        listLocations(shopId),
        listLocationStock(locationId),
        listProducts(),
      ]);
      setShop(shopData);
      setLocation(locations.find((loc) => loc.id === locationId) ?? null);
      setStockLines(lines);
      setProducts(productData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("stock.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [shopId, locationId, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openCreate() {
    setEditingLine(null);
    setModalOpen(true);
  }

  function openEdit(line: LocationStock) {
    setEditingLine(line);
    setModalOpen(true);
  }

  async function handleDelete(line: LocationStock) {
    const name = productNames[line.product] ?? t("stock.product");
    const ok = await confirm({
      message: t("stock.deleteConfirm", { name }),
      variant: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await deleteLocationStock(locationId, line.id);
      await loadData();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : t("stock.deleteError"));
    }
  }

  const pageTitle =
    shop && location
      ? t("stock.titleForLocation", { shop: shop.name, location: location.name })
      : t("stock.title");

  return (
    <>
      <PageMeta title={t("stock.pageTitle")} description={t("stock.pageDescription")} />

      <div className="mb-4">
        <Link
          to={`/shops?shop=${shopId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5 mr-1" />
          {t("stock.backToLocations")}
        </Link>
      </div>

      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("stock.subtitle")}</p>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 mr-1.5" />
              {t("stock.addLine")}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("stock.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : stockLines.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("stock.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("stock.product")}</TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("stock.quantity")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("stock.lowStockThreshold")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.status}>
                    {t("stock.status")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.date}>
                    {t("stock.updated")}
                  </TableCell>
                  {canWrite && (
                    <TableCell isHeader className={tableCol.actions}>
                      {t("common.actions")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {stockLines.map((line) => {
                  const low = isLowStock(line);
                  return (
                    <TableRow key={line.id}>
                      <TableCell className={tableCol.primary}>
                        {productNames[line.product] ?? "—"}
                      </TableCell>
                      <TableCell className={tableCol.muted}>{line.quantity}</TableCell>
                      <TableCell className={tableCol.muted}>{line.low_stock_threshold}</TableCell>
                      <TableCell className={tableCol.status}>
                        {low ? (
                          <Badge size="sm" color="warning">
                            {t("stock.lowStock")}
                          </Badge>
                        ) : (
                          <Badge size="sm" color="success">
                            {t("stock.inStock")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className={`${tableCol.date} ${tableCol.muted}`}>
                        {formatDate(line.updated_at, locale)}
                      </TableCell>
                      {canWrite && (
                        <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(line)}
                              className="p-1.5 text-gray-500 hover:text-brand-500"
                              aria-label={t("stock.editLine")}
                            >
                              <PencilIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(line)}
                              className="p-1.5 text-gray-500 hover:text-error-500"
                              aria-label={t("stock.deleteLine")}
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </div>
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

      {canWrite && locationId && (
        <StockLineFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          locationId={locationId}
          stockLine={editingLine}
          products={shopProducts}
          existingProductIds={existingProductIds}
          onSaved={loadData}
        />
      )}
    </>
  );
}
