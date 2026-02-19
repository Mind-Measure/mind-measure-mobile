import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const MM_LOGO_WHITE = '/images/mind-measure-logo-white.png';

const BEAT = 1000;

const colors = ['#2D4C4C', '#F59E0B', '#99CCCE', '#FF6B6B'];
const words = ['Measure', 'Monitor', 'Manage'];

interface ReturningSplashScreenProps {
  onComplete: () => void;
}

export function ReturningSplashScreen({ onComplete }: ReturningSplashScreenProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s >= 7) {
          clearInterval(timer);
          return s;
        }
        return s + 1;
      });
    }, BEAT);

    const completeTimer = setTimeout(onComplete, BEAT * 7 + 2000);

    return () => {
      clearInterval(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const colorIndex = Math.min(step, colors.length - 1);
  const showWord = step >= 4 && step <= 6;
  const wordIndex = step - 4;
  const showBrand = step >= 7;

  return (
    <motion.div
      animate={{ backgroundColor: colors[colorIndex] }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: colors[0],
      }}
    >
      <motion.img
        src={MM_LOGO_WHITE}
        alt="Mind Measure"
        animate={{ opacity: showBrand ? 0.9 : 0.85 }}
        transition={{ duration: 0.8 }}
        style={{ width: 120, height: 120, objectFit: 'contain' }}
      />

      <div
        style={{
          marginTop: 40,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence mode="wait">
          {showWord && (
            <motion.p
              key={`word-${wordIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
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
              {words[wordIndex]}
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
    </motion.div>
  );
}
