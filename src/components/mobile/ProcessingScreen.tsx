import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

interface Phrase {
  text: string;
  size: number;
  weight: number;
  color: string;
  opacity: number;
  indent?: number;
  spacing?: string;
}

const checkinSequence: Phrase[] = [
  { text: 'Capturing', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'voice signal', size: 32, weight: 700, color: pampas, opacity: 1 },
  { text: 'Measuring pitch', size: 15, weight: 400, color: sinbad, opacity: 0.45, indent: 40 },
  { text: 'Tracking speech rhythm', size: 17, weight: 400, color: sinbad, opacity: 0.45, indent: 20 },
  { text: 'Pause patterns', size: 28, weight: 700, color: pampas, opacity: 0.9 },
  { text: 'Voice stability', size: 18, weight: 500, color: sinbad, opacity: 0.5, indent: 60 },
  { text: '', size: 22, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Tracking', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'facial cues', size: 36, weight: 700, color: pampas, opacity: 1 },
  { text: 'Eye contact', size: 15, weight: 400, color: sinbad, opacity: 0.4, indent: 30 },
  { text: 'Facial tension', size: 17, weight: 400, color: sinbad, opacity: 0.45, indent: 50 },
  { text: 'Emotional valence', size: 24, weight: 700, color: buttercup, opacity: 0.85 },
  { text: 'Blink rate', size: 13, weight: 400, color: sinbad, opacity: 0.35, indent: 40 },
  { text: '', size: 18, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Parsing', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'language', size: 40, weight: 700, color: pampas, opacity: 1 },
  { text: 'Stress markers', size: 18, weight: 500, color: sinbad, opacity: 0.5, indent: 20 },
  { text: 'Coping signals', size: 16, weight: 400, color: sinbad, opacity: 0.45, indent: 50 },
  { text: 'Social references', size: 15, weight: 400, color: sinbad, opacity: 0.4, indent: 30 },
  { text: 'Sleep mentions', size: 13, weight: 400, color: sinbad, opacity: 0.35, indent: 60 },
  { text: '', size: 14, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Comparing to', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.15em' },
  { text: 'baseline', size: 34, weight: 700, color: pampas, opacity: 1 },
  { text: 'Measuring variance', size: 15, weight: 400, color: sinbad, opacity: 0.4, indent: 40 },
  { text: 'Energy shift', size: 20, weight: 600, color: sinbad, opacity: 0.6, indent: 20 },
  { text: 'Stress delta', size: 16, weight: 400, color: sinbad, opacity: 0.45, indent: 50 },
  { text: 'Behavioural drift', size: 18, weight: 500, color: buttercup, opacity: 0.7 },
  { text: '', size: 22, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Aligning', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'multimodal', size: 38, weight: 700, color: pampas, opacity: 1 },
  { text: 'signals', size: 38, weight: 300, color: pampas, opacity: 0.65 },
  { text: 'Fusion weights', size: 15, weight: 400, color: sinbad, opacity: 0.4, indent: 40 },
  { text: 'Rolling trend', size: 16, weight: 400, color: sinbad, opacity: 0.45, indent: 20 },
  { text: '', size: 28, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Recalculating', size: 15, weight: 500, color: sinbad, opacity: 0.45, spacing: '0.15em' },
  { text: 'score', size: 48, weight: 700, color: buttercup, opacity: 1 },
  { text: '', size: 36, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Finalising', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'insight', size: 52, weight: 700, color: pampas, opacity: 1 },
];

const baselineSequence: Phrase[] = [
  { text: 'Capturing', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'voice signal', size: 32, weight: 700, color: pampas, opacity: 1 },
  { text: 'Speech rhythm', size: 17, weight: 400, color: sinbad, opacity: 0.45, indent: 20 },
  { text: 'Vocal stability', size: 18, weight: 500, color: sinbad, opacity: 0.5, indent: 40 },
  { text: '', size: 18, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Tracking', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'facial cues', size: 36, weight: 700, color: pampas, opacity: 1 },
  { text: 'Emotional valence', size: 22, weight: 600, color: buttercup, opacity: 0.8 },
  { text: '', size: 18, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Parsing', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'language', size: 40, weight: 700, color: pampas, opacity: 1 },
  { text: 'Scoring PHQ-2', size: 15, weight: 400, color: sinbad, opacity: 0.45, indent: 30 },
  { text: 'Scoring GAD-2', size: 15, weight: 400, color: sinbad, opacity: 0.45, indent: 50 },
  { text: '', size: 22, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Integrating', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.15em' },
  { text: 'structured', size: 34, weight: 700, color: pampas, opacity: 1 },
  { text: 'responses', size: 34, weight: 300, color: pampas, opacity: 0.65 },
  { text: 'Fusion weights', size: 15, weight: 400, color: sinbad, opacity: 0.4, indent: 40 },
  { text: '', size: 28, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Calibrating', size: 15, weight: 500, color: sinbad, opacity: 0.45, spacing: '0.15em' },
  { text: 'personal baseline', size: 44, weight: 700, color: buttercup, opacity: 1 },
  { text: '', size: 36, weight: 400, color: 'transparent', opacity: 0 },
  { text: 'Computing', size: 13, weight: 500, color: sinbad, opacity: 0.4, spacing: '0.2em' },
  { text: 'equilibrium', size: 48, weight: 700, color: pampas, opacity: 1 },
];

const SCROLL_DURATION = 12;
const BRAND_HOLD = 2.5;

interface ProcessingScreenProps {
  mode?: 'baseline' | 'checkin';
  className?: string;
}

export function ProcessingScreen({ mode = 'checkin', className }: ProcessingScreenProps) {
  const sequence = mode === 'baseline' ? baselineSequence : checkinSequence;
  const [phase, setPhase] = useState<'scroll' | 'brand'>('scroll');

  useEffect(() => {
    const brandTimer = setTimeout(() => setPhase('brand'), (SCROLL_DURATION + 0.3) * 1000);
    return () => clearTimeout(brandTimer);
  }, []);

  return (
    <div
      className={className ?? ''}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: spectra,
        overflow: 'hidden',
        fontFamily: 'Lato, system-ui, sans-serif',
      }}
    >
      {/* Top gradient mask */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '22%',
          background: `linear-gradient(to bottom, ${spectra} 25%, transparent)`,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      {/* Bottom gradient mask */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '28%',
          background: `linear-gradient(to top, ${spectra} 35%, transparent)`,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      <AnimatePresence mode="wait">
        {phase === 'scroll' && (
          <motion.div
            key="scroll"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* Scrolling typographic cascade */}
            <motion.div
              initial={{ y: '85vh' }}
              animate={{ y: '-100%' }}
              transition={{
                duration: SCROLL_DURATION,
                ease: [0.22, 0.03, 0.26, 1.0],
              }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                padding: '0 32px',
              }}
            >
              {sequence.map((phrase, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: phrase.size,
                    fontWeight: phrase.weight,
                    color: phrase.color,
                    opacity: phrase.opacity,
                    lineHeight: 1.35,
                    marginBottom: 5,
                    paddingLeft: phrase.indent || 0,
                    letterSpacing: phrase.spacing || '-0.01em',
                    minHeight: phrase.text ? undefined : phrase.size * 0.5,
                  }}
                >
                  {phrase.text}
                </div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {phase === 'brand' && (
          <motion.div
            key="brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <motion.img
              src="/images/mind-measure-logo-white.png"
              alt="Mind Measure"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.85 }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: 72, height: 72, objectFit: 'contain' }}
            />
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 0.4, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: pampas,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                fontFamily: 'Inter, system-ui, sans-serif',
                margin: 0,
              }}
            >
              Mind Measure
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
