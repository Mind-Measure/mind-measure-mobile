// @ts-nocheck
/**
 * Rekognition API - Analyze Video Frames
 *
 * Server-side endpoint that uses AWS Rekognition to analyze facial features
 * from video frames captured during baseline or check-in assessments.
 *
 * Endpoint: POST /api/rekognition/analyze-frames
 * Auth: Required (via Cognito token)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
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

const MAX_FRAMES = 20;

// Initialize Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get frames from request body (base64 encoded images)
    const { frames } = req.body;

    if (!frames || !Array.isArray(frames) || frames.length === 0) {
      return res.status(400).json({ error: 'No frames provided' });
    }

    // Analyze each frame with Rekognition (capped to MAX_FRAMES)
    const cappedFrames = frames.slice(0, MAX_FRAMES);
    const analyses = await Promise.all(
      cappedFrames.map(async (frameBase64: string, index: number) => {
        try {
          // Convert base64 to buffer
          const imageBuffer = Buffer.from(frameBase64, 'base64');

          // Call Rekognition DetectFaces with attributes
          const command = new DetectFacesCommand({
            Image: {
              Bytes: imageBuffer,
            },
            Attributes: ['ALL'], // Get all facial attributes
          });

          const response = await withRetry(() => rekognitionClient.send(command));

          if (!response.FaceDetails || response.FaceDetails.length === 0) {
            return null;
          }

          // Return the first (primary) face details
          const face = response.FaceDetails[0];

          return {
            frameIndex: index,
            confidence: face.Confidence,

            // Emotions
            emotions: face.Emotions?.map((e) => ({
              type: e.Type,
              confidence: e.Confidence,
            })),

            // Facial features
            smile: face.Smile,
            eyesOpen: face.EyesOpen,
            mouthOpen: face.MouthOpen,
            eyeglasses: face.Eyeglasses,
            sunglasses: face.Sunglasses,
            beard: face.Beard,
            mustache: face.Mustache,

            // Quality metrics
            brightness: face.Quality?.Brightness,
            sharpness: face.Quality?.Sharpness,

            // Pose (head orientation)
            pose: {
              roll: face.Pose?.Roll,
              yaw: face.Pose?.Yaw,
              pitch: face.Pose?.Pitch,
            },

            // Landmarks (for advanced features)
            landmarks: face.Landmarks?.map((l) => ({
              type: l.Type,
              x: l.X,
              y: l.Y,
            })),
          };
        } catch (error) {
          console.error(`[Rekognition API] Error analyzing frame ${index}:`, error);
          return null;
        }
      })
    );

    // Filter out failed analyses
    const validAnalyses = analyses.filter((a) => a !== null);

    return res.status(200).json({
      success: true,
      totalFrames: cappedFrames.length,
      analyzedFrames: validAnalyses.length,
      analyses: validAnalyses,
    });
  } catch (error) {
    console.error('[Rekognition API] ❌ Error:', error);
    return res.status(500).json({
      error: 'Failed to analyze frames',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
