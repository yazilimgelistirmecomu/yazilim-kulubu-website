const TR_MAP: Record<string, string> = {
  İ: 'i', I: 'i', ı: 'i', Ş: 's', ş: 's', Ğ: 'g', ğ: 'g', Ü: 'u', ü: 'u', Ö: 'o', ö: 'o', Ç: 'c', ç: 'c',
};

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .replace(/[İIıŞşĞğÜüÖöÇç]/g, (c) => TR_MAP[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}

/** Only http(s) URLs are ever rendered as links. */
export function safeHttpUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}
