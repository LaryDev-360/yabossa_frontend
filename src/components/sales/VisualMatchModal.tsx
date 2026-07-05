import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import type { VisualMatchItem } from "../../features/catalog/types";
import { useFormatMoney } from "../../features/shared/useFormatMoney";
import { useTranslation } from "../../i18n/I18nContext";

interface VisualMatchModalProps {
  isOpen: boolean;
  matches: VisualMatchItem[];
  onSelect: (match: VisualMatchItem) => void;
  onClose: () => void;
}

export default function VisualMatchModal({
  isOpen,
  matches,
  onSelect,
  onClose,
}: VisualMatchModalProps) {
  const { t } = useTranslation();
  const formatMoney = useFormatMoney();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6 lg:p-8">
        <h3 className="mb-2 text-xl font-semibold text-gray-800 dark:text-white/90">
          {t("sales.visualMatchTitle")}
        </h3>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {t("sales.visualMatchHint")}
        </p>

        {matches.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("sales.visualMatchEmpty")}</p>
        ) : (
          <ul className="space-y-3">
            {matches.map((match) => (
              <li key={match.product_id}>
                <button
                  type="button"
                  onClick={() => onSelect(match)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left hover:border-brand-300 dark:border-gray-700"
                >
                  {match.image_url ? (
                    <img
                      src={match.image_url}
                      alt=""
                      className="size-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-14 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 dark:text-white/90">{match.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatMoney(match.sale_price)} ·{" "}
                      {t("sales.visualMatchConfidence", {
                        percent: Math.round(match.score * 100),
                      })}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" size="sm" variant="outline" onClick={onClose}>
            {t("sales.visualMatchCancel")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
