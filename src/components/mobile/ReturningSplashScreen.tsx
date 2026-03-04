import { useEffect } from 'react';
import { motion } from 'motion/react';

export const SPLASH_BRAND_COLOR = '#FF6B6B';

const LOGO_MARK = '/images/mind-measure-logo-white.png';

interface ReturningSplashScreenProps {
  onComplete: () => void;
}

export function ReturningSplashScreen({ onComplete }: ReturningSplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: SPLASH_BRAND_COLOR,
        overflow: 'hidden',
      }}
    >
      <motion.img
        src={LOGO_MARK}
        alt="Mind Measure"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: 120, height: 120, objectFit: 'contain' }}
      />
    </div>
  );
}
