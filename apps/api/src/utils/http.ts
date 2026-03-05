import { cache } from "../services/cacheService.js";
import { hashKey, sleep } from "./misc.js";

const hostLastCall = new Map<string, number>();

export interface HttpJsonOptions {
  cacheTtlSeconds?: number;
  throttleMs?: number;
  headers?: Record<string, string>;
}

const normalizeHost = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return "unknown";
  }
};

const parseRetryAfterMs = (header: string | null): number | null => {
  if (!header) return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000);

  const when = Date.parse(header);
  if (Number.isNaN(when)) return null;
  return Math.max(0, when - Date.now());
};

const fetchWithRetry = async (url: string, init: RequestInit): Promise<Response> => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const response = await fetch(url, init);
    if (response.ok) return response;

    if (response.status === 429 && attempt < maxAttempts) {
      const retryMs = parseRetryAfterMs(response.headers.get("retry-after")) ?? attempt * 1500;
      await sleep(retryMs);
      continue;
    }

    throw new Error(`Provider unavailable (${response.status})`);
  }

  throw new Error("Provider unavailable (429)");
};

export const getJson = async <T>(url: string, options: HttpJsonOptions = {}): Promise<T> => {
  const cacheKey = `http:${hashKey(url)}`;
  const cached = await cache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const host = normalizeHost(url);
  const throttleMs = options.throttleMs ?? 0;
  const lastCall = hostLastCall.get(host) ?? 0;
  const elapsed = Date.now() - lastCall;
  if (elapsed < throttleMs) {
    await sleep(throttleMs - elapsed);
  }

  const response = await fetchWithRetry(url, {
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  hostLastCall.set(host, Date.now());

  const json = (await response.json()) as T;
  await cache.set(cacheKey, json, options.cacheTtlSeconds);
  return json;
};

export const postText = async <T>(
  url: string,
  body: string,
  options: HttpJsonOptions = {}
): Promise<T> => {
  const cacheKey = `http:post:${hashKey(`${url}:${body}`)}`;
  const cached = await cache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }

  const host = normalizeHost(url);
  const throttleMs = options.throttleMs ?? 0;
  const lastCall = hostLastCall.get(host) ?? 0;
  const elapsed = Date.now() - lastCall;
  if (elapsed < throttleMs) {
    await sleep(throttleMs - elapsed);
  }

  const response = await fetchWithRetry(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      ...options.headers
    },
    body
  });

  hostLastCall.set(host, Date.now());

  const json = (await response.json()) as T;
  await cache.set(cacheKey, json, options.cacheTtlSeconds);
  return json;
};
