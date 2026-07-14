const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const DEFAULT_TIMEOUT = 15000;

export const safeStorage = {
  getItem(key) {
    try {
      const value = window.localStorage.getItem(key);
      if (value == null) return null;
      return value;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore storage errors
    }
  },
  removeItem(key) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  },
  getJson(key, fallback = null) {
    try {
      const value = this.getItem(key);
      if (!value) return fallback;
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  setJson(key, value) {
    this.setItem(key, JSON.stringify(value));
  },
};

function buildUrl(path) {
  if (!path) return API_BASE;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

export async function request(path, options = {}) {
  const { authToken, timeout = DEFAULT_TIMEOUT, headers = {}, ...rest } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(buildUrl(path), {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...headers,
      },
    });

    let data = null;
    const contentType = response.headers?.get?.("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const detail =
        (typeof data === "object" && data && (data.detail || data.message)) ||
        (typeof data === "string" ? data : null) ||
        `Request failed with status ${response.status}`;
      return { ok: false, error: detail, status: response.status, data };
    }

    return { ok: true, data, status: response.status };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { ok: false, error: `Request timed out after ${timeout}ms`, status: 408 };
    }
    return {
      ok: false,
      error: error?.message || "Network error",
      status: 0,
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export { API_BASE };
