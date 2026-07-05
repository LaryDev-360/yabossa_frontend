import { getApiBaseUrl } from "../../api/config";
import { apiRequest } from "../../api/client";
import { tokenStorage } from "../../auth/tokenStorage";
import type {
  Category,
  CategoryPayload,
  Product,
  ProductImageRecord,
  ProductLookupResult,
  ProductPayload,
  VisualMatchResponse,
} from "./types";

export async function listCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("/categories/");
}

export async function createCategory(payload: CategoryPayload): Promise<Category> {
  return apiRequest<Category>("/categories/", { method: "POST", body: payload });
}

export async function updateCategory(
  id: string,
  payload: Partial<CategoryPayload>,
): Promise<Category> {
  return apiRequest<Category>(`/categories/${id}/`, { method: "PATCH", body: payload });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiRequest(`/categories/${id}/`, { method: "DELETE" });
}

export async function listProducts(): Promise<Product[]> {
  return apiRequest<Product[]>("/products/");
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  return apiRequest<Product>("/products/", { method: "POST", body: payload });
}

export async function updateProduct(
  id: string,
  payload: Partial<ProductPayload>,
): Promise<Product> {
  return apiRequest<Product>(`/products/${id}/`, { method: "PATCH", body: payload });
}

export async function uploadProductImage(productId: string, file: File): Promise<Product> {
  const form = new FormData();
  form.append("image", file);
  return apiRequest<Product>(`/products/${productId}/image/`, {
    method: "POST",
    body: form,
  });
}

export async function uploadReferenceImage(
  productId: string,
  file: File,
): Promise<ProductImageRecord> {
  const form = new FormData();
  form.append("image", file);
  return apiRequest<ProductImageRecord>(`/products/${productId}/reference-images/`, {
    method: "POST",
    body: form,
  });
}

export async function lookupProduct(
  scanCode: string,
  locationId: string,
): Promise<ProductLookupResult> {
  const params = new URLSearchParams({
    scan_code: scanCode,
    location_id: locationId,
  });
  return apiRequest<ProductLookupResult>(`/products/lookup/?${params.toString()}`);
}

export async function visualMatchProduct(
  locationId: string,
  image: Blob,
  filename = "capture.jpg",
): Promise<VisualMatchResponse> {
  const form = new FormData();
  form.append("location_id", locationId);
  form.append("image", image, filename);
  return apiRequest<VisualMatchResponse>("/products/visual-match/", {
    method: "POST",
    body: form,
  });
}

export async function fetchProductQrBlob(productId: string): Promise<Blob> {
  const headers = new Headers({ Accept: "image/png" });
  const access = tokenStorage.getAccess();
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }
  const res = await fetch(`${getApiBaseUrl()}/products/${productId}/qr/`, { headers });
  if (!res.ok) {
    throw new Error("Unable to load QR code.");
  }
  return res.blob();
}

export async function openProductQrPrint(productId: string, productName: string): Promise<void> {
  const blob = await fetchProductQrBlob(productId);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.document.title = productName;
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${productId}.png`;
    link.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function parseScanCode(raw: string): string {
  const value = raw.trim();
  if (value.toUpperCase().startsWith("TFS:")) {
    return value.slice(4).trim();
  }
  return value;
}
