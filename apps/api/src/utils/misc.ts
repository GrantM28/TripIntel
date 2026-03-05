import { createHash } from "node:crypto";

export const hashKey = (value: string): string =>
  createHash("sha1").update(value).digest("hex");

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));