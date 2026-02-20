import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';
const bittersweet = '#FF6B6B';
const lilac = '#DDD6FE';

interface Step {
  action: string;
  subject: string;
  color: string;
}

const CHECKIN_STEPS: Step[] = [
  { action: 'Capturing', subject: 'voice signal', color: bittersweet },
  { action: 'Measuring', subject: 'pitch', color: bittersweet },
  { action: 'Tracking', subject: 'speech rhythm', color: bittersweet },
  { action: '', subject: 'Pause patterns', color: bittersweet },
  { action: '', subject: 'Voice stability', color: bittersweet },
  { action: 'Tracking', subject: 'facial cues', color: buttercup },
  { action: '', subject: 'Eye contact', color: buttercup },
  { action: '', subject: 'Facial tension', color: buttercup },
  { action: '', subject: 'Emotional valence', color: buttercup },
  { action: 'Comparing to', subject: 'baseline', color: lilac },
  { action: 'Measuring', subject: 'variance', color: lilac },
  { action: '', subject: 'Energy shift', color: lilac },
  { action: 'Aligning', subject: 'multimodal signals', color: lilac },
  { action: '', subject: 'Fusion weights', color: lilac },
  { action: 'Recalculating', subject: 'score', color: lilac },
  { action: 'Finalising', subject: 'insight', color: lilac },
  { action: 'Parsing', subject: 'language', color: sinbad },
  { action: '', subject: 'Stress markers', color: sinbad },
  { action: '', subject: 'Coping signals', color: sinbad },
];

const BASELINE_STEPS: Step[] = [
  // Setup — sinbad (3)
  { action: 'Secure session', subject: 'initialised', color: sinbad },
  { action: 'Identity', subject: 'verified and encrypted', color: sinbad },
  { action: 'Baseline mode', subject: 'activated', color: sinbad },
  // Capture — bittersweet (4)
  { action: 'Conversational AI', subject: 'engaged', color: bittersweet },
  { action: 'Audio signal', subject: 'captured', color: bittersweet },
  { action: 'Facial signal', subject: 'captured', color: bittersweet },
  { action: 'Speech transcribed', subject: 'to text', color: bittersweet },
  // Clinical — buttercup (4)
  { action: 'PHQ-2 responses', subject: 'processed', color: buttercup },
  { action: 'GAD-2 responses', subject: 'processed', color: buttercup },
  { action: 'Linguistic sentiment', subject: 'analysed', color: buttercup },
  { action: 'Cognitive pattern markers', subject: 'extracted', color: buttercup },
  // Fusion + Calibration — lilac (8)
  { action: 'Vocal prosody features', subject: 'evaluated', color: lilac },
  { action: 'Facial affect signals', subject: 'interpreted', color: lilac },
  { action: 'Signal quality', subject: 'and confidence scored', color: lilac },
  { action: 'Multimodal features', subject: 'normalised', color: lilac },
  { action: 'Cross-modal fusion model', subject: 'executed', color: lilac },
  { action: 'Personal baseline', subject: 'calibrated', color: lilac },
  { action: 'Individual variance range', subject: 'established', color: lilac },
  { action: 'Personalised wellbeing score', subject: 'generated', color: lilac },
];

// Check-in grid: Row1: __●● Row2: ●●●●●●● Row3: ●●●●●●● Row4: ●●●____
const CHECKIN_GRID: (number | null)[] = [
  null,
  null,
  null,
  null,
  null,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  null,
  null,
  null,
  null,
];

// Baseline grid: Row1: ____●●● Row2: ●●●●●●● Row3: ●●●●●●● Row4: ●●_____
const BASELINE_GRID: (number | null)[] = [
  null,
  null,
  null,
  null,
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  null,
  null,
  null,
  null,
  null,
];

const COLS = 7;
const DOT_SIZE = 38;
const DOT_GAP = 8;
const STEP_INTERVAL = 750;
const SCORE_TWEEN_MS = 1500;
const SCORE_HOLD_MS = 2500;

interface ProcessingScreenProps {
  mode?: 'baseline' | 'checkin';
  previousScore?: number | null;
  newScore?: number | null;
  isFirstBaseline?: boolean;
  onScoreRevealed?: () => void;
}

