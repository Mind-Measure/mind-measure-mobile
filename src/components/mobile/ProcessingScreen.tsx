import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MM_LOGO_WHITE = '/images/mind-measure-logo-white.png';
const spectra = '#2D4C4C';
const bittersweet = '#FF6B6B';

const baselinePhrases = [
  'Capturing voice signal',
  'Measuring speech rhythm',
  'Assessing vocal stability',
  'Tracking facial cues',
  'Mapping emotional valence',
  'Parsing language patterns',
  'Scoring PHQ-2',
  'Scoring GAD-2',
  'Integrating structured responses',
  'Aligning multimodal signals',
  'Normalising feature ranges',
  'Applying fusion weights',
  'Calibrating personal baseline',
  'Computing equilibrium band',
  'Finalising baseline score',
];

const checkinPhrases = [
  'Capturing voice signal',
  'Measuring pitch',
  'Tracking speech rhythm',
  'Analysing pause patterns',
  'Assessing voice stability',
  'Evaluating audio quality',
  'Tracking facial cues',
  'Monitoring eye contact',
  'Measuring facial tension',
  'Mapping emotional valence',
  'Assessing blink rate',
  'Validating visual signal',
  'Parsing language tone',
  'Detecting stress markers',
  'Identifying coping signals',
  'Tracking social references',
  'Monitoring sleep mentions',
  'Comparing to baseline',
  'Measuring variance',
  'Mapping energy shift',
  'Calculating stress delta',
  'Detecting behavioural drift',
  'Aligning multimodal signals',
  'Applying fusion weights',
  'Updating rolling trend',
  'Recalculating score',
  'Finalising insight',
];

interface ProcessingScreenProps {
  mode?: 'baseline' | 'checkin';
  className?: string;
}

export function ProcessingScreen({ mode = 'checkin', className }: ProcessingScreenProps) {
  const phrases = mode === 'baseline' ? baselinePhrases : checkinPhrases;
  const interval = mode === 'baseline' ? 500 : 333;

  const totalPhraseTime = phrases.length * interval;

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showBrand, setShowBrand] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;

    const phraseId = setInterval(() => {
      setPhraseIndex((prev) => {
        if (prev >= phrases.length - 1) {
          clearInterval(phraseId);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    const brandTimer = setTimeout(() => {
      setShowBrand(true);
      setDone(true);
    }, totalPhraseTime + 600);

    return () => {
      clearInterval(phraseId);
      clearTimeout(brandTimer);
    };
  }, [done, phrases.length, interval]);

  return (
    <div
      className={className ?? ''}
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: spectra,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={MM_LOGO_WHITE}
        alt="Mind Measure"
        style={{ width: 120, height: 120, objectFit: 'contain' }}
      />

      <div style={{ marginTop: 40, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {!showBrand && (
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              exit={{ opacity: 0 }}
              transition={{ duration: interval / 3000, ease: 'easeOut' }}
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#fff',
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '0.02em',
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              {phrases[phraseIndex]}
            </motion.p>
          )}
          {showBrand && (
            <motion.p
              key="brand"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'Lato, system-ui, sans-serif',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                margin: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Mind Measure
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div
        style={{
          width: '60%',
          height: 3,
          borderRadius: 2,
          backgroundColor: showBrand ? 'transparent' : 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
          marginTop: 12,
          transition: 'background-color 0.5s ease',
        }}
      >
        {!showBrand && (
          <motion.div
            style={{
              height: '100%',
              borderRadius: 2,
              backgroundColor: bittersweet,
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: totalPhraseTime / 1000, ease: 'linear' }}
          />
        )}
      </div>
    </div>
  );
}
