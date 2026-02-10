import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckinEnrichmentService, ENRICHMENT_MODE } from './enrichmentService';
import type { CheckinEnrichmentInput } from './enrichmentService';

// ── Mock the Bedrock text analyzer ──────────────────────────────────────────
const mockAnalyzeTextWithBedrock = vi.fn();

vi.mock('./analyzers/bedrockTextAnalyzer', () => ({
  analyzeTextWithBedrock: (...args: any[]) => mockAnalyzeTextWithBedrock(...args),
}));

// ── Mock the audio extractor ────────────────────────────────────────────────
const mockAudioExtract = vi.fn();

vi.mock('./extractors/audioFeatures', () => {
  class MockCheckinAudioExtractor {
    extract = mockAudioExtract;
  }
  return { CheckinAudioExtractor: MockCheckinAudioExtractor };
});

// ── Mock the visual extractor ───────────────────────────────────────────────
const mockVisualExtract = vi.fn();

vi.mock('./extractors/visualFeatures', () => {
  class MockCheckinVisualExtractor {
    extract = mockVisualExtract;
  }
  return { CheckinVisualExtractor: MockCheckinVisualExtractor };
});

// ── Mock the fusion engine ──────────────────────────────────────────────────
vi.mock('./fusion/fusionEngine', () => {
  class MockCheckinFusionEngine {
    normalizeAudioFeatures() {
      return 60;
    }
    normalizeVisualFeatures() {
      return 55;
    }
  }
  return { CheckinFusionEngine: MockCheckinFusionEngine };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockAudioExtract.mockResolvedValue(null);
  mockVisualExtract.mockResolvedValue(null);
});

// Helper to create a default text result
function makeTextResult(overrides = {}) {
  return {
    version: 'v1.0',
    text_score: 65,
    mood_score: 7,
    uncertainty: 0.2,
    themes: ['sleep', 'stress'],
    keywords: ['tired', 'exam'],
    risk_level: 'none',
    direction_of_change: 'better',
    conversation_summary: 'Student is doing okay.',
    drivers_positive: ['exercise'],
    drivers_negative: ['workload'],
    notable_quotes: [],
    ...overrides,
  };
}

function makeInput(overrides: Partial<CheckinEnrichmentInput> = {}): CheckinEnrichmentInput {
  return {
    userId: 'user-1',
    transcript: 'I am doing well today. Feeling good about my studies.',
    duration: 120,
    sessionId: 'session-1',
    ...overrides,
  };
}

// ============================================================================
// Module constants
// ============================================================================

describe('CheckinEnrichmentService – constants', () => {
  it('exports ENRICHMENT_MODE as checkin23_bounded', () => {
    expect(ENRICHMENT_MODE).toBe('checkin23_bounded');
  });
});

// ============================================================================
// Text-only enrichment
// ============================================================================

describe('CheckinEnrichmentService – text-only enrichment', () => {
  it('returns a result with text-only scoring when no audio/video provided', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(makeTextResult({ text_score: 72 }));

    const service = new CheckinEnrichmentService();
    const result = await service.enrichCheckIn(makeInput());

    expect(result.finalScore).toBe(72);
    expect(result.mind_measure_score).toBe(72);
    expect(result.assessment_type).toBe('checkin');
  });

  it('passes through themes from text analysis', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(makeTextResult({ themes: ['sleep', 'anxiety', 'friends'] }));

    const service = new CheckinEnrichmentService();
    const result = await service.enrichCheckIn(makeInput());

    expect(result.themes).toEqual(['sleep', 'anxiety', 'friends']);
  });

  it('passes through drivers from text analysis', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(
      makeTextResult({
        drivers_positive: ['good sleep'],
        drivers_negative: ['exam stress'],
      })
    );

    const service = new CheckinEnrichmentService();
    const result = await service.enrichCheckIn(makeInput());

    expect(result.drivers_positive).toEqual(['good sleep']);
    expect(result.drivers_negative).toEqual(['exam stress']);
  });

  it('passes through risk_level and direction_of_change', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(
      makeTextResult({ risk_level: 'moderate', direction_of_change: 'worse' })
    );

    const service = new CheckinEnrichmentService();
    const result = await service.enrichCheckIn(makeInput());

    expect(result.risk_level).toBe('moderate');
    expect(result.direction_of_change).toBe('worse');
  });

  it('passes through mood_score and uncertainty from Bedrock', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(makeTextResult({ mood_score: 8, uncertainty: 0.15 }));

    const service = new CheckinEnrichmentService();
    const result = await service.enrichCheckIn(makeInput());

    expect(result.mood_score).toBe(8);
    expect(result.uncertainty).toBe(0.15);
  });

  it('records correct metadata', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(makeTextResult());

    const service = new CheckinEnrichmentService();
    const input = makeInput({ transcript: 'Hello world', duration: 60, sessionId: 'sess-42' });
    const result = await service.enrichCheckIn(input);

    expect(result.transcript_length).toBe(11);
    expect(result.duration).toBe(60);
    expect(result.session_id).toBe('sess-42');
    expect(result.processing_time_ms).toBeGreaterThanOrEqual(0);
  });

  it('text modality confidence equals 1 - uncertainty', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(makeTextResult({ uncertainty: 0.3 }));

    const service = new CheckinEnrichmentService();
    const result = await service.enrichCheckIn(makeInput());

    expect(result.modalities.text.confidence).toBeCloseTo(0.7);
  });
});

// ============================================================================
// Error handling
// ============================================================================

describe('CheckinEnrichmentService – error handling', () => {
  it('throws when text analysis fails', async () => {
    mockAnalyzeTextWithBedrock.mockRejectedValue(new Error('Bedrock unavailable'));

    const service = new CheckinEnrichmentService();
    await expect(service.enrichCheckIn(makeInput())).rejects.toThrow('Bedrock unavailable');
  });

  it('degrades gracefully when audio extraction rejects', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(makeTextResult({ text_score: 70 }));
    // Audio extractor fails immediately
    mockAudioExtract.mockRejectedValue(new Error('extraction failed'));

    const service = new CheckinEnrichmentService();
    const input = makeInput({ audioBlob: new Blob(['audio']) });
    const result = await service.enrichCheckIn(input);

    // Should still return a result with text-only score
    expect(result.finalScore).toBe(70);
    expect(result.audio_features).toBeNull();
  });

  it('degrades gracefully when visual extraction rejects', async () => {
    mockAnalyzeTextWithBedrock.mockResolvedValue(makeTextResult({ text_score: 70 }));
    mockVisualExtract.mockRejectedValue(new Error('visual extraction failed'));

    const service = new CheckinEnrichmentService();
    // Need at least 1 videoFrame to trigger visual extraction
    const fakeImageData = { width: 10, height: 10, data: new Uint8ClampedArray(400) } as unknown as ImageData;
    const input = makeInput({ videoFrames: [fakeImageData] });
    const result = await service.enrichCheckIn(input);

    expect(result.finalScore).toBe(70);
    expect(result.visual_features).toBeNull();
  });
});
