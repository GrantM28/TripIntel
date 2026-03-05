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

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...options.headers
    }
  });

  hostLastCall.set(host, Date.now());

  if (!response.ok) {
    throw new Error(`Provider unavailable (${response.status})`);
  }

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

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      ...options.headers
    },
    body
  });

  hostLastCall.set(host, Date.now());

  if (!response.ok) {
    throw new Error(`Provider unavailable (${response.status})`);
  }

  const json = (await response.json()) as T;
  await cache.set(cacheKey, json, options.cacheTtlSeconds);
  return json;
};