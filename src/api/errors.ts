export type ApiFieldErrors = Record<string, string | string[]>;

export class ApiError extends Error {
  status: number;
  fieldErrors: ApiFieldErrors;
  raw: unknown;

  constructor(
    message: string,
    status: number,
    fieldErrors: ApiFieldErrors = {},
    raw: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.raw = raw;
  }
}

function normalizeFieldValue(value: unknown): string | string[] | undefined {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  return undefined;
}

export function parseApiError(status: number, body: unknown): ApiError {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const fieldErrors: ApiFieldErrors = {};

    for (const [key, value] of Object.entries(record)) {
      if (key === "detail") {
        continue;
      }
      const normalized = normalizeFieldValue(value);
      if (normalized !== undefined) {
        fieldErrors[key] = normalized;
      }
    }

    const detail = record.detail;
    if (typeof detail === "string") {
      return new ApiError(detail, status, fieldErrors, body);
    }
    if (Array.isArray(detail) && detail.every((d) => typeof d === "string")) {
      return new ApiError(detail.join(" "), status, fieldErrors, body);
    }

    const firstField = Object.values(fieldErrors)[0];
    if (firstField) {
      const msg = Array.isArray(firstField) ? firstField[0] : firstField;
      return new ApiError(msg, status, fieldErrors, body);
    }
  }

  return new ApiError(`Request failed (${status})`, status, {}, body);
}

export function getFieldError(
  fieldErrors: ApiFieldErrors,
  field: string,
): string | undefined {
  const value = fieldErrors[field];
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}
