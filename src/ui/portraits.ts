/** Where the portrait of a figure is served from; the images are built by scripts/build-portraits.py. */
export function portraitSrc(slug: string): string {
  return `${import.meta.env.BASE_URL}portraits/${slug}.webp`;
}
