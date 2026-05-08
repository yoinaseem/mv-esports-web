import type { FieldErrors } from "@/types/auth";

type ApiClientConfig = {
  getToken: () => string | null;
  onUnauthorized: () => void;
};

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  skipAuth?: boolean;
  tokenOverride?: string | null;
};

type LaravelErrorResponse = {
  message?: string;
  errors?: FieldErrors;
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_BASE_URL = `${RAW_API_URL.replace(/\/+$/, "")}/api`;

const apiClientConfig: ApiClientConfig = {
  getToken: () => null,
  onUnauthorized: () => undefined,
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const fallbackMessage = status >= 500 ? "Server error" : "Request failed";
    const message =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as LaravelErrorResponse).message === "string"
        ? ((data as LaravelErrorResponse).message ?? fallbackMessage)
        : fallbackMessage;

    super(message);
    this.status = status;
    this.data = data;
  }
}

export function configureApiClient(config: Partial<ApiClientConfig>) {
  Object.assign(apiClientConfig, config);
}

export function getValidationErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError)) {
    return {};
  }

  const data = error.data as LaravelErrorResponse;
  return data?.errors ?? {};
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const urlPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${urlPath}`;

  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const method = options.method ?? "GET";
  const hasJsonBody = options.body !== undefined;
  if (hasJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  const token = options.tokenOverride ?? apiClientConfig.getToken();
  if (!options.skipAuth && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    method,
    headers,
    body: hasJsonBody ? JSON.stringify(options.body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseData = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    if (response.status === 401) {
      apiClientConfig.onUnauthorized();
    }

    throw new ApiError(response.status, responseData);
  }

  return responseData as T;
}
