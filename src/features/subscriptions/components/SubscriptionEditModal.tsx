import { FormEvent, useEffect, useState } from "react";
import { ApiError, getFieldError } from "../../../api/errors";
import { useTranslation } from "../../../i18n/I18nContext";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";
import { updateSubscription } from "../api";
import type { Subscription, SubscriptionStatus } from "../types";

const STATUSES: SubscriptionStatus[] = [
  "TRIAL",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "EXPIRED",
];

interface SubscriptionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscription: Subscription | null;
  onSaved: () => void;
}

export default function SubscriptionEditModal({
  isOpen,
  onClose,
  subscription,
  onSaved,
}: SubscriptionEditModalProps) {
  const { t } = useTranslation();

  const [status, setStatus] = useState<SubscriptionStatus>("TRIAL");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [trialStart, setTrialStart] = useState("");
  const [trialEnd, setTrialEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !subscription) {
      return;
    }
    setStatus(subscription.status);
    setMonthlyPrice(subscription.monthly_price ?? "");
    setTrialStart(subscription.trial_start_date ?? "");
    setTrialEnd(subscription.trial_end_date ?? "");
    setStartDate(subscription.start_date ?? "");
    setEndDate(subscription.end_date ?? "");
    setError(null);
    setFieldErrors({});
  }, [isOpen, subscription]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subscription) {
      return;
    }
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await updateSubscription(subscription.id, {
        status,
        monthly_price: monthlyPrice.trim() || null,
        trial_start_date: trialStart || null,
        trial_end_date: trialEnd || null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        const next: Record<string, string> = {};
        for (const key of Object.keys(err.fieldErrors)) {
          const msg = getFieldError(err.fieldErrors, key);
          if (msg) {
            next[key] = msg;
          }
        }
        setFieldErrors(next);
      } else {
        setError(t("subscription.adminSaveError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!subscription) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6 lg:p-8">
        <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {t("subscription.adminEditTitle", { email: subscription.merchant_email })}
        </h3>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("subscription.formErrorTitle")} message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("subscription.statusLabel")}</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
              disabled={isSubmitting}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`subscription.status.${s}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>{t("subscription.monthlyPrice")}</Label>
            <Input
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.monthly_price)}
              hint={fieldErrors.monthly_price}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t("subscription.trialStart")}</Label>
              <Input
                type="date"
                value={trialStart}
                onChange={(e) => setTrialStart(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label>{t("subscription.trialEnd")}</Label>
              <Input
                type="date"
                value={trialEnd}
                onChange={(e) => setTrialEnd(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label>{t("subscription.periodStart")}</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label>{t("subscription.periodEnd")}</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
