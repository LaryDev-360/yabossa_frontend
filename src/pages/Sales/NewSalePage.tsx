import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ApiError } from "../../api/errors";
import { useAuth } from "../../auth/AuthContext";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import QrScannerOverlay from "../../components/sales/QrScannerOverlay";
import VisualMatchModal from "../../components/sales/VisualMatchModal";
import Alert from "../../components/ui/alert/Alert";
import Button from "../../components/ui/button/Button";
import UndoToast from "../../components/ui/UndoToast";
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
import {
  listProducts,
  lookupProduct,
  parseScanCode,
  visualMatchProduct,
} from "../../features/catalog/api";
import type { ProductLookupResult, VisualMatchItem } from "../../features/catalog/types";
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

type PosMode = "search" | "qr" | "visual";

function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + Number.parseFloat(line.unitPrice) * line.quantity, 0);
}

export default function NewSalePage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const wedgeInputRef = useRef<HTMLInputElement>(null);
  const visualVideoRef = useRef<HTMLVideoElement>(null);
  const visualStreamRef = useRef<MediaStream | null>(null);

  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [locationId, setLocationId] = useState("");
  const [products, setProducts] = useState<PosProductOption[]>([]);
  const [posMode, setPosMode] = useState<PosMode>("search");
  const [productSearch, setProductSearch] = useState("");
  const [wedgeInput, setWedgeInput] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isVisualMatching, setIsVisualMatching] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [visualMatches, setVisualMatches] = useState<VisualMatchItem[] | null>(null);
  const [undoToast, setUndoToast] = useState<{ productId: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === locationId) ?? null,
    [locations, locationId],
  );

  const productsByScanCode = useMemo(() => {
    const map = new Map<string, PosProductOption>();
    for (const product of products) {
      if (product.scanCode) {
        map.set(product.scanCode, product);
        map.set(`TFS:${product.scanCode}`, product);
      }
    }
    return map;
  }, [products]);

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
          scanCode: product.scan_code,
          imageUrl: product.image_url,
        });
      }
      available.sort((a, b) => a.name.localeCompare(b.name));
      setProducts(available);
      setCart([]);
      setProductSearch("");
      setWedgeInput("");
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

  useEffect(() => {
    if (posMode === "qr" && wedgeInputRef.current) {
      wedgeInputRef.current.focus();
    }
  }, [posMode, locationId]);

  useEffect(() => {
    if (posMode !== "visual" || !locationId) {
      if (visualStreamRef.current) {
        visualStreamRef.current.getTracks().forEach((track) => track.stop());
        visualStreamRef.current = null;
      }
      return;
    }

    let active = true;
    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        visualStreamRef.current = stream;
        if (visualVideoRef.current) {
          visualVideoRef.current.srcObject = stream;
          void visualVideoRef.current.play();
        }
      })
      .catch(() => {
        if (active) {
          setError(t("sales.scanCameraError"));
        }
      });

    return () => {
      active = false;
      if (visualStreamRef.current) {
        visualStreamRef.current.getTracks().forEach((track) => track.stop());
        visualStreamRef.current = null;
      }
    };
  }, [posMode, locationId, t]);

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
          imageUrl: product.imageUrl,
        },
      ];
    });
  }

  function addFromLookup(hit: ProductLookupResult) {
    const local = products.find((p) => p.productId === hit.product_id);
    if (local) {
      addToCart(local);
      return;
    }
    addToCart({
      productId: hit.product_id,
      name: hit.name,
      salePrice: hit.sale_price,
      stockQuantity: hit.quantity_available,
      scanCode: hit.scan_code,
      imageUrl: hit.image_url,
    });
  }

  function addFromVisualMatch(match: VisualMatchItem) {
    const local = products.find((p) => p.productId === match.product_id);
    if (local) {
      addToCart(local);
      return;
    }
    addToCart({
      productId: match.product_id,
      name: match.name,
      salePrice: match.sale_price,
      stockQuantity: match.quantity_available,
      imageUrl: match.image_url,
    });
  }

  const handleScanCode = useCallback(
    async (raw: string) => {
      if (!locationId || !raw.trim()) {
        return;
      }
      setError(null);
      setIsScanning(true);
      const trimmed = raw.trim();
      const code = parseScanCode(trimmed);
      const local = productsByScanCode.get(trimmed) ?? productsByScanCode.get(code);
      if (local) {
        addToCart(local);
        setWedgeInput("");
        setIsScanning(false);
        return;
      }
      try {
        const hit = await lookupProduct(code, locationId);
        addFromLookup(hit);
        setWedgeInput("");
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t("sales.scanNotFound"));
      } finally {
        setIsScanning(false);
      }
    },
    [locationId, productsByScanCode, t],
  );

  async function handleVisualCapture() {
    if (!locationId || !visualVideoRef.current) {
      return;
    }
    setError(null);
    setIsVisualMatching(true);
    try {
      const video = visualVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("canvas");
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9),
      );
      if (!blob) {
        throw new Error("capture");
      }
      const result = await visualMatchProduct(locationId, blob);
      if (result.auto_add) {
        addFromVisualMatch(result.auto_add);
        setUndoToast({ productId: result.auto_add.product_id, name: result.auto_add.name });
      } else if (result.matches.length > 0) {
        setVisualMatches(result.matches);
      } else {
        setError(t("sales.visualMatchEmpty"));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("sales.visualMatchError"));
    } finally {
      setIsVisualMatching(false);
    }
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

  function undoAutoAdd(productId: string) {
    setCart((prev) => {
      const line = prev.find((item) => item.productId === productId);
      if (!line) {
        return prev;
      }
      if (line.quantity <= 1) {
        return prev.filter((item) => item.productId !== productId);
      }
      return prev.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item,
      );
    });
    setUndoToast(null);
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

  const modeButtonClass = (mode: PosMode) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      posMode === mode
        ? "bg-brand-500 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }`;

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
                <div className="mb-4 flex flex-wrap gap-2">
                  <button type="button" className={modeButtonClass("search")} onClick={() => setPosMode("search")}>
                    {t("sales.modeSearch")}
                  </button>
                  <button type="button" className={modeButtonClass("qr")} onClick={() => setPosMode("qr")}>
                    {t("sales.modeQr")}
                  </button>
                  <button type="button" className={modeButtonClass("visual")} onClick={() => setPosMode("visual")}>
                    {t("sales.modeVisual")}
                  </button>
                </div>

                {posMode === "search" && (
                  <>
                    <Label className="mb-1">{t("sales.searchProducts")}</Label>
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder={t("sales.searchProductsPlaceholder")}
                      disabled={isSubmitting || isLoadingProducts}
                    />
                  </>
                )}

                {posMode === "qr" && (
                  <div className="space-y-3">
                    <Label>{t("sales.scanQrHint")}</Label>
                    <input
                      ref={wedgeInputRef}
                      type="text"
                      value={wedgeInput}
                      onChange={(e) => setWedgeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleScanCode(wedgeInput);
                        }
                      }}
                      disabled={isSubmitting || isScanning}
                      className="sr-only"
                      aria-label={t("sales.scanWedgeInput")}
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmitting || isScanning}
                      onClick={() => setShowQrScanner(true)}
                    >
                      {t("sales.openCameraScanner")}
                    </Button>
                  </div>
                )}

                {posMode === "visual" && (
                  <div className="space-y-3">
                    <Label>{t("sales.visualScanHint")}</Label>
                    <video
                      ref={visualVideoRef}
                      className="w-full rounded-lg bg-black aspect-video"
                      muted
                     
                      playsInline
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSubmitting || isVisualMatching}
                      onClick={() => void handleVisualCapture()}
                    >
                      {isVisualMatching ? t("sales.visualMatching") : t("sales.captureAndMatch")}
                    </Button>
                  </div>
                )}

                {isLoadingProducts ? (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
                ) : posMode === "search" && filteredProducts.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    {t("sales.noProductsInStock")}
                  </p>
                ) : posMode === "search" ? (
                  <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {filteredProducts.map((product) => (
                      <li
                        key={product.productId}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="size-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="size-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatMoney(product.salePrice, locale)} ·{" "}
                              {t("sales.inStock", { count: product.stockQuantity })}
                            </p>
                          </div>
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
                ) : null}
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
                            <div className="flex items-center gap-2">
                              {line.imageUrl ? (
                                <img
                                  src={line.imageUrl}
                                  alt=""
                                  className="size-8 shrink-0 rounded object-cover"
                                />
                              ) : null}
                              <div>
                                <span className="block text-sm">{line.name}</span>
                                <span className="text-xs text-gray-500">
                                  {formatMoney(line.unitPrice, locale)}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={tableCol.muted}>
                            <input
                              type="number"
                              min={1}
                              max={line.maxQuantity}
                              value={line.quantity}
                              disabled={isSubmitting}
                              onChange={(e) =>
                                updateCartQuantity(
                                  line.productId,
                                  Number.parseInt(e.target.value, 10) || 1,
                                )
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

      {showQrScanner && (
        <QrScannerOverlay
          onDecode={(text) => {
            setShowQrScanner(false);
            void handleScanCode(text);
          }}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {visualMatches && (
        <VisualMatchModal
          isOpen
          matches={visualMatches}
          locale={locale}
          onSelect={(match) => {
            addFromVisualMatch(match);
            setVisualMatches(null);
          }}
          onClose={() => setVisualMatches(null)}
        />
      )}

      {undoToast && (
        <UndoToast
          message={t("sales.autoAddToast", { name: undoToast.name })}
          undoLabel={t("sales.undo")}
          onUndo={() => undoAutoAdd(undoToast.productId)}
          onDismiss={() => setUndoToast(null)}
        />
      )}
    </>
  );
}
