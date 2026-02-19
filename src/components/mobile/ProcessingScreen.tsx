import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';
const bittersweet = '#FF6B6B';
const lilac = '#DDD6FE';

const DOT_COLORS = [spectra, sinbad, buttercup, bittersweet, lilac];

const STEPS = [
  'Capturing voice signal',
  'Measuring pitch',
  'Tracking speech rhythm',
  'Pause patterns',
  'Voice stability',
  'Tracking facial cues',
  'Eye contact',
  'Facial tension',
  'Emotional valence',
  'Parsing language',
  'Stress markers',
  'Coping signals',
  'Comparing to baseline',
  'Measuring variance',
  'Energy shift',
  'Aligning multimodal signals',
  'Fusion weights',
  'Recalculating score',
  'Finalising insight',
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

function pickRandomColor(exclude?: string): string {
  const pool = exclude ? DOT_COLORS.filter((c) => c !== exclude) : DOT_COLORS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function ProcessingScreen({
  mode = 'checkin',
  previousScore = 50,
  newScore = null,
  onScoreRevealed,
}: ProcessingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [dotColors, setDotColors] = useState<(string | null)[]>(() => STEPS.map(() => null));
  const [phase, setPhase] = useState<'processing' | 'revealing' | 'hold'>('processing');
  const [displayScore, setDisplayScore] = useState(previousScore);
  const tweenRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== 'processing') return;

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        const next = prev + 1;
        if (next >= STEPS.length) {
          clearInterval(interval);
          return prev;
        }
        setDotColors((colors) => {
          const updated = [...colors];
          const prevColor = next > 0 ? updated[next - 1] : null;
          updated[next] = pickRandomColor(prevColor ?? undefined);
          return updated;
        });
        return next;
      });
    }, STEP_INTERVAL);

    setDotColors((colors) => {
      const updated = [...colors];
      updated[0] = pickRandomColor();
      return updated;
    });

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

  const dotsPerRow = 7;
  const rows: (string | null)[][] = [];
  for (let i = 0; i < dotColors.length; i += dotsPerRow) {
    rows.push(dotColors.slice(i, i + dotsPerRow));
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: spectra,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Lato, system-ui, sans-serif',
        zIndex: 9999,
      }}
    >
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
          margin: '0 0 8px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {phase === 'hold' && newScore !== null && newScore !== previousScore ? 'new score' : 'current score'}
      </motion.p>

      {/* Large score number — matches dashboard exactly */}
      <div
        style={{
          fontSize: 285,
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: '-0.05em',
          color: pampas,
          fontVariantNumeric: 'tabular-nums',
          marginBottom: 32,
        }}
      >
        {displayScore}
      </div>

      {/* Dot grid */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          marginBottom: 28,
        }}
      >
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {row.map((color, ci) => {
              const idx = ri * dotsPerRow + ci;
              return (
                <motion.div
                  key={idx}
                  animate={{
                    backgroundColor: color || 'transparent',
                    borderColor: color || `${sinbad}40`,
                    scale: color ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `1.5px solid ${color || `${sinbad}40`}`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Process word */}
      <div style={{ height: 24, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.5, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: sinbad,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              textAlign: 'center',
            }}
          >
            {STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
