import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { tableCol } from "../../components/ui/table/tableClasses";
import { listProducts } from "../../features/catalog/api";
import {
  createSale,
  loadLocationOptions,
  newSaleReference,
} from "../../features/sales/api";
import type { CartLine, LocationOption, PosProductOption } from "../../features/sales/types";
import { formatMoney } from "../../features/shared/format";
import { listLocationStock } from "../../features/stock/api";
import { useTranslation } from "../../i18n/I18nContext";
import { ChevronLeftIcon, PlusIcon, TrashBinIcon } from "../../icons";

function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + Number.parseFloat(line.unitPrice) * line.quantity, 0);
}

export default function NewSalePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationId, setLocationId] = useState("");
  const [products, setProducts] = useState<PosProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === locationId) ?? null,
    [locations, locationId],
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) {
      return products;
    }
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  const total = useMemo(() => cartTotal(cart), [cart]);

  const loadLocations = useCallback(async () => {
    setIsLoadingLocations(true);
    setError(null);
    try {
      const opts = await loadLocationOptions(user?.role, user?.cashier?.shop_id);
      setLocations(opts);
      if (opts.length === 1) {
        setLocationId(opts[0].id);
      } else if (user?.role === "CASHIER" && user.cashier?.shop_id) {
        const first = opts[0];
        if (first) {
          setLocationId(first.id);
        }
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("sales.posLoadError"));
    } finally {
      setIsLoadingLocations(false);
    }
  }, [t, user?.role, user?.cashier?.shop_id]);

  const loadProductsForLocation = useCallback(async () => {
    if (!locationId || !selectedLocation) {
      setProducts([]);
      setCart([]);
      return;
    }
    setIsLoadingProducts(true);
    setError(null);
    try {
      const [stockLines, catalog] = await Promise.all([
        listLocationStock(locationId),
        listProducts(),
      ]);
      const catalogById = Object.fromEntries(catalog.map((p) => [p.id, p]));
      const available: PosProductOption[] = [];
      for (const line of stockLines) {
        if (line.quantity <= 0) {
          continue;
        }
        const product = catalogById[line.product];
        if (!product || product.is_archived || product.shop !== selectedLocation.shopId) {
          continue;
        }
        available.push({
          productId: product.id,
          name: product.name,
          salePrice: product.sale_price,
          stockQuantity: line.quantity,
        });
      }
      available.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(available);
      setCart([]);
      setProductSearch("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("sales.posLoadError"));
    } finally {
      setIsLoadingProducts(false);
    }
  }, [locationId, selectedLocation, t]);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    void loadProductsForLocation();
  }, [loadProductsForLocation]);

  function addToCart(product: PosProductOption) {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.productId);
      if (existing) {
        if (existing.quantity >= existing.maxQuantity) {
          return prev;
        }
        return prev.map((line) =>
          line.productId === product.productId
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name,
          unitPrice: product.salePrice,
          quantity: 1,
          maxQuantity: product.stockQuantity,
        },
      ];
    });
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      prev
        .map((line) => {
          if (line.productId !== productId) {
            return line;
          }
          const next = Math.max(1, Math.min(quantity, line.maxQuantity));
          return { ...line, quantity: next };
        })
        .filter((line) => line.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  async function handleCompleteSale() {
    if (!locationId || !selectedLocation || cart.length === 0) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        location: locationId,
        reference: newSaleReference(),
        items: cart.map((line) => ({
          product: line.productId,
          quantity: line.quantity,
        })),
        ...(user?.role === "ADMIN" ? { merchant: selectedLocation.merchantId } : {}),
      };
      const sale = await createSale(payload);
      navigate(`/sales/${sale.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError(t("sales.duplicateReference"));
        } else if (err.status === 400) {
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError(t("sales.submitError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageMeta title={t("sales.posPageTitle")} description={t("sales.pageDescription")} />

      <div className="mb-4">
        <Link
          to="/sales"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          <ChevronLeftIcon className="size-5 mr-1" />
          {t("sales.backToSales")}
        </Link>
      </div>

      <PageBreadcrumb pageTitle={t("sales.newSale")} />

      {error && (
        <div className="mb-5">
          <Alert variant="error" title={t("sales.posErrorTitle")} message={error} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <div className="mb-4">
              <Label>{t("sales.selectLocation")}</Label>
              {isLoadingLocations ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
              ) : locations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{t("sales.noLocations")}</p>
              ) : (
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  disabled={isSubmitting}
                  className="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="">{t("sales.chooseLocation")}</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.shopName} — {loc.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {locationId && (
              <>
                <Label className="mb-1">{t("sales.searchProducts")}</Label>
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t("sales.searchProductsPlaceholder")}
                  disabled={isSubmitting || isLoadingProducts}
                />

                {isLoadingProducts ? (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {t("sales.noProductsInStock")}
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredProducts.map((product) => (
                      <li
                        key={product.productId}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatMoney(product.salePrice, locale)} · {t("sales.inStock", { count: product.stockQuantity })}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={() => addToCart(product)}
                        >
                          <PlusIcon className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 lg:sticky lg:top-24">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              {t("sales.cart")}
            </h3>

            {cart.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("sales.cartEmpty")}</p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-1">
                  <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                      <TableRow>
                        <TableCell isHeader>{t("sales.product")}</TableCell>
                        <TableCell isHeader className={tableCol.muted}>
                          {t("sales.qty")}
                        </TableCell>
                        <TableCell isHeader className={tableCol.actions} />
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {cart.map((line) => (
                        <TableRow key={line.productId}>
                          <TableCell className={tableCol.primary}>
                            <span className="block text-sm">{line.name}</span>
                            <span className="text-xs text-gray-500">
                              {formatMoney(line.unitPrice, locale)}
                            </span>
                          </TableCell>
                          <TableCell className={tableCol.muted}>
                            <input
                              type="number"
                              min={1}
                              max={line.maxQuantity}
                              value={line.quantity}
                              disabled={isSubmitting}
                              onChange={(e) =>
                                updateCartQuantity(line.productId, Number.parseInt(e.target.value, 10) || 1)
                              }
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                            />
                          </TableCell>
                          <TableCell className={tableCol.actions}>
                            <button
                              type="button"
                              onClick={() => removeFromCart(line.productId)}
                              className="p-1.5 text-gray-500 hover:text-error-500"
                              aria-label={t("sales.removeFromCart")}
                            >
                              <TrashBinIcon className="size-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-white/[0.05]">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("sales.cartTotal")}
                  </span>
                  <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {formatMoney(total, locale)}
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  className="mt-4 w-full"
                  disabled={isSubmitting || !locationId}
                  onClick={() => void handleCompleteSale()}
                >
                  {isSubmitting ? t("sales.completing") : t("sales.completeSale")}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
