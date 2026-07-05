import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import { canManageCatalog } from "../../auth/roles";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import ImageLightbox from "../../components/ui/ImageLightbox";
import {
  getProduct,
  listCategories,
  listReferenceImages,
  openProductQrPrint,
  uploadReferenceImage,
} from "../../features/catalog/api";
import ProductFormModal from "../../features/catalog/components/ProductFormModal";
import type { Category, Product, ProductImageRecord } from "../../features/catalog/types";
import { formatDateTime } from "../../features/shared/format";
import { useFormatMoney } from "../../features/shared/useFormatMoney";
import { listShops } from "../../features/shops/api";
import type { Shop } from "../../features/shops/types";
import { useTranslation } from "../../i18n/I18nContext";
import { ChevronLeftIcon } from "../../icons";

export default function ProductDetailPage() {
  const { id = "" } = useParams();
  const { t, locale } = useTranslation();
  const formatMoney = useFormatMoney();
  const { user } = useAuth();
  const canWrite = canManageCatalog(user?.role);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [referenceImages, setReferenceImages] = useState<ProductImageRecord[]>([]);
  const [shopName, setShopName] = useState("—");
  const [categoryName, setCategoryName] = useState("—");
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrintingQr, setIsPrintingQr] = useState(false);
  const [isUploadingReference, setIsUploadingReference] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!id) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const [productData, shopData, categoryData, refs] = await Promise.all([
        getProduct(id),
        listShops(),
        listCategories(),
        listReferenceImages(id),
      ]);
      setProduct(productData);
      setReferenceImages(refs);
      setShops(shopData);
      setCategories(categoryData);
      setShopName(shopData.find((shop) => shop.id === productData.shop)?.name ?? "—");
      setCategoryName(
        productData.category
          ? categoryData.find((cat) => cat.id === productData.category)?.name ?? "—"
          : t("products.noCategory"),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.detailLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const unitMargin = useMemo(() => {
    if (!product?.purchase_price) {
      return null;
    }
    return Number.parseFloat(product.sale_price) - Number.parseFloat(product.purchase_price);
  }, [product]);

  const galleryImages = useMemo(
    () =>
      referenceImages
        .filter((image) => image.image_url)
        .map((image) => ({
          id: image.id,
          url: image.image_url as string,
          label: formatDateTime(image.created_at, locale),
        })),
    [referenceImages, locale],
  );

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

  async function handleReferenceUpload(fileList: FileList | null) {
    if (!product || !fileList?.length) {
      return;
    }
    setIsUploadingReference(true);
    setError(null);
    try {
      for (const file of Array.from(fileList)) {
        await uploadReferenceImage(product.id, file);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("products.referenceUploadError"));
    } finally {
      setIsUploadingReference(false);
      if (referenceInputRef.current) {
        referenceInputRef.current.value = "";
      }
    }
  }

  const pageTitle = product ? product.name : t("products.title");

  return (
    <>
      <PageMeta title={t("products.detailPageTitle")} description={t("products.pageDescription")} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5 mr-1" />
          {t("products.backToProducts")}
        </Link>

        {canWrite && product && (
          <div className="flex flex-wrap gap-3">
            <Button type="button" size="sm" variant="outline" onClick={() => setModalOpen(true)}>
              {t("products.editProduct")}
            </Button>
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
        )}
      </div>

      <PageBreadcrumb pageTitle={pageTitle} />

      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("products.loadErrorTitle")} message={error} />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      ) : product ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("products.detailNoImage")}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <h3 className="mb-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                  {t("products.detailScanSection")}
                </h3>
                <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                  {t("products.detailQrHint")}
                </p>
                <div className="rounded-xl bg-gray-50 px-4 py-3 font-mono text-sm text-gray-800 dark:bg-gray-900 dark:text-white/90">
                  TFS:{product.scan_code}
                </div>
                {canWrite && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    disabled={isPrintingQr}
                    onClick={() => void handlePrintQr()}
                  >
                    {isPrintingQr ? t("common.loading") : t("products.printQr")}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-6 xl:col-span-7">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                    {product.name}
                  </h2>
                  {product.is_archived ? (
                    <Badge size="sm" color="light">
                      {t("products.archived")}
                    </Badge>
                  ) : (
                    <Badge size="sm" color="success">
                      {t("products.active")}
                    </Badge>
                  )}
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-500/10">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("products.salePrice")}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                      {formatMoney(product.sale_price)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("products.purchasePrice")}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                      {product.purchase_price ? formatMoney(product.purchase_price) : "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-gray-900">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("products.detailMargin")}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                      {unitMargin !== null ? formatMoney(unitMargin) : "—"}
                    </p>
                  </div>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">{t("products.shop")}</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {shopName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t("products.category")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {categoryName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t("products.scanCode")}
                    </dt>
                    <dd className="mt-1 font-mono text-sm font-medium text-gray-800 dark:text-white/90">
                      {product.scan_code}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t("products.createdAt")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDateTime(product.created_at, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t("products.updatedAt")}
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatDateTime(product.updated_at, locale)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {t("products.referenceGallery")}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t("products.referenceGalleryHint")}
                </p>
              </div>
              {canWrite && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isUploadingReference}
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
                    onChange={(e) => void handleReferenceUpload(e.target.files)}
                  />
                </>
              )}
            </div>

            {galleryImages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("products.noReferencePhotos")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {galleryImages.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setLightboxIndex(index)}
                    className="group overflow-hidden rounded-xl border border-gray-200 text-left dark:border-gray-700"
                  >
                    <img
                      src={image.url}
                      alt=""
                      className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                    />
                    <p className="truncate px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                      {image.label}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {lightboxIndex !== null && galleryImages.length > 0 && (
        <ImageLightbox
          images={galleryImages}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          previousLabel={t("products.previousImage")}
          nextLabel={t("products.nextImage")}
          closeLabel={t("products.closeViewer")}
          counterLabel={t("products.imageViewerTitle", {
            current: lightboxIndex + 1,
            total: galleryImages.length,
          })}
        />
      )}

      {canWrite && product && shops.length > 0 && (
        <ProductFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          product={product}
          shops={shops}
          categories={categories}
          onSaved={() => void loadData()}
        />
      )}
    </>
  );
}
