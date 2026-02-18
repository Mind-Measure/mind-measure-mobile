import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MM_LOGO_WHITE = '/images/mind-measure-logo-white.png';

const cycleEnd = 2000;
const totalDuration = 6500;

interface ReturningSplashScreenProps {
  onComplete: () => void;
}

export function ReturningSplashScreen({ onComplete }: ReturningSplashScreenProps) {
  const [showWords, setShowWords] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [showBrand, setShowBrand] = useState(false);

  useEffect(() => {
    const wordsTimer = setTimeout(() => {
      setShowWords(true);
    }, cycleEnd + 300);

    const word2Timer = setTimeout(() => setWordIndex(1), cycleEnd + 1000);
    const word3Timer = setTimeout(() => setWordIndex(2), cycleEnd + 1700);
    const brandTimer = setTimeout(() => setShowBrand(true), cycleEnd + 3000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, totalDuration);

    return () => {
      clearTimeout(wordsTimer);
      clearTimeout(word2Timer);
      clearTimeout(word3Timer);
      clearTimeout(brandTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        animation: 'splashDissolve 2s ease-in-out forwards',
      }}
    >
      <style>{`
        @keyframes splashDissolve {
          0%        { background-color: #2D4C4C; }
          33%       { background-color: #F59E0B; }
          66%       { background-color: #99CCCE; }
          100%      { background-color: #FF6B6B; }
        }
      `}</style>
      <img src={MM_LOGO_WHITE} alt="Mind Measure" style={{ width: 120, height: 120, objectFit: 'contain' }} />

      <div style={{ marginTop: 40, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AnimatePresence mode="wait">
          {showWords && !showBrand && (
            <motion.p
              key={wordIndex}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'Lato, system-ui, sans-serif',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                margin: 0,
              }}
            >
              {['Measure', 'Monitor', 'Manage'][wordIndex]}
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
    </div>
  );
}
