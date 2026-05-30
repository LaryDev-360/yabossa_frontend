import { apiRequest } from "../../api/client";
import type { Category, CategoryPayload, Product, ProductPayload } from "./types";

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
