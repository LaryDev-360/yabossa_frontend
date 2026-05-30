import { SUPPORTED_LOCALES } from "../../i18n";
import { useI18n } from "../../i18n/I18nContext";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export default function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {!compact && (
        <span className="sr-only">{t("common.language")}</span>
      )}
      {SUPPORTED_LOCALES.map(({ code, labelKey }) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            aria-label={t(labelKey)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              active
                ? "bg-brand-500 text-white shadow-theme-xs"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            }`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
