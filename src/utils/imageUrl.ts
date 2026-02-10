/**
 * Derives optimised image variant URLs from an original S3 URL.
 *
 * Convention:
 *   original:  https://bucket.s3.../uploads/abc123.jpg
 *   medium:    https://bucket.s3.../uploads/abc123-md.webp  (800 px)
 *   thumbnail: https://bucket.s3.../uploads/abc123-sm.webp  (200 px)
 *
 * If the URL is falsy or not an S3 image URL, the original is returned
 * unchanged (graceful degradation for legacy / non-image content).
 */

export type ImageSize = 'original' | 'medium' | 'thumbnail';

const SUFFIX_MAP: Record<Exclude<ImageSize, 'original'>, string> = {
  medium: '-md',
  thumbnail: '-sm',
};

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

/**
 * Get the URL for a specific image size variant.
 *
 * @param url      The original image URL (as stored in the database).
 * @param size     Which variant to request.
 * @returns        The variant URL, or the original URL as fallback.
 */
export function getImageUrl(url: string | undefined | null, size: ImageSize = 'original'): string {
  if (!url) return '';
  if (size === 'original') return url;

  // Only transform S3 URLs with known image extensions
  const dotIdx = url.lastIndexOf('.');
  if (dotIdx === -1) return url;

  const ext = url
    .slice(dotIdx + 1)
    .toLowerCase()
    .split('?')[0]; // strip query params
  if (!IMAGE_EXTENSIONS.has(ext)) return url;

  const base = url.slice(0, dotIdx);
  const suffix = SUFFIX_MAP[size];

  return `${base}${suffix}.webp`;
}
