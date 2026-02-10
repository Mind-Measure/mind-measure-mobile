import { describe, it, expect } from 'vitest';
import {
  extractAssessmentFromTranscript,
  calculateClinicalScores,
  calculateMindMeasureComposite,
  validateAssessmentData,
  type PhqResponses,
  type AssessmentState,
} from './baselineScoring';

// ────────────────────────────────────────────────────────
// extractAssessmentFromTranscript
// ────────────────────────────────────────────────────────

describe('extractAssessmentFromTranscript', () => {
  it('returns default zeros when transcript is empty', () => {
    const result = extractAssessmentFromTranscript('');
    expect(result.moodScore).toBeNull();
    expect(result.phqResponses.phq2_q1).toBe(0);
    expect(result.phqResponses.phq2_q2).toBe(0);
    expect(result.phqResponses.gad2_q1).toBe(0);
    expect(result.phqResponses.gad2_q2).toBe(0);
  });

  it('extracts all five question responses from a full transcript', () => {
    const transcript = [
      'agent: Welcome. Let me ask you question one.',
      'user: Not at all',
      'agent: Thank you. Now question two.',
      'user: Several days',
      'agent: Okay. Question three.',
      'user: More than half the days',
      'agent: Question four.',
      'user: Nearly every day',
      'agent: And finally, question five. On a scale of 1-10, how are you feeling?',
      'user: I would say about 7',
    ].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.phqResponses.phq2_q1).toBe(0); // not at all
    expect(result.phqResponses.phq2_q2).toBe(1); // several days
    expect(result.phqResponses.gad2_q1).toBe(2); // more than half
    expect(result.phqResponses.gad2_q2).toBe(3); // nearly every day
    expect(result.moodScore).toBe(7);
  });

  it('handles word numbers for question labels ("question one", etc.)', () => {
    const transcript = [
      'agent: Let me start with question one.',
      'user: Not at all',
      'agent: Now question two.',
      'user: Not at all',
    ].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.phqResponses.phq2_q1).toBe(0);
    expect(result.phqResponses.phq2_q2).toBe(0);
  });

  it('handles digit numbers for question labels ("question 1", etc.)', () => {
    const transcript = [
      'agent: Here is question 1.',
      'user: Several days',
      'agent: And question 2.',
      'user: Nearly every day',
    ].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.phqResponses.phq2_q1).toBe(1);
    expect(result.phqResponses.phq2_q2).toBe(3);
  });

  it('keeps the LAST response when a question is repeated', () => {
    const transcript = [
      'agent: Question one.',
      'user: Not at all',
      'agent: Sorry, let me repeat question one.',
      'user: Several days',
    ].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    // Should be "several days" (1), not "not at all" (0)
    expect(result.phqResponses.phq2_q1).toBe(1);
  });

  it('extracts mood from a word number ("seven")', () => {
    const transcript = ['agent: Question five. How would you rate your mood?', 'user: I would say seven'].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.moodScore).toBe(7);
  });

  it('extracts mood from a digit ("8")', () => {
    const transcript = ['agent: And question 5.', 'user: 8'].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.moodScore).toBe(8);
  });

  it('extracts mood score of 10', () => {
    const transcript = ['agent: Question five.', 'user: 10'].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.moodScore).toBe(10);
  });

  it('returns null mood when question 5 is not asked', () => {
    const transcript = ['agent: Question one.', 'user: Not at all'].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.moodScore).toBeNull();
  });

  it('defaults unanswered frequency questions to 0', () => {
    // Only Q1 is answered; Q2-Q4 should default to 0
    const transcript = ['agent: Question one.', 'user: Nearly every day'].join('\n');

    const result = extractAssessmentFromTranscript(transcript);
    expect(result.phqResponses.phq2_q1).toBe(3);
    expect(result.phqResponses.phq2_q2).toBe(0);
    expect(result.phqResponses.gad2_q1).toBe(0);
    expect(result.phqResponses.gad2_q2).toBe(0);
  });
});

// ────────────────────────────────────────────────────────
// calculateClinicalScores
// ────────────────────────────────────────────────────────

