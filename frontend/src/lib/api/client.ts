import type { ApiSuccess, FieldError, Paginated } from "@/types/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: FieldError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type QueryValue = string | number | undefined | null;

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const qs = params.toString();
  return `/api${path}${qs ? `?${qs}` : ""}`;
}

function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === "/login") return;
  const from = window.location.pathname + window.location.search;
  // Full navigation (not router.push): this runs outside React and should drop all cached client state.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?from=${encodeURIComponent(from)}&expired=1`);
}

async function request<T>(
  method: string,
  path: string,
  options: { query?: Record<string, QueryValue>; body?: unknown; skipAuthRedirect?: boolean } = {},
): Promise<ApiSuccess<T>> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      credentials: "same-origin",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, "Unable to reach the server. Check your connection and try again.");
  }

  const payload = (await response.json().catch(() => null)) as
    | (ApiSuccess<T> & { errors?: FieldError[] })
    | { success: false; message?: string; errors?: FieldError[] }
    | null;

  if (!response.ok || !payload?.success) {
    if (response.status === 401 && !options.skipAuthRedirect) {
      // Clear the stale cookie so the login page is not bounced back here.
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
      redirectToLogin();
    }
    throw new ApiError(
      response.status,
      payload?.message ?? "Something went wrong. Please try again.",
      payload?.errors ?? [],
    );
  }
  return payload;
}

export const api = {
  get: async <T>(path: string, query?: Record<string, QueryValue>) => (await request<T>("GET", path, { query })).data,
  list: async <T>(path: string, query?: Record<string, QueryValue>): Promise<Paginated<T>> => {
    const res = await request<T[]>("GET", path, { query });
    return { data: res.data, pagination: res.pagination ?? { page: 1, limit: res.data.length, total: res.data.length, totalPages: 1 } };
  },
  post: async <T>(path: string, body?: unknown, opts?: { skipAuthRedirect?: boolean }) =>
    (await request<T>("POST", path, { body: body ?? {}, ...opts })).data,
  patch: async <T>(path: string, body: unknown) => (await request<T>("PATCH", path, { body })).data,
  put: async <T>(path: string, body: unknown) => (await request<T>("PUT", path, { body })).data,
  delete: async <T>(path: string) => (await request<T>("DELETE", path)).data,
  /** Session probe that must not trigger the 401 redirect. */
  getQuiet: async <T>(path: string) => (await request<T>("GET", path, { skipAuthRedirect: true })).data,
};