export function ProcessingScreen({
  mode = 'checkin',
  previousScore = null,
  newScore = null,
  isFirstBaseline = false,
  onScoreRevealed,
}: ProcessingScreenProps) {
  const steps = mode === 'baseline' ? BASELINE_STEPS : CHECKIN_STEPS;
  const gridMap = mode === 'baseline' ? BASELINE_GRID : CHECKIN_GRID;

  const initialNumber = isFirstBaseline ? steps.length : (previousScore ?? 50);

  const [stepIndex, setStepIndex] = useState(-1);
  const [phase, setPhase] = useState<'processing' | 'revealing' | 'hold'>('processing');
  const [displayScore, setDisplayScore] = useState(initialNumber);
  const tweenRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== 'processing') return;

    setStepIndex(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= steps.length) {
        clearInterval(interval);
        return;
      }
      setStepIndex(current);
    }, STEP_INTERVAL);

    return () => clearInterval(interval);
  }, [phase, steps.length]);

  useEffect(() => {
    if (stepIndex < steps.length - 1) return;
    if (phase !== 'processing') return;

    timerRef.current = setTimeout(() => {
      setPhase('revealing');
    }, STEP_INTERVAL);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepIndex, phase, steps.length]);

  useEffect(() => {
    if (phase !== 'revealing') return;

    const target = newScore ?? initialNumber;
    const start = initialNumber;
    const diff = target - start;

    if (diff === 0) {
      setPhase('hold');
      return;
    }

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / SCORE_TWEEN_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(start + diff * eased));

      if (progress < 1) {
        tweenRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('hold');
      }
    };

    tweenRef.current = requestAnimationFrame(animate);

    return () => {
      if (tweenRef.current) cancelAnimationFrame(tweenRef.current);
    };
  }, [phase, newScore, initialNumber]);

  useEffect(() => {
    if (phase !== 'hold') return;

    timerRef.current = setTimeout(() => {
      onScoreRevealed?.();
    }, SCORE_HOLD_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase, onScoreRevealed]);

  useEffect(() => {
    return () => {
      if (tweenRef.current) cancelAnimationFrame(tweenRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < gridMap.length; i += COLS) {
    rows.push(gridMap.slice(i, i + COLS));
  }

  const getLabel = (): string => {
    if (phase === 'hold' && newScore !== null) {
      return isFirstBaseline ? 'your baseline' : mode === 'baseline' ? 'new baseline' : 'new score';
    }
    if (isFirstBaseline) return 'signals to analyse';
    return mode === 'baseline' ? 'previous baseline' : 'current score';
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: spectra,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Lato, system-ui, sans-serif',
        zIndex: 9999,
        padding: '0 28px',
      }}
    >
      <div style={{ paddingTop: '18vh' }}>
        {/* Label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: sinbad,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            margin: '0 0 4px',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {getLabel()}
        </motion.p>

        {/* Large number */}
        <div
          style={{
            fontSize: 285,
            lineHeight: 0.85,
            fontWeight: 900,
            letterSpacing: '-0.05em',
            color: pampas,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {displayScore}
        </div>

        {/* Process word — two-tone typography */}
        <div style={{ minHeight: 58, overflow: 'hidden', marginTop: 6 }}>
          <AnimatePresence mode="wait">
            {stepIndex >= 0 && stepIndex < steps.length && (
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ margin: 0 }}
              >
                {steps[stepIndex].action && (
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 400,
                      color: sinbad,
                      opacity: 0.55,
                      lineHeight: 1.3,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {steps[stepIndex].action}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 700,
                    color: pampas,
                    lineHeight: 1.2,
                    fontFamily: 'Lato, system-ui, sans-serif',
                  }}
                >
                  {steps[stepIndex].subject}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dot grid */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: DOT_GAP }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: DOT_GAP }}>
              {row.map((stepIdx, ci) => {
                if (stepIdx === null) {
                  return <div key={`${ri}-${ci}`} style={{ width: DOT_SIZE, height: DOT_SIZE }} />;
                }

                const isActive = stepIdx <= stepIndex;
                const color = isActive ? steps[stepIdx].color : null;

                return (
                  <motion.div
                    key={`${ri}-${ci}`}
                    animate={{
                      backgroundColor: color || 'transparent',
                      borderColor: color || `${sinbad}20`,
                      scale: isActive && stepIdx === stepIndex ? [1, 1.15, 1] : 1,
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      width: DOT_SIZE,
                      height: DOT_SIZE,
                      borderRadius: '50%',
                      border: `1.5px solid ${color || `${sinbad}20`}`,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
