import { supabase } from './supabaseClient';

export interface ApiErrorDetail {
  path: string;
  message: string;
}

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: ApiErrorDetail[];
  public requestId?: string;

  constructor(status: number, message: string, code = 'API_ERROR', details?: ApiErrorDetail[], requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

const rawApiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').trim();
const API_BASE_URL = rawApiUrl.endsWith('/api/v1')
  ? rawApiUrl
  : `${rawApiUrl.replace(/\/+$/, '')}/api/v1`;

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  let url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const authHeaders = await getAuthHeader();
  const headers: Record<string, string> = {
    ...authHeaders,
    ...options.headers,
  };

  const isFormData = body instanceof FormData;
  if (!isFormData && body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    signal: options.signal,
  });

  if (response.status === 204) {
    return {} as T;
  }

  let json: any = null;
  try {
    json = await response.json();
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const errorPayload = json?.error || {};
    const message = errorPayload.message || response.statusText || 'Request failed';
    const code = errorPayload.code || `HTTP_${response.status}`;
    const details = errorPayload.details;
    const requestId = errorPayload.requestId;

    if (response.status === 401) {
      // If we are not on public auth pages, redirect to login
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isPublicAuthPage =
          currentPath === '/' ||
          currentPath.startsWith('/login') ||
          currentPath.startsWith('/signup') ||
          currentPath.startsWith('/forgot-password') ||
          currentPath.startsWith('/reset-password') ||
          currentPath.startsWith('/verify-email');

        if (!isPublicAuthPage) {
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?returnTo=${returnTo}`;
        }
      }
    }

    throw new ApiError(response.status, message, code, details, requestId);
  }

  return (json?.data !== undefined ? json.data : json) as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('DELETE', path, body, options),
};
