/** Prefiks bazy Vite (GitHub Pages: /panda-ninja/). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  const clean = path.replace(/^\//, '');
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${clean}`;
}

/** Prefiks + wariant z korzenia — gdy dev ma przypadkowe VITE_BASE. */
export function assetCandidates(path: string): string[] {
  const prefixed = assetUrl(path);
  const fromRoot = `/${path.replace(/^\//, '')}`;
  return prefixed === fromRoot ? [prefixed] : [prefixed, fromRoot];
}
