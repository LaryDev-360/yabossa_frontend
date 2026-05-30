import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthContext";
import { isEmailVerified } from "./emailVerification";
import { useTranslation } from "../i18n/I18nContext";

export default function GuestRoute() {
  const { t } = useTranslation();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (!isEmailVerified(user)) {
      return <Navigate to="/verify-email" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
