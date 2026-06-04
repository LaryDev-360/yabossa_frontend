import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import { canManageCatalog } from "../../auth/roles";
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
import { deleteCategory, listCategories } from "../../features/catalog/api";
import CategoryFormModal from "../../features/catalog/components/CategoryFormModal";
import type { Category } from "../../features/catalog/types";
import { formatDate } from "../../features/shared/format";
import { useConfirm } from "../../context/ConfirmContext";
import { useTranslation } from "../../i18n/I18nContext";
import { PencilIcon, PlusIcon, TrashBinIcon } from "../../icons";

export default function CategoriesPage() {
  const { t, locale } = useTranslation();
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setCategories(await listCategories());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("categories.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function openCreate() {
    setEditingCategory(null);
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setModalOpen(true);
  }

  async function handleDelete(category: Category) {
    const ok = await confirm({
      message: t("categories.deleteConfirm", { name: category.name }),
      variant: "danger",
    });
    if (!ok) {
      return;
    }
    try {
      await deleteCategory(category.id);
      await loadCategories();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : t("categories.deleteError"));
    }
  }

  return (
    <>
      <PageMeta title={t("categories.pageTitle")} description={t("categories.pageDescription")} />
      <PageBreadcrumb pageTitle={t("categories.title")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("categories.subtitle")}</p>
          {canWrite && (
            <Button size="sm" onClick={openCreate}>
              <PlusIcon className="size-4 mr-1.5" />
              {t("categories.addCategory")}
            </Button>
          )}
        </div>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("categories.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : categories.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("categories.empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("categories.name")}</TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("categories.description")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.date}>
                    {t("categories.created")}
                  </TableCell>
                  {canWrite && (
                    <TableCell isHeader className={tableCol.actions}>
                      {t("common.actions")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className={tableCol.primary}>{category.name}</TableCell>
                    <TableCell className={tableCol.muted}>{category.description || "—"}</TableCell>
                    <TableCell className={`${tableCol.date} ${tableCol.muted}`}>
                      {formatDate(category.created_at, locale)}
                    </TableCell>
                    {canWrite && (
                      <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(category)}
                            className="p-1.5 text-gray-500 hover:text-brand-500"
                            aria-label={t("categories.editCategory")}
                          >
                            <PencilIcon className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(category)}
                            className="p-1.5 text-gray-500 hover:text-error-500"
                            aria-label={t("categories.deleteCategory")}
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

      {canWrite && (
        <CategoryFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          category={editingCategory}
          onSaved={loadCategories}
        />
      )}
    </>
  );
}
