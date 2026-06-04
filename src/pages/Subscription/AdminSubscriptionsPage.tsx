import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { tableCol } from "../../components/ui/table/tableClasses";
import SubscriptionEditModal from "../../features/subscriptions/components/SubscriptionEditModal";
import { listSubscriptions } from "../../features/subscriptions/api";
import { subscriptionStatusBadgeColor } from "../../features/subscriptions/statusBadge";
import type { Subscription } from "../../features/subscriptions/types";
import { formatDate, formatMoney } from "../../features/shared/format";
import { useTranslation } from "../../i18n/I18nContext";
import { PencilIcon } from "../../icons";

export default function AdminSubscriptionsPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      setSubscriptions(await listSubscriptions());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("subscription.adminLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (user?.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  function openEdit(sub: Subscription) {
    setEditing(sub);
    setModalOpen(true);
  }

  return (
    <>
      <PageMeta
        title={t("subscription.adminPageTitle")}
        description={t("subscription.pageDescription")}
      />
      <PageBreadcrumb pageTitle={t("subscription.adminTitle")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          {t("subscription.adminSubtitle")}
        </p>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("subscription.loadErrorTitle")} message={error} />
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : subscriptions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("subscription.adminEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader>{t("subscription.merchant")}</TableCell>
                  <TableCell isHeader className={tableCol.status}>
                    {t("subscription.statusLabel")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("subscription.operational")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("subscription.monthlyPrice")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.muted}>
                    {t("subscription.trialEnd")}
                  </TableCell>
                  <TableCell isHeader className={tableCol.actions}>
                    {t("common.actions")}
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className={tableCol.primary}>{sub.merchant_email}</TableCell>
                    <TableCell className={tableCol.status}>
                      <Badge size="sm" color={subscriptionStatusBadgeColor(sub.status)}>
                        {t(`subscription.status.${sub.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      <Badge size="sm" color={sub.is_operational ? "success" : "warning"}>
                        {sub.is_operational
                          ? t("subscription.operational")
                          : t("subscription.notOperational")}
                      </Badge>
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      {formatMoney(sub.monthly_price, locale)}
                    </TableCell>
                    <TableCell className={tableCol.muted}>
                      {sub.trial_end_date ? formatDate(sub.trial_end_date, locale) : "—"}
                    </TableCell>
                    <TableCell className={`${tableCol.actions} ${tableCol.actionsCell}`}>
                      <button
                        type="button"
                        onClick={() => openEdit(sub)}
                        className="p-1.5 text-gray-500 hover:text-brand-500"
                        aria-label={t("subscription.adminEdit")}
                      >
                        <PencilIcon className="size-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <SubscriptionEditModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subscription={editing}
        onSaved={loadData}
      />
    </>
  );
}
