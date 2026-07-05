import { FormEvent, useEffect, useState } from "react";
import { ApiError, getFieldError } from "../../../api/errors";
import { useTranslation } from "../../../i18n/I18nContext";
import { createShop, updateShop } from "../api";
import type { Shop } from "../types";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";

interface ShopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop?: Shop | null;
  isAdmin: boolean;
  onSaved: () => void;
}

export default function ShopFormModal({
  isOpen,
  onClose,
  shop,
  isAdmin,
  onSaved,
}: ShopFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(shop);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setName(shop?.name ?? "");
    setDescription(shop?.description ?? "");
    setMerchantId(shop?.merchant ?? "");
    setIsActive(shop?.is_active ?? true);
    setError(null);
    setFieldErrors({});
  }, [isOpen, shop]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_active: isActive,
      ...(isAdmin && !isEdit ? { merchant: merchantId.trim() } : {}),
    };

    try {
      if (isEdit && shop) {
        await updateShop(shop.id, payload);
      } else {
        await createShop(payload);
      }
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
        setError(t("shops.formErrorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6 lg:p-8">
        <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? t("shops.editShop") : t("shops.addShop")}
        </h3>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("shops.formErrorTitle")} message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isAdmin && !isEdit && (
            <div>
              <Label>
                {t("shops.merchantId")}{" "}
                <span className="text-error-500">{t("common.required")}</span>
              </Label>
              <Input
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                disabled={isSubmitting}
                error={Boolean(fieldErrors.merchant)}
                hint={fieldErrors.merchant}
                required
              />
            </div>
          )}

          <div>
            <Label>
              {t("shops.name")} <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.name)}
              hint={fieldErrors.name}
              required
            />
          </div>

          <div>
            <Label>{t("shops.description")}</Label>
            <TextArea
              value={description}
              onChange={setDescription}
              disabled={isSubmitting}
              rows={3}
              placeholder={t("common.descriptionPlaceholder")}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={isSubmitting}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            {t("shops.active")}
          </label>

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
