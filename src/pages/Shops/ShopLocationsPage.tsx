import { useCallback, useEffect, useState } from "react";
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
import { deleteLocation, getShop, listLocations } from "../../features/shops/api";
import LocationFormModal from "../../features/shops/components/LocationFormModal";
import type { Location, Shop } from "../../features/shops/types";
import { formatDate } from "../../features/shared/format";
import { useTranslation } from "../../i18n/I18nContext";
import { ChevronLeftIcon, PencilIcon, PlusIcon, TrashBinIcon } from "../../icons";

export default function ShopLocationsPage() {
  const { shopId = "" } = useParams();
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);

  const [shop, setShop] = useState<Shop | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const loadData = useCallback(async () => {
    if (!shopId) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const [shopData, locationData] = await Promise.all([
        getShop(shopId),
        listLocations(shopId),
      ]);
      setShop(shopData);
      setLocations(locationData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("locations.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [shopId, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function openCreate() {
    setEditingLocation(null);
    setModalOpen(true);
  }

  function openEdit(location: Location) {
    setEditingLocation(location);
    setModalOpen(true);
  }

  async function handleDelete(location: Location) {
    if (!window.confirm(t("locations.deleteConfirm", { name: location.name }))) {
      return;
    }
    try {
      await deleteLocation(shopId, location.id);
      await loadData();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : t("locations.deleteError"));
    }
  }

  const pageTitle = shop ? t("locations.titleForShop", { shop: shop.name }) : t("locations.title");

  return (
    <>
      <PageMeta title={t("locations.pageTitle")} description={t("locations.pageDescription")} />

      <div className="mb-4">
        <Link
          to="/shops"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5 mr-1" />
          {t("locations.backToShops")}
        </Link>
      </div>

      <PageBreadcrumb pageTitle={pageTitle} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("locations.subtitle")}</p>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 mr-1.5" />
              {t("locations.addLocation")}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("locations.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : locations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("locations.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("locations.name")}</TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("locations.address")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("locations.city")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("locations.phone")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.status}>
                    {t("locations.status")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.date}>
                    {t("locations.created")}
                  </TableCell>
                  {canWrite && (
                    <TableCell isHeader className={tableCol.actions}>
                      {t("common.actions")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className={tableCol.primary}>{location.name}</TableCell>
                    <TableCell className={tableCol.muted}>
                      {location.formatted_address || location.address || "—"}
                    </TableCell>
                    <TableCell className={tableCol.muted}>{location.city || "—"}</TableCell>
                    <TableCell className={tableCol.muted}>{location.phone_number || "—"}</TableCell>
                    <TableCell className={tableCol.status}>
                      <Badge size="sm" color={location.is_active ? "success" : "light"}>
                        {location.is_active ? t("locations.active") : t("locations.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className={`${tableCol.date} ${tableCol.muted}`}>
                      {formatDate(location.created_at, locale)}
                    </TableCell>
                    {canWrite && (
                      <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(location)}
                            className="p-1.5 text-gray-500 hover:text-brand-500"
                            aria-label={t("locations.editLocation")}
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(location)}
                            className="p-1.5 text-gray-500 hover:text-error-500"
                            aria-label={t("locations.deleteLocation")}
                          >
                            <TrashBinIcon className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {canWrite && shopId && (
        <LocationFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shopId={shopId}
          location={editingLocation}
          onSaved={loadData}
        />
      )}
    </>
  );
}
