import { useAuth } from "../../auth/AuthContext";
import { useSubscription } from "../../context/SubscriptionContext";
import { useTranslation } from "../../i18n/I18nContext";
import Alert from "../ui/alert/Alert";

export default function SubscriptionBanner() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { subscription, blockedByMutation } = useSubscription();

  const showBanner =
    blockedByMutation ||
    (user?.role === "MERCHANT" && subscription && !subscription.is_operational);

  if (!showBanner) {
    return null;
  }

  const message =
    user?.role === "CASHIER"
      ? t("subscription.bannerCashier")
      : t("subscription.bannerMerchant");

  return (
    <div className="mb-5">
      <Alert
        variant="warning"
        title={t("subscription.bannerTitle")}
        message={message}
        showLink={user?.role === "MERCHANT"}
        linkHref="/subscription"
        linkText={t("subscription.viewBilling")}
      />
    </div>
  );
}
