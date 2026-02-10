import { describe, it, expect } from 'vitest';
import { CheckinAudioExtractor } from './audioFeatures';

// We test the *public helper methods* by accessing them through the prototype.
// The main `extract()` method needs AudioContext (browser API) so we test the
// pure-math helpers that drive feature extraction instead.
//
// We cast `extractor` to `any` to access private methods for unit testing.

describe('CheckinAudioExtractor', () => {
  const extractor = new CheckinAudioExtractor() as any;

  // ─── downsample ────────────────────────────────────────────────────────
  describe('downsample', () => {
    it('returns same data when fromRate <= toRate', () => {
      const data = new Float32Array([1, 2, 3, 4]);
      const result = extractor.downsample(data, 8000, 8000);
      expect(result).toBe(data); // same reference
    });

    it('downsamples 48kHz to 8kHz (factor 6)', () => {
      // 12 samples at 48kHz → 2 samples at 8kHz
      const data = new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      const result = extractor.downsample(data, 48000, 8000);
      expect(result.length).toBe(2);
      // index 0 → src 0 → 0, index 1 → src 6 → 6
      expect(result[0]).toBe(0);
      expect(result[1]).toBe(6);
    });

    it('handles small arrays', () => {
      const data = new Float32Array([42]);
      const result = extractor.downsample(data, 16000, 8000);
      // 1 sample / 2 factor → 0 output samples
      expect(result.length).toBe(0);
    });
  });

  // ─── sampleAudioChunks ────────────────────────────────────────────────
  describe('sampleAudioChunks', () => {
    it('returns full data when duration <= maxDuration', () => {
      const data = new Float32Array(8000 * 10); // 10 seconds at 8kHz
      const result = extractor.sampleAudioChunks(data, 8000, 10, 30);
      expect(result).toBe(data); // same reference — no slicing needed
    });

    it('samples 3 × 10s windows for long audio (60s)', () => {
      const sampleRate = 8000;
      const duration = 60;
      const totalSamples = sampleRate * duration;
      const data = new Float32Array(totalSamples);
      // Fill with index-based values for verification
      for (let i = 0; i < totalSamples; i++) data[i] = i;

      const result = extractor.sampleAudioChunks(data, sampleRate, duration, 30);
      // 3 windows × 10s × 8000 = 240,000 samples
      expect(result.length).toBe(3 * 10 * sampleRate);
    });
  });

  // ─── computeLinearTrend ───────────────────────────────────────────────
  describe('computeLinearTrend', () => {
    it('returns 0 for a single-element series', () => {
      expect(extractor.computeLinearTrend([5])).toBe(0);
    });

    it('returns positive slope for ascending series', () => {
      const slope = extractor.computeLinearTrend([1, 2, 3, 4, 5]);
      expect(slope).toBeGreaterThan(0);
      expect(slope).toBeCloseTo(1, 5);
    });

    it('returns negative slope for descending series', () => {
      const slope = extractor.computeLinearTrend([5, 4, 3, 2, 1]);
      expect(slope).toBeLessThan(0);
    });

    it('returns ~0 slope for flat series', () => {
      const slope = extractor.computeLinearTrend([3, 3, 3, 3]);
      expect(slope).toBeCloseTo(0, 5);
    });
  });

  // ─── computeJitter ────────────────────────────────────────────────────
  describe('computeJitter', () => {
    it('returns null for fewer than 2 values', () => {
      expect(extractor.computeJitter([120])).toBeNull();
    });

    it('returns 0 for identical pitches', () => {
      const jitter = extractor.computeJitter([200, 200, 200, 200]);
      expect(jitter).toBe(0);
    });

    it('returns non-zero for varying pitches', () => {
      const jitter = extractor.computeJitter([100, 120, 110, 130, 115]);
      expect(jitter).toBeGreaterThan(0);
      expect(jitter).toBeLessThan(1); // should be a fraction
    });

    it('returns null when avgF0 is 0', () => {
      // All zeros
      const jitter = extractor.computeJitter([0, 0, 0]);
      expect(jitter).toBeNull();
    });
  });

  // ─── computePitchDynamics ─────────────────────────────────────────────
  describe('computePitchDynamics', () => {
    it('returns 0 for single element', () => {
      expect(extractor.computePitchDynamics([100])).toBe(0);
    });

    it('returns 0 for identical pitches', () => {
      expect(extractor.computePitchDynamics([150, 150, 150])).toBe(0);
    });

    it('returns average absolute difference', () => {
      // |200-100| + |150-200| = 100 + 50 = 150, / 2 = 75
      expect(extractor.computePitchDynamics([100, 200, 150])).toBe(75);
    });
  });

  // ─── estimateFilledPauses ─────────────────────────────────────────────
  describe('estimateFilledPauses', () => {
    it('counts short speech bursts (100-500ms) as filled pauses', () => {
      const segments = [
        { start: 0, end: 0.3, isSpeech: true }, // 300ms → filled pause
        { start: 0.3, end: 1.0, isSpeech: false }, // pause
        { start: 1.0, end: 2.5, isSpeech: true }, // 1500ms → normal speech
        { start: 2.5, end: 2.7, isSpeech: true }, // 200ms → filled pause
      ];
      expect(extractor.estimateFilledPauses(segments)).toBe(2);
    });

    it('returns 0 when no short bursts', () => {
      const segments = [
        { start: 0, end: 3, isSpeech: true },
        { start: 3, end: 4, isSpeech: false },
      ];
      expect(extractor.estimateFilledPauses(segments)).toBe(0);
    });
  });

  // ─── detectSpeechSegments / computeEnergyThreshold ────────────────────
  describe('detectSpeechSegments', () => {
    it('detects speech and silence regions from energy values', () => {
      // Build an energy series with a clear contrast: many low values, then high values
      // Threshold = 1.5 × 40th-percentile. We need enough low frames so the 40th percentile
      // is in the low region, and high frames clearly above 1.5× that.
      const lowCount = 20;
      const highCount = 20;
      const energy: number[] = [
        ...Array(lowCount).fill(0.01), // silence (40th pctile ~ 0.01, threshold ~ 0.015)
        ...Array(highCount).fill(0.5), // speech (well above 0.015)
        ...Array(10).fill(0.01), // trailing silence
      ];
      const segments = extractor.detectSpeechSegments(energy);
      // Should have at least one speech and one non-speech segment
      const speechSegments = segments.filter((s: any) => s.isSpeech);
      const silenceSegments = segments.filter((s: any) => !s.isSpeech);
      expect(speechSegments.length).toBeGreaterThan(0);
      expect(silenceSegments.length).toBeGreaterThan(0);
    });

    it('returns empty for empty energy series', () => {
      const segments = extractor.detectSpeechSegments([]);
      expect(segments).toEqual([]);
    });
  });

  // ─── findPeaks ────────────────────────────────────────────────────────
  describe('findPeaks', () => {
    it('finds peaks above 60% of max', () => {
      //  indices:  0   1   2   3   4   5   6
      const series = [0.1, 0.8, 0.3, 0.2, 0.9, 0.3, 0.1];
      const peaks = extractor.findPeaks(series);
      // Peak at index 1 (0.8 > 0.6*0.9=0.54) and index 4 (0.9 > 0.54)
      expect(peaks).toContain(1);
      expect(peaks).toContain(4);
    });

    it('returns empty for monotonic series', () => {
      const peaks = extractor.findPeaks([1, 2, 3, 4, 5]);
      expect(peaks).toEqual([]);
    });
  });

  // ─── extractEnergySeriesFrames ────────────────────────────────────────
  describe('extractEnergySeriesFrames', () => {
    it('computes RMS energy for each frame', () => {
      // 8kHz, 20ms frame = 160 samples
      // Create 320 samples (2 frames)
      const data = new Float32Array(320);
      data.fill(0.5); // constant amplitude
      const energy = extractor.extractEnergySeriesFrames(data);
      expect(energy.length).toBe(2);
      // RMS of constant 0.5 = 0.5
      expect(energy[0]).toBeCloseTo(0.5, 2);
    });

    it('returns empty for data shorter than one frame', () => {
      const data = new Float32Array(10); // too short for a 160-sample frame
      const energy = extractor.extractEnergySeriesFrames(data);
      expect(energy.length).toBe(0);
    });
  });

  // ─── mergeShortSegments ───────────────────────────────────────────────
  describe('mergeShortSegments', () => {
    it('merges segments shorter than minDuration into previous', () => {
      const segments = [
        { start: 0, end: 1.0, isSpeech: true }, // 1s — kept
        { start: 1.0, end: 1.1, isSpeech: false }, // 0.1s — merged
        { start: 1.1, end: 3.0, isSpeech: true }, // 1.9s — kept
      ];
      const merged = extractor.mergeShortSegments(segments, 0.2);
      // The tiny 0.1s pause should be merged into the first speech segment
      expect(merged.length).toBe(2);
      expect(merged[0].end).toBe(1.1); // extended
    });

    it('keeps all segments when all are long enough', () => {
      const segments = [
        { start: 0, end: 1, isSpeech: true },
        { start: 1, end: 2, isSpeech: false },
      ];
      const merged = extractor.mergeShortSegments(segments, 0.2);
      expect(merged.length).toBe(2);
    });
  });

  // ─── computeQuality ──────────────────────────────────────────────────
  describe('computeQuality', () => {
    it('returns high quality for normal features', () => {
      const pitch = { meanPitch: 180 };
      const timing = { speechRatio: 0.7 };
      const energy = { voiceEnergy: 0.05 };
      const segments = [
        { start: 0, end: 1, isSpeech: true },
        { start: 1, end: 2, isSpeech: true },
        { start: 2, end: 3, isSpeech: true },
      ];
      const q = extractor.computeQuality(pitch, timing, energy, segments);
      expect(q).toBeGreaterThanOrEqual(0.9);
      expect(q).toBeLessThanOrEqual(1.0);
    });

    it('penalises extreme pitch', () => {
      const pitch = { meanPitch: 50 }; // too low
      const timing = { speechRatio: 0.7 };
      const energy = { voiceEnergy: 0.05 };
      const segments = Array(5).fill({ start: 0, end: 1, isSpeech: true });
      const q = extractor.computeQuality(pitch, timing, energy, segments);
      expect(q).toBeLessThan(1.0);
    });

    it('penalises low speech ratio', () => {
      const pitch = { meanPitch: 180 };
      const timing = { speechRatio: 0.1 }; // very low
      const energy = { voiceEnergy: 0.05 };
      const segments = Array(5).fill({ start: 0, end: 1, isSpeech: true });
      const q = extractor.computeQuality(pitch, timing, energy, segments);
      expect(q).toBeLessThan(1.0);
    });

    it('clamps quality to min 0.3', () => {
      const pitch = { meanPitch: 0 };
      const timing = { speechRatio: 0.1 };
      const energy = { voiceEnergy: 0.0001 };
      const segments = [{ start: 0, end: 0.5, isSpeech: true }]; // only 1 speech segment
      const q = extractor.computeQuality(pitch, timing, energy, segments);
      expect(q).toBeGreaterThanOrEqual(0.3);
    });
  });
});
