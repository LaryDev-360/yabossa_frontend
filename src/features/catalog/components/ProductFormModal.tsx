import { FormEvent, useEffect, useRef, useState } from "react";
import type { Shop } from "../../shops/types";
import { ApiError, getFieldError } from "../../../api/errors";
import { useTranslation } from "../../../i18n/I18nContext";
import {
  createProduct,
  openProductQrPrint,
  updateProduct,
  uploadProductImage,
  uploadReferenceImage,
} from "../api";
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const [shopId, setShopId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [referenceCount, setReferenceCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const [isPrintingQr, setIsPrintingQr] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setShopId(product?.shop ?? shops[0]?.id ?? "");
    setCategoryId(product?.category ?? "");
    setName(product?.name ?? "");
    setPurchasePrice(product?.purchase_price ?? "");
    setSalePrice(product?.sale_price ?? "");
    setImagePreview(product?.image_url ?? null);
    setImageFile(null);
    setReferenceCount(product?.reference_image_count ?? 0);
    setError(null);
    setFieldErrors({});
  }, [isOpen, product, shops]);

  function handleImageSelect(file: File | null) {
    if (!file) {
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleReferenceSelect(fileList: FileList | null) {
    if (!product || !fileList?.length) {
      return;
    }
    setIsUploadingReference(true);
    setError(null);
    try {
      for (const file of Array.from(fileList)) {
        await uploadReferenceImage(product.id, file);
        setReferenceCount((count) => count + 1);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.referenceUploadError"));
    } finally {
      setIsUploadingReference(false);
      if (referenceInputRef.current) {
        referenceInputRef.current.value = "";
      }
    }
  }

  async function handlePrintQr() {
    if (!product) {
      return;
    }
    setIsPrintingQr(true);
    try {
      await openProductQrPrint(product.id, product.name);
    } catch {
      setError(t("products.printQrError"));
    } finally {
      setIsPrintingQr(false);
    }
  }

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
      let saved: Product;
      if (isEdit && product) {
        saved = await updateProduct(product.id, payload);
      } else {
        saved = await createProduct(payload);
      }
      if (imageFile) {
        saved = await uploadProductImage(saved.id, imageFile);
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

          <div>
            <Label>{t("products.image")}</Label>
            <div className="mt-2 flex items-center gap-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt=""
                  className="size-16 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="size-16 rounded-lg bg-gray-100 dark:bg-gray-800" />
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => imageInputRef.current?.click()}
              >
                {t("products.uploadImage")}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {isEdit && product && (
            <>
              <div>
                <Label>{t("products.scanCode")}</Label>
                <Input value={product.scan_code} disabled />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPrintingQr}
                  onClick={() => void handlePrintQr()}
                >
                  {isPrintingQr ? t("common.loading") : t("products.printQr")}
                </Button>
              </div>
              <div>
                <Label>{t("products.referencePhotos")}</Label>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  {t("products.referencePhotosHint", { count: referenceCount })}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isUploadingReference || isSubmitting}
                  onClick={() => referenceInputRef.current?.click()}
                >
                  {isUploadingReference
                    ? t("products.uploadingReference")
                    : t("products.addReferencePhoto")}
                </Button>
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => void handleReferenceSelect(e.target.files)}
                />
              </div>
            </>
          )}

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
