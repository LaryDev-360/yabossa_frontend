import { useCallback, useEffect, useMemo, useState } from "react";
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
import { listCategories, listProducts, updateProduct } from "../../features/catalog/api";
import ProductFormModal from "../../features/catalog/components/ProductFormModal";
import type { Category, Product } from "../../features/catalog/types";
import { formatMoney } from "../../features/shared/format";
import { listShops } from "../../features/shops/api";
import type { Shop } from "../../features/shops/types";
import { useTranslation } from "../../i18n/I18nContext";
import { PencilIcon, PlusIcon } from "../../icons";

export default function ProductsPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);

  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const shopNames = useMemo(
    () => Object.fromEntries(shops.map((s) => [s.id, s.name])),
    [shops],
  );
  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const visibleProducts = useMemo(
    () => (showArchived ? products : products.filter((p) => !p.is_archived)),
    [products, showArchived],
  );

  const loadData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const [productData, shopData, categoryData] = await Promise.all([
        listProducts(),
        listShops(),
        listCategories(),
      ]);
      setProducts(productData);
      setShops(shopData);
      setCategories(categoryData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openCreate() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function toggleArchive(product: Product) {
    const nextArchived = !product.is_archived;
    const confirmKey = nextArchived ? "products.archiveConfirm" : "products.unarchiveConfirm";
    if (!window.confirm(t(confirmKey, { name: product.name }))) {
      return;
    }
    try {
      await updateProduct(product.id, { is_archived: nextArchived });
      await loadData();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : t("products.archiveError"));
    }
  }

  return (
    <>
      <PageMeta title={t("products.pageTitle")} description={t("products.pageDescription")} />
      <PageBreadcrumb pageTitle={t("products.title")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("products.subtitle")}</p>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              {t("products.showArchived")}
            </label>
          </div>
          {canWrite && shops.length > 0 && (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 mr-1.5" />
              {t("products.addProduct")}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("products.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : visibleProducts.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("products.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("products.name")}</TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("products.shop")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("products.category")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.status}>
                    {t("products.salePrice")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.status}>
                    {t("products.status")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.actions}>
                    {t("common.actions")}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {visibleProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className={tableCol.primary}>{product.name}</TableCell>
                    <TableCell className={tableCol.muted}>
                      {shopNames[product.shop] ?? product.shop}
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      {product.category ? categoryNames[product.category] ?? "—" : "—"}
                    </TableCell>
                    <TableCell className={`${tableCol.status} ${tableCol.primary}`}>
                      {formatMoney(product.sale_price, locale)}
                    </TableCell>
                    <TableCell className={tableCol.status}>
                      {product.is_archived ? (
                        <Badge size="sm" color="light">
                          {t("products.archived")}
                        </Badge>
                      ) : (
                        <Badge size="sm" color="success">
                          {t("products.active")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              className="p-1.5 text-gray-500 hover:text-brand-500"
                              aria-label={t("products.editProduct")}
                            >
                              <PencilIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void toggleArchive(product)}
                              className="text-sm font-medium text-brand-500 hover:text-brand-600"
                            >
                              {product.is_archived
                                ? t("products.unarchive")
                                : t("products.archive")}
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {canWrite && shops.length > 0 && (
        <ProductFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          product={editingProduct}
          shops={shops}
          categories={categories}
          onSaved={loadData}
        />
      )}
    </>
  );
}
