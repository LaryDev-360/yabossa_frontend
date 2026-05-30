import { FormEvent, useEffect, useState } from "react";
import type { Shop } from "../../shops/types";
import { ApiError, getFieldError } from "../../../api/errors";
import { useTranslation } from "../../../i18n/I18nContext";
import { createProduct, updateProduct } from "../api";
import type { Category, Product } from "../types";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import { Modal } from "../../../components/ui/modal";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  shops: Shop[];
  categories: Category[];
  onSaved: () => void;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  product,
  shops,
  categories,
  onSaved,
}: ProductFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(product);

  const [shopId, setShopId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setShopId(product?.shop ?? shops[0]?.id ?? "");
    setCategoryId(product?.category ?? "");
    setName(product?.name ?? "");
    setPurchasePrice(product?.purchase_price ?? "");
    setSalePrice(product?.sale_price ?? "");
    setError(null);
    setFieldErrors({});
  }, [isOpen, product, shops]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    const payload = {
      shop: shopId,
      category: categoryId || null,
      name: name.trim(),
      purchase_price: purchasePrice.trim() || null,
      sale_price: salePrice.trim(),
    };

    try {
      if (isEdit && product) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
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
        setError(t("products.formErrorGeneric"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-6 lg:p-8">
        <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEdit ? t("products.editProduct") : t("products.addProduct")}
        </h3>

        {error && (
          <div className="mb-5">
            <Alert variant="error" title={t("products.formErrorTitle")} message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label>
              {t("products.shop")} <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <select
              className={selectClass}
              value={shopId}
              onChange={(e) => setShopId(e.target.value)}
              disabled={isSubmitting || isEdit}
              required
            >
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            {fieldErrors.shop && (
              <p className="mt-1.5 text-xs text-error-500">{fieldErrors.shop}</p>
            )}
          </div>

          <div>
            <Label>{t("products.category")}</Label>
            <select
              className={selectClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="">{t("products.noCategory")}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>
              {t("products.name")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
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
            <Label>{t("products.purchasePrice")}</Label>
            <Input
              type="number"
              step={0.01}
              min="0"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.purchase_price)}
              hint={fieldErrors.purchase_price}
            />
          </div>

          <div>
            <Label>
              {t("products.salePrice")}{" "}
              <span className="text-error-500">{t("common.required")}</span>
            </Label>
            <Input
              type="number"
              step={0.01}
              min="0"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              disabled={isSubmitting}
              error={Boolean(fieldErrors.sale_price)}
              hint={fieldErrors.sale_price}
              required
            />
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
