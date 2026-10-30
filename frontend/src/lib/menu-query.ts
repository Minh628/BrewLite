export function parseCategoryParam(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function buildMenuUrl(
  pathname: string,
  category: number | null,
  q: string,
  extraQuery?: string,
): string {
  const params = new URLSearchParams(extraQuery ?? '');

  if (category !== null) {
    params.set('category', String(category));
  } else {
    params.delete('category');
  }

  const keyword = q.trim();
  if (keyword) {
    params.set('q', keyword);
  } else {
    params.delete('q');
  }

  const next = params.toString();
  return next ? `${pathname}?${next}` : pathname;
}
