import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { ApiError } from "../../../api/errors";
import { canManageCatalog } from "../../../auth/roles";
import Alert from "../../../components/ui/alert/Alert";
import Badge from "../../../components/ui/badge/Badge";
import Button from "../../../components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { tableCol } from "../../../components/ui/table/tableClasses";
import { useConfirm } from "../../../context/ConfirmContext";
import { useTranslation } from "../../../i18n/I18nContext";
import { BoxCubeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "../../../icons";
import type { UserRole } from "../../../api/types";
import { deleteLocation, listLocations } from "../api";
import LocationFormModal from "./LocationFormModal";
import type { Location } from "../types";

interface ShopLocationsPanelProps {
  shopId: string;
  shopName: string;
  role: UserRole | undefined;
}

export default function ShopLocationsPanel({ shopId, shopName, role }: ShopLocationsPanelProps) {
  const { t } = useTranslation();
  const { confirm } = useConfirm();
  const canWrite = canManageCatalog(role);

  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setLocations(await listLocations(shopId));
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
    const ok = await confirm({
      message: t("locations.deleteConfirm", { name: location.name }),
      variant: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await deleteLocation(shopId, location.id);
      await loadData();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : t("locations.deleteError"));
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-white/[0.02] lg:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {t("locations.titleForShop", { shop: shopName })}
        </h4>
        {canWrite && (
          <Button size="sm" onClick={openCreate}>
            <PlusIcon className="size-4 mr-1.5" />
            {t("locations.addLocation")}
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4">
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
                <TableCell isHeader className={tableCol.actions}>
                  {t("common.actions")}
                </TableCell>
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
                  <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      <Link
                        to={`/shops/${shopId}/locations/${location.id}/stock`}
                        className="inline-flex items-center gap-1 text-sm text-brand-500 hover:underline"
                      >
                        <BoxCubeIcon className="size-4" />
                        {t("locations.viewStock")}
                      </Link>
                      {canWrite && (
                        <>
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

      {canWrite && (
        <LocationFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          shopId={shopId}
          location={editingLocation}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