describe('calculateClinicalScores', () => {
  it('calculates PHQ-2 and GAD-2 totals correctly', () => {
    const phq: PhqResponses = { phq2_q1: 2, phq2_q2: 3, gad2_q1: 1, gad2_q2: 0 };
    const result = calculateClinicalScores(phq, 7);

    expect(result.phq2_total).toBe(5);
    expect(result.gad2_total).toBe(1);
    expect(result.mood_scale).toBe(7);
  });

  it('flags PHQ-2 positive screen when total >= 3', () => {
    const phq: PhqResponses = { phq2_q1: 2, phq2_q2: 1, gad2_q1: 0, gad2_q2: 0 };
    const result = calculateClinicalScores(phq, 5);
    expect(result.phq2_positive_screen).toBe(true);
  });

  it('does NOT flag PHQ-2 positive screen when total < 3', () => {
    const phq: PhqResponses = { phq2_q1: 1, phq2_q2: 1, gad2_q1: 0, gad2_q2: 0 };
    const result = calculateClinicalScores(phq, 5);
    expect(result.phq2_positive_screen).toBe(false);
  });

  it('flags GAD-2 positive screen when total >= 3', () => {
    const phq: PhqResponses = { phq2_q1: 0, phq2_q2: 0, gad2_q1: 2, gad2_q2: 1 };
    const result = calculateClinicalScores(phq, 5);
    expect(result.gad2_positive_screen).toBe(true);
  });

  it('does NOT flag GAD-2 positive screen when total < 3', () => {
    const phq: PhqResponses = { phq2_q1: 0, phq2_q2: 0, gad2_q1: 1, gad2_q2: 1 };
    const result = calculateClinicalScores(phq, 5);
    expect(result.gad2_positive_screen).toBe(false);
  });

  it('defaults mood to 5 when moodScore is null', () => {
    const phq: PhqResponses = { phq2_q1: 0, phq2_q2: 0, gad2_q1: 0, gad2_q2: 0 };
    const result = calculateClinicalScores(phq, null);
    expect(result.mood_scale).toBe(5);
  });

  it('handles all-zero responses (best outcome)', () => {
    const phq: PhqResponses = { phq2_q1: 0, phq2_q2: 0, gad2_q1: 0, gad2_q2: 0 };
    const result = calculateClinicalScores(phq, 10);
    expect(result.phq2_total).toBe(0);
    expect(result.gad2_total).toBe(0);
    expect(result.phq2_positive_screen).toBe(false);
    expect(result.gad2_positive_screen).toBe(false);
  });

  it('handles max responses (worst outcome)', () => {
    const phq: PhqResponses = { phq2_q1: 3, phq2_q2: 3, gad2_q1: 3, gad2_q2: 3 };
    const result = calculateClinicalScores(phq, 1);
    expect(result.phq2_total).toBe(6);
    expect(result.gad2_total).toBe(6);
    expect(result.phq2_positive_screen).toBe(true);
    expect(result.gad2_positive_screen).toBe(true);
  });
});

// ────────────────────────────────────────────────────────
// calculateMindMeasureComposite
// ────────────────────────────────────────────────────────

