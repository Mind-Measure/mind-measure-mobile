/**
 * Retry with exponential backoff for AWS SDK calls.
 *
 * Retries on throttling, transient network errors, and server errors.
 * Does NOT retry on client errors (4xx other than 429).
 */

const RETRYABLE_ERROR_CODES = new Set([
  'ThrottlingException',
  'TooManyRequestsException',
  'ProvisionedThroughputExceededException',
  'ServiceUnavailableException',
  'InternalServerException',
  'RequestTimeout',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
]);

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500, maxDelayMs = 4000 } = opts;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      const errCode = (err as Record<string, unknown>)?.name as string
        || (err as Record<string, unknown>)?.code as string
        || '';
      const statusCode = (err as Record<string, unknown>)?.$metadata
        ? ((err as Record<string, unknown>).$metadata as Record<string, unknown>)?.httpStatusCode
        : undefined;

      const isRetryable =
        RETRYABLE_ERROR_CODES.has(errCode) ||
        (typeof statusCode === 'number' && (statusCode === 429 || statusCode >= 500));

      if (!isRetryable || attempt === maxAttempts) {
        throw err;
      }

      const jitter = Math.random() * 200;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + jitter, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
