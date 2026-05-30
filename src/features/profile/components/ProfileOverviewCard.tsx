import type { User, UserRole } from "../../../api/types";
import { useTranslation } from "../../../i18n/I18nContext";
import Badge from "../../../components/ui/badge/Badge";

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface ProfileOverviewCardProps {
  user: User;
}

export default function ProfileOverviewCard({ user }: ProfileOverviewCardProps) {
  const { t, locale } = useTranslation();
  const roleKey = `roles.${user.role as UserRole}`;

  return (
    <div className="flex flex-col gap-5 p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:flex-row lg:items-center lg:p-6">
      <div className="flex items-center justify-center w-20 h-20 overflow-hidden border border-gray-200 rounded-full shrink-0 dark:border-gray-800 bg-brand-500">
        <span className="text-2xl font-semibold text-white">
          {user.full_name.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
          {user.full_name}
        </h4>
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="light" color="primary">
            {t(roleKey)}
          </Badge>
          {user.email_verified_at ? (
            <Badge variant="light" color="success">
              {t("profile.emailVerified")}
            </Badge>
          ) : (
            <Badge variant="light" color="warning">
              {t("profile.emailNotVerified")}
            </Badge>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {t("profile.memberSince", { date: formatDate(user.created_at, locale) })}
        </p>
      </div>
    </div>
  );
}
