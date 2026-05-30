import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/I18nContext";
import ProfileOverviewCard from "../features/profile/components/ProfileOverviewCard";
import ProfileEditForm from "../features/profile/components/ProfileEditForm";
import ChangePasswordForm from "../features/profile/components/ChangePasswordForm";

export default function UserProfiles() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title={t("profile.pageTitle")} description={t("profile.pageDescription")} />
      <PageBreadcrumb pageTitle={t("profile.breadcrumb")} />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          {t("profile.title")}
        </h3>
        <div className="space-y-6">
          <ProfileOverviewCard user={user} />
          <ProfileEditForm user={user} />
          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}