describe('calculateMindMeasureComposite', () => {
  it('returns 100 for a perfectly healthy assessment', () => {
    // PHQ-2: 0 (inverted = 100), GAD-2: 0 (inverted = 100), mood: 10 (= 100)
    const clinical = {
      phq2_total: 0,
      gad2_total: 0,
      mood_scale: 10,
      phq2_positive_screen: false,
      gad2_positive_screen: false,
    };
    const result = calculateMindMeasureComposite(clinical);
    expect(result.score).toBe(100);
  });

  it('returns 0 for worst-case assessment', () => {
    // PHQ-2: 6 (inverted = 0), GAD-2: 6 (inverted = 0), mood: 1 (= 10)
    const clinical = {
      phq2_total: 6,
      gad2_total: 6,
      mood_scale: 1,
      phq2_positive_screen: true,
      gad2_positive_screen: true,
    };
    const result = calculateMindMeasureComposite(clinical);
    // 0*0.25 + 0*0.25 + 10*0.50 = 5
    expect(result.score).toBe(5);
  });

  it('weights mood at 50% of the composite', () => {
    // PHQ-2 and GAD-2 both 0 → 100 each
    // Mood: 5 → 50
    // Expected: 100*0.25 + 100*0.25 + 50*0.50 = 75
    const clinical = {
      phq2_total: 0,
      gad2_total: 0,
      mood_scale: 5,
      phq2_positive_screen: false,
      gad2_positive_screen: false,
    };
    const result = calculateMindMeasureComposite(clinical);
    expect(result.score).toBe(75);
  });

  it('weights PHQ-2 at 25% of the composite', () => {
    // PHQ-2: 6 (inverted = 0), GAD-2: 0 (100), mood: 10 (100)
    // Expected: 0*0.25 + 100*0.25 + 100*0.50 = 75
    const clinical = {
      phq2_total: 6,
      gad2_total: 0,
      mood_scale: 10,
      phq2_positive_screen: true,
      gad2_positive_screen: false,
    };
    const result = calculateMindMeasureComposite(clinical);
    expect(result.score).toBe(75);
  });

  it('clamps mood to 1-10 range before scaling', () => {
    const clinical = {
      phq2_total: 0,
      gad2_total: 0,
      mood_scale: 0, // below min 1
      phq2_positive_screen: false,
      gad2_positive_screen: false,
    };
    const result = calculateMindMeasureComposite(clinical);
    // mood clamped to 1 → scaled to 10
    // 100*0.25 + 100*0.25 + 10*0.50 = 55
    expect(result.score).toBe(55);
  });

  it('returns individual component breakdowns', () => {
    const clinical = {
      phq2_total: 3,
      gad2_total: 3,
      mood_scale: 5,
      phq2_positive_screen: true,
      gad2_positive_screen: true,
    };
    const result = calculateMindMeasureComposite(clinical);
    expect(result.phq2_component).toBeDefined();
    expect(result.gad2_component).toBeDefined();
    expect(result.mood_component).toBeDefined();
    // Components should sum approximately to the score (rounding may differ slightly)
    const componentSum = result.phq2_component + result.gad2_component + result.mood_component;
    expect(Math.abs(componentSum - result.score)).toBeLessThanOrEqual(2);
  });
});

// ────────────────────────────────────────────────────────
// validateAssessmentData
// ────────────────────────────────────────────────────────

describe('validateAssessmentData', () => {
  const validState: AssessmentState = {
    transcript: 'agent: Hello\nuser: Hi',
    phqResponses: { phq2_q1: 0, phq2_q2: 1, gad2_q1: 2, gad2_q2: 3 },
    moodScore: 7,
    startedAt: 1000,
    endedAt: 2000,
  };

  it('returns valid for a complete assessment state', () => {
    const result = validateAssessmentData(validState);
    expect(result.isValid).toBe(true);
    expect(result.details.missingQuestions).toEqual([]);
  });

  it('treats 0 as a valid response (not missing)', () => {
    const state: AssessmentState = {
      ...validState,
      phqResponses: { phq2_q1: 0, phq2_q2: 0, gad2_q1: 0, gad2_q2: 0 },
    };
    const result = validateAssessmentData(state);
    expect(result.isValid).toBe(true);
    expect(result.details.hasAllQuestions).toBe(true);
  });

  it('returns invalid when transcript is empty', () => {
    const result = validateAssessmentData({ ...validState, transcript: '' });
    expect(result.isValid).toBe(false);
    expect(result.details.hasTranscript).toBe(false);
  });

  it('returns invalid when moodScore is null', () => {
    const result = validateAssessmentData({ ...validState, moodScore: null });
    expect(result.isValid).toBe(false);
    expect(result.details.hasMood).toBe(false);
  });

  it('returns invalid when startedAt is null', () => {
    const result = validateAssessmentData({ ...validState, startedAt: null });
    expect(result.isValid).toBe(false);
    expect(result.details.hasDuration).toBe(false);
  });

  it('returns invalid when endedAt <= startedAt', () => {
    const result = validateAssessmentData({ ...validState, endedAt: 500 });
    expect(result.isValid).toBe(false);
    expect(result.details.hasDuration).toBe(false);
  });

  it('reports which questions are missing', () => {
    const state: AssessmentState = {
      ...validState,
      phqResponses: {
        phq2_q1: 1,
        phq2_q2: undefined as unknown as number,
        gad2_q1: 2,
        gad2_q2: undefined as unknown as number,
      },
    };
    const result = validateAssessmentData(state);
    expect(result.isValid).toBe(false);
    expect(result.details.missingQuestions).toContain('phq2_q2');
    expect(result.details.missingQuestions).toContain('gad2_q2');
  });
});
