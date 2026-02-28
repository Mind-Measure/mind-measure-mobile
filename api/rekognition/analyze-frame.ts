// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import { RekognitionClient, DetectFacesCommand } from '@aws-sdk/client-rekognition';

/* ── Inline retry ──────────────────────────────────────────────── */
const RETRYABLE_ERROR_CODES = new Set([
  'ThrottlingException', 'TooManyRequestsException', 'ProvisionedThroughputExceededException',
  'ServiceUnavailableException', 'InternalServerException', 'RequestTimeout',
  'ECONNRESET', 'ETIMEDOUT', 'EPIPE',
]);
async function withRetry<T>(fn: () => Promise<T>, opts: { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number } = {}): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500, maxDelayMs = 4000 } = opts;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); } catch (err: unknown) {
      lastError = err;
      const errCode = (err as Record<string, unknown>)?.name as string || (err as Record<string, unknown>)?.code as string || '';
      const statusCode = (err as Record<string, unknown>)?.$metadata ? ((err as Record<string, unknown>).$metadata as Record<string, unknown>)?.httpStatusCode : undefined;
      const isRetryable = RETRYABLE_ERROR_CODES.has(errCode) || (typeof statusCode === 'number' && (statusCode === 429 || statusCode >= 500));
      if (!isRetryable || attempt === maxAttempts) throw err;
      const jitter = Math.random() * 200;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1) + jitter, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData, timestamp } = req.body;

    if (!imageData) {
      return res.status(400).json({ error: 'Missing imageData' });
    }

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Analyze with AWS Rekognition
    const detectFacesCommand = new DetectFacesCommand({
      Image: { Bytes: imageBuffer },
      Attributes: ['ALL'], // Request all attributes including emotions
    });

    const rekognitionResponse = await withRetry(() => rekognitionClient.send(detectFacesCommand));

    interface EmotionResult {
      type: string | undefined;
      confidence: number | undefined;
    }

    interface AgeRangeResult {
      low: number | undefined;
      high: number | undefined;
    }

    interface GenderResult {
      value: string | undefined;
      confidence: number | undefined;
    }

    let analysisResult = {
      timestamp: timestamp || Date.now(),
      faceDetected: false,
      brightness: 128, // Default brightness
      emotions: [] as EmotionResult[],
      dominantEmotion: null as string | null,
      confidence: 0,
      smile: false,
      eyesOpen: false,
      mouthOpen: false,
      ageRange: null as AgeRangeResult | null,
      gender: null as GenderResult | null,
    };

    if (rekognitionResponse.FaceDetails && rekognitionResponse.FaceDetails.length > 0) {
      const faceDetails = rekognitionResponse.FaceDetails[0]; // Focus on the most prominent face

      analysisResult = {
        ...analysisResult,
        faceDetected: true,
        emotions:
          faceDetails.Emotions?.map((e) => ({
            type: e.Type,
            confidence: e.Confidence,
          })) || [],
        dominantEmotion:
          faceDetails.Emotions?.sort((a, b) => (b.Confidence || 0) - (a.Confidence || 0))[0]?.Type || null,
        confidence: faceDetails.Confidence || 0,
        smile: faceDetails.Smile?.Value || false,
        eyesOpen: faceDetails.EyesOpen?.Value || false,
        mouthOpen: faceDetails.MouthOpen?.Value || false,
        ageRange: faceDetails.AgeRange
          ? {
              low: faceDetails.AgeRange.Low,
              high: faceDetails.AgeRange.High,
            }
          : null,
        gender: faceDetails.Gender
          ? {
              value: faceDetails.Gender.Value,
              confidence: faceDetails.Gender.Confidence,
            }
          : null,
        brightness: faceDetails.Quality?.Brightness || 128,
      };
    }

    res.status(200).json(analysisResult);
  } catch (error) {
    console.error('❌ Rekognition analysis error:', error);
    res.status(500).json({
      error: 'Rekognition analysis failed',
      details: (error as Error).message,
    });
  }
}
