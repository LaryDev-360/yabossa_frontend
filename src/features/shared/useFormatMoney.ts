import { useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import { useTranslation } from "../../i18n/I18nContext";
import { DEFAULT_CURRENCY_CODE } from "./currencies";
import { formatMoney } from "./format";

export function useFormatMoney() {
  const { locale } = useTranslation();
  const { user } = useAuth();
  const currency = user?.currency_code ?? DEFAULT_CURRENCY_CODE;

  return useCallback(
    (value: string | number | null | undefined) => formatMoney(value, locale, currency),
    [locale, currency],
  );
}

export function useCurrencyCode(): string {
  const { user } = useAuth();
  return user?.currency_code ?? DEFAULT_CURRENCY_CODE;
}
