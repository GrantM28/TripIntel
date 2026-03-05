export const sanitizeLocationText = (value: string): string =>
  value.trim().replace(/[<>]/g, "").slice(0, 160);