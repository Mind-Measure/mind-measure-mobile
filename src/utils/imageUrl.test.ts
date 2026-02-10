import { describe, it, expect } from 'vitest';
import { getImageUrl } from './imageUrl';

describe('getImageUrl', () => {
  const baseUrl = 'https://mindmeasure-bucket.s3.eu-west-2.amazonaws.com/uploads/1707123456-abc.jpg';

  it('returns original URL when size is "original"', () => {
    expect(getImageUrl(baseUrl, 'original')).toBe(baseUrl);
  });

  it('returns original URL when size is omitted (default)', () => {
    expect(getImageUrl(baseUrl)).toBe(baseUrl);
  });

  it('returns thumbnail variant URL (-sm.webp)', () => {
    expect(getImageUrl(baseUrl, 'thumbnail')).toBe(
      'https://mindmeasure-bucket.s3.eu-west-2.amazonaws.com/uploads/1707123456-abc-sm.webp'
    );
  });

  it('returns medium variant URL (-md.webp)', () => {
    expect(getImageUrl(baseUrl, 'medium')).toBe(
      'https://mindmeasure-bucket.s3.eu-west-2.amazonaws.com/uploads/1707123456-abc-md.webp'
    );
  });

  it('handles .png extension', () => {
    const png = baseUrl.replace('.jpg', '.png');
    expect(getImageUrl(png, 'thumbnail')).toContain('-sm.webp');
  });

  it('returns original URL unchanged for non-image extensions', () => {
    const pdf = baseUrl.replace('.jpg', '.pdf');
    expect(getImageUrl(pdf, 'thumbnail')).toBe(pdf);
  });

  it('returns empty string for null/undefined/empty URLs', () => {
    expect(getImageUrl(null)).toBe('');
    expect(getImageUrl(undefined)).toBe('');
    expect(getImageUrl('')).toBe('');
  });

  it('returns original URL if there is no file extension', () => {
    const noExt = 'https://bucket.s3.amazonaws.com/uploads/abc123';
    expect(getImageUrl(noExt, 'thumbnail')).toBe(noExt);
  });
});
