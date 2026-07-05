import { useEffect } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../auth/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Badge from "../../components/ui/badge/Badge";
import { useSubscription } from "../../context/SubscriptionContext";
import { subscriptionStatusBadgeColor } from "../../features/subscriptions/statusBadge";
import { formatDate } from "../../features/shared/format";
import { useFormatMoney } from "../../features/shared/useFormatMoney";
import { useTranslation } from "../../i18n/I18nContext";

export default function SubscriptionPage() {
  const { t, locale } = useTranslation();
  const formatMoney = useFormatMoney();
  const { user } = useAuth();
  const { subscription, isLoading, refresh } = useSubscription();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (user?.role !== "MERCHANT") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <PageMeta
        title={t("subscription.pageTitle")}
        description={t("subscription.pageDescription")}
      />
      <PageBreadcrumb pageTitle={t("subscription.title")} />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{t("subscription.subtitle")}</p>

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
        ) : !subscription ? (
          <Alert variant="error" title={t("subscription.loadErrorTitle")} message={t("subscription.notFound")} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge size="md" color={subscriptionStatusBadgeColor(subscription.status)}>
                {t(`subscription.status.${subscription.status}`)}
              </Badge>
              <Badge size="md" color={subscription.is_operational ? "success" : "warning"}>
                {subscription.is_operational
                  ? t("subscription.operational")
                  : t("subscription.notOperational")}
              </Badge>
            </div>

            {!subscription.is_operational && (
              <Alert
                variant="warning"
                title={t("subscription.inactiveTitle")}
                message={t("subscription.inactiveMessage")}
              />
            )}

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t("subscription.monthlyPrice")}
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatMoney(subscription.monthly_price)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t("subscription.trialStart")}
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {subscription.trial_start_date
                    ? formatDate(subscription.trial_start_date, locale)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t("subscription.trialEnd")}
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {subscription.trial_end_date
                    ? formatDate(subscription.trial_end_date, locale)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t("subscription.periodStart")}
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {subscription.start_date ? formatDate(subscription.start_date, locale) : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500 dark:text-gray-400">
                  {t("subscription.periodEnd")}
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {subscription.end_date ? formatDate(subscription.end_date, locale) : "—"}
                </dd>
              </div>
            </dl>

            <p className="text-sm text-gray-500 dark:text-gray-400">{t("subscription.supportCta")}</p>
          </div>
        )}
      </div>
    </>
  );
}
