import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import Lottie from 'lottie-react';

export const SPLASH_BRAND_COLOR = '#FF6B6B';

const BRAND_BG = '#FF6B6B';
const ANIMATION_URL = '/animations/logo-animation.json';
const SOUND_URL = '/animations/splash-sound.mp3';
const CLOSE_SOUND_START = 2.26;

interface ReturningSplashScreenProps {
  onComplete: () => void;
}

export function ReturningSplashScreen({ onComplete }: ReturningSplashScreenProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [phase, setPhase] = useState<'playing' | 'holding' | 'fading'>('playing');
  const lottieRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch(ANIMATION_URL)
      .then((r) => r.json())
      .then((data) => {
        setAnimationData(data);
        try {
          const audio = new Audio(SOUND_URL);
          audio.volume = 0.6;
          audioRef.current = audio;
          audio.play().catch(() => {});

          // Pause after open sound finishes (0 → 1.65s in audio)
          setTimeout(() => {
            if (audioRef.current) audioRef.current.pause();
          }, 1650);

          // Play close sound when text starts disappearing (~4.33s into animation)
          // Seek to 2.26s in audio (close sound: 2.26 → 3.7s)
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.currentTime = CLOSE_SOUND_START;
              audioRef.current.play().catch(() => {});
            }
          }, 4330);

          // Pause after close sound finishes (1.44s of audio)
          setTimeout(() => {
            if (audioRef.current) audioRef.current.pause();
          }, 4330 + 1500);
        } catch {}
      })
      .catch(() => {
        setTimeout(onComplete, 500);
      });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleAnimationComplete = () => {
    setPhase('holding');
    setTimeout(onComplete, 2500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: BRAND_BG,
        overflow: 'hidden',
      }}
    >
      {animationData && (
        <div
          style={{
            width: '85%',
            maxWidth: 400,
            position: 'relative',
          }}
        >
          <div style={{ filter: 'brightness(0) invert(1)' }}>
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              loop={false}
              autoplay={true}
              onComplete={handleAnimationComplete}
              style={{ width: '100%' }}
            />
          </div>

          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'playing' ? 0 : 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '29%',
              transform: 'translateY(-50%)',
              fontSize: 'clamp(22px, 6.5vw, 34px)',
              fontWeight: 300,
              color: 'white',
              fontFamily: 'Lato, system-ui, sans-serif',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            Mind Measure
          </motion.span>
        </div>
      )}
    </div>
  );
}
