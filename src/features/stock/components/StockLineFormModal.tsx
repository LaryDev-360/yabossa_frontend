import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ApiError, getFieldError } from "../../../api/errors";
import { useTranslation } from "../../../i18n/I18nContext";
import type { Product } from "../../catalog/types";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";
import { createLocationStock, updateLocationStock } from "../api";
import type { LocationStock } from "../types";

interface StockLineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  stockLine?: LocationStock | null;
  products: Product[];
  existingProductIds: Set<string>;
  onSaved: () => void;
}

export default function StockLineFormModal({
  isOpen,
  onClose,
  locationId,
  stockLine,
  products,
  existingProductIds,
  onSaved,
}: StockLineFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(stockLine);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [threshold, setThreshold] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableProducts = useMemo(
    () =>
      products.filter(
        (p) => !p.is_archived && (isEdit ? p.id === stockLine?.product : !existingProductIds.has(p.id)),
      ),
    [products, existingProductIds, isEdit, stockLine?.product],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setProductId(stockLine?.product ?? availableProducts[0]?.id ?? "");
    setQuantity(String(stockLine?.quantity ?? 0));
    setThreshold(String(stockLine?.low_stock_threshold ?? 5));
    setError(null);
    setFieldErrors({});
  }, [isOpen, stockLine, availableProducts]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const qty = Number.parseInt(quantity, 10);
    const thresh = Number.parseInt(threshold, 10);

    try {
      if (isEdit && stockLine) {
        await updateLocationStock(locationId, stockLine.id, {
          quantity: qty,
          low_stock_threshold: thresh,
        });
      } else {
        await createLocationStock(locationId, {
          product: productId,
          quantity: qty,
          low_stock_threshold: thresh,
        });
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
        setError(t("stock.formErrorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6 lg:p-8">
        <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? t("stock.editLine") : t("stock.addLine")}
        </h3>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("stock.formErrorTitle")} message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isEdit && (
            <div>
              <Label>
                {t("stock.product")}{" "}
                <span className="text-error-500">{t("common.required")}</span>
              </Label>
              {availableProducts.length === 0 ? (
                <div className="mt-1 rounded-lg border border-dashed border-gray-300 p-4 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("stock.noProductsAvailable")}
                  </p>
                  <Link to="/products" onClick={onClose} className="mt-3 inline-block">
                    <Button type="button" size="sm">
                      {t("stock.goToAddProduct")}
                    </Button>
                  </Link>
                </div>
              ) : (
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  required
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.product && (
                <p className="mt-1 text-xs text-error-500">{fieldErrors.product}</p>
              )}
            </div>
          )}

          <div>
            <Label>
              {t("stock.quantity")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.quantity)}
              hint={fieldErrors.quantity}
              required
            />
          </div>

          <div>
            <Label>{t("stock.lowStockThreshold")}</Label>
            <Input
              type="number"
              min={0}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.low_stock_threshold)}
              hint={fieldErrors.low_stock_threshold}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || (!isEdit && availableProducts.length === 0)}
            >
              {isSubmitting ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
