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

const STEPS: Step[] = [
  // Audio — bittersweet (5)
  { action: 'Capturing', subject: 'voice signal', color: bittersweet },
  { action: 'Measuring', subject: 'pitch', color: bittersweet },
  { action: 'Tracking', subject: 'speech rhythm', color: bittersweet },
  { action: '', subject: 'Pause patterns', color: bittersweet },
  { action: '', subject: 'Voice stability', color: bittersweet },
  // Video — buttercup (4)
  { action: 'Tracking', subject: 'facial cues', color: buttercup },
  { action: '', subject: 'Eye contact', color: buttercup },
  { action: '', subject: 'Facial tension', color: buttercup },
  { action: '', subject: 'Emotional valence', color: buttercup },
  // Multimodal — lilac (7)
  { action: 'Comparing to', subject: 'baseline', color: lilac },
  { action: 'Measuring', subject: 'variance', color: lilac },
  { action: '', subject: 'Energy shift', color: lilac },
  { action: 'Aligning', subject: 'multimodal signals', color: lilac },
  { action: '', subject: 'Fusion weights', color: lilac },
  { action: 'Recalculating', subject: 'score', color: lilac },
  { action: 'Finalising', subject: 'insight', color: lilac },
  // Text — sinbad (3)
  { action: 'Parsing', subject: 'language', color: sinbad },
  { action: '', subject: 'Stress markers', color: sinbad },
  { action: '', subject: 'Coping signals', color: sinbad },
];

const COLS = 7;
const DOT_SIZE = 38;
const DOT_GAP = 8;

// Row 1: _ _ _ _ _ ● ●   (2 audio, right)
// Row 2: ● ● ● ● ● ● ●   (3 audio + 4 video)
// Row 3: ● ● ● ● ● ● ●   (7 multimodal)
// Row 4: ● ● ● _ _ _ _   (3 text, left)
const GRID_MAP: (number | null)[] = [
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

const STEP_INTERVAL = 750;
const SCORE_TWEEN_MS = 1500;
const SCORE_HOLD_MS = 2500;

interface ProcessingScreenProps {
  mode?: 'baseline' | 'checkin';
  previousScore?: number;
  newScore?: number | null;
  onScoreRevealed?: () => void;
}

export function ProcessingScreen({
  mode = 'checkin',
  previousScore = 50,
  newScore = null,
  onScoreRevealed,
}: ProcessingScreenProps) {
  const [stepIndex, setStepIndex] = useState(-1);
  const [phase, setPhase] = useState<'processing' | 'revealing' | 'hold'>('processing');
  const [displayScore, setDisplayScore] = useState(previousScore);
  const tweenRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== 'processing') return;

    setStepIndex(0);
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= STEPS.length) {
        clearInterval(interval);
        return;
      }
      setStepIndex(current);
    }, STEP_INTERVAL);

    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (stepIndex < STEPS.length - 1) return;
    if (phase !== 'processing') return;

    timerRef.current = setTimeout(() => {
      setPhase('revealing');
    }, STEP_INTERVAL);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stepIndex, phase]);

  useEffect(() => {
    if (phase !== 'revealing') return;

    const target = newScore ?? previousScore;
    const start = previousScore;
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
  }, [phase, newScore, previousScore]);

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
  for (let i = 0; i < GRID_MAP.length; i += COLS) {
    rows.push(GRID_MAP.slice(i, i + COLS));
  }

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
      {/* Upper section: label + score + process word — positioned to match dashboard */}
      <div style={{ paddingTop: '18vh' }}>
        {/* "current score" label */}
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
          {phase === 'hold' && newScore !== null && newScore !== previousScore ? 'new score' : 'current score'}
        </motion.p>

        {/* Large score number — matches dashboard: 285px, 900 weight */}
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

        {/* Process word — two-tone typography immediately below the number */}
        <div style={{ minHeight: 52, overflow: 'hidden', marginTop: 6 }}>
          <AnimatePresence mode="wait">
            {stepIndex >= 0 && stepIndex < STEPS.length && (
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                style={{ margin: 0 }}
              >
                {STEPS[stepIndex].action && (
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 400,
                      color: sinbad,
                      opacity: 0.55,
                      lineHeight: 1.3,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {STEPS[stepIndex].action}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: pampas,
                    lineHeight: 1.2,
                    fontFamily: 'Lato, system-ui, sans-serif',
                  }}
                >
                  {STEPS[stepIndex].subject}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Dot grid — lower portion, large dots */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: DOT_GAP,
          }}
        >
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: DOT_GAP }}>
              {row.map((stepIdx, ci) => {
                if (stepIdx === null) {
                  return <div key={`${ri}-${ci}`} style={{ width: DOT_SIZE, height: DOT_SIZE }} />;
                }

                const isActive = stepIdx <= stepIndex;
                const color = isActive ? STEPS[stepIdx].color : null;

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
