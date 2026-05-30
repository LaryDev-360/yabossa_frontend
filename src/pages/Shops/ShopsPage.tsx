import { useCallback, useEffect, useState } from "react";
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
import { deleteShop, listShops } from "../../features/shops/api";
import ShopFormModal from "../../features/shops/components/ShopFormModal";
import type { Shop } from "../../features/shops/types";
import { formatDate } from "../../features/shared/format";
import { useTranslation } from "../../i18n/I18nContext";
import { PencilIcon, PlusIcon, TrashBinIcon } from "../../icons";

export default function ShopsPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);

  const loadShops = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setShops(await listShops());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("shops.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadShops();
  }, [loadShops]);

  function openCreate() {
    setEditingShop(null);
    setModalOpen(true);
  }

  function openEdit(shop: Shop) {
    setEditingShop(shop);
    setModalOpen(true);
  }

  async function handleDelete(shop: Shop) {
    if (!window.confirm(t("shops.deleteConfirm", { name: shop.name }))) {
      return;
    }
    try {
      await deleteShop(shop.id);
      await loadShops();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 409
            ? err.message
            : err.message
          : t("shops.deleteError");
      window.alert(message);
    }
  }

  return (
    <>
      <PageMeta title={t("shops.pageTitle")} description={t("shops.pageDescription")} />
      <PageBreadcrumb pageTitle={t("shops.title")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("shops.subtitle")}</p>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 mr-1.5" />
              {t("shops.addShop")}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("shops.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : shops.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("shops.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("shops.name")}</TableCell>
                  {user?.role === "ADMIN" && (
                    <TableCell isHeader className={tableCol.mono}>
                      {t("shops.merchantId")}
                    </TableCell>
                  )}
                  <TableCell isHeader className={tableCol.status}>
                    {t("shops.status")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.date}>
                    {t("shops.created")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.actions}>
                    {t("common.actions")}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {shops.map((shop) => (
                  <TableRow key={shop.id}>
                    <TableCell className={tableCol.primary}>{shop.name}</TableCell>
                    {user?.role === "ADMIN" && (
                      <TableCell className={tableCol.mono}>{shop.merchant}</TableCell>
                    )}
                    <TableCell className={tableCol.status}>
                      <Badge size="sm" color={shop.is_active ? "success" : "light"}>
                        {shop.is_active ? t("shops.active") : t("shops.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className={`${tableCol.date} ${tableCol.muted}`}>
                      {formatDate(shop.created_at, locale)}
                    </TableCell>
                    <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/shops/${shop.id}/locations`}
                          className="text-sm font-medium text-brand-500 hover:text-brand-600"
                        >
                          {t("shops.viewLocations")}
                        </Link>
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(shop)}
                              className="p-1.5 text-gray-500 hover:text-brand-500"
                              aria-label={t("shops.editShop")}
                            >
                              <PencilIcon className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDelete(shop)}
                              className="p-1.5 text-gray-500 hover:text-error-500"
                              aria-label={t("shops.deleteShop")}
                            >
                              <TrashBinIcon className="size-4" />
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

      {canWrite && (
        <ShopFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shop={editingShop}
          isAdmin={user?.role === "ADMIN"}
          onSaved={loadShops}
        />
      )}
    </>
  );
}
