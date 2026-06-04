import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
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
import ShopLocationsPanel from "../../features/shops/components/ShopLocationsPanel";
import type { Shop } from "../../features/shops/types";
import { formatDate } from "../../features/shared/format";
import { useConfirm } from "../../context/ConfirmContext";
import { useTranslation } from "../../i18n/I18nContext";
import { AngleDownIcon, AngleUpIcon, PencilIcon, PlusIcon, TrashBinIcon } from "../../icons";

export default function ShopsPage() {
  const { t, locale } = useTranslation();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);
  const [searchParams, setSearchParams] = useSearchParams();

  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  const shopFromUrl = searchParams.get("shop");

  useEffect(() => {
    setSelectedShopId(shopFromUrl);
  }, [shopFromUrl]);

  const locationColSpan = useMemo(() => {
    let cols = 4; // chevron, name, status, created
    if (user?.role === "ADMIN") {
      cols += 1;
    }
    if (canWrite) {
      cols += 1;
    }
    return cols;
  }, [user?.role, canWrite]);

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

  function selectShop(shopId: string) {
    const next = selectedShopId === shopId ? null : shopId;
    setSelectedShopId(next);
    if (next) {
      setSearchParams({ shop: next }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }

  function openCreate() {
    setEditingShop(null);
    setModalOpen(true);
  }

  function openEdit(shop: Shop, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingShop(shop);
    setModalOpen(true);
  }

  async function handleDelete(shop: Shop, e: React.MouseEvent) {
    e.stopPropagation();
    const ok = await confirm({
      message: t("shops.deleteConfirm", { name: shop.name }),
      variant: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await deleteShop(shop.id);
      if (selectedShopId === shop.id) {
        setSearchParams({}, { replace: true });
      }
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
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("shops.subtitleExpand")}</p>
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
                  <TableCell isHeader className="w-10" />
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
                  {canWrite && (
                    <TableCell isHeader className={tableCol.actions}>
                      {t("common.actions")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {shops.map((shop) => {
                  const isSelected = selectedShopId === shop.id;
                  return (
                    <Fragment key={shop.id}>
                      <TableRow
                        onClick={() => selectShop(shop.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-brand-50/80 dark:bg-brand-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                        }`}
                      >
                        <TableCell className="w-10 text-gray-400">
                          {isSelected ? (
                            <AngleUpIcon className="size-4" />
                          ) : (
                            <AngleDownIcon className="size-4" />
                          )}
                        </TableCell>
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
                        {canWrite && (
                          <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(e) => openEdit(shop, e)}
                                className="p-1.5 text-gray-500 hover:text-brand-500"
                                aria-label={t("shops.editShop")}
                              >
                                <PencilIcon className="size-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => void handleDelete(shop, e)}
                                className="p-1.5 text-gray-500 hover:text-error-500"
                                aria-label={t("shops.deleteShop")}
                              >
                                <TrashBinIcon className="size-4" />
                              </button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                      {isSelected && (
                        <TableRow>
                          <TableCell colSpan={locationColSpan} className="!p-0 border-0">
                            <ShopLocationsPanel
                              shopId={shop.id}
                              shopName={shop.name}
                              role={user?.role}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
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
