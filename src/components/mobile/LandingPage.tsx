import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const MM_LOGO = '/images/mind-measure-logo.png';
const heroStudent = '/images/hero-student.png';
const coral = '#E8706E';
const spectra = '#2D4C4C';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  const fadeIn = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.12, duration: 0.5, ease: 'easeOut' },
    }),
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* ─── CORAL SECTION ─── */}
      <div
        style={{
          backgroundColor: coral,
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top bar */}
        <motion.div
          custom={0}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '52px 24px 0',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <img src={MM_LOGO} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />
          <span
            style={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: 900,
              fontSize: 18,
              color: '#fff',
              letterSpacing: '-0.01em',
            }}
          >
            Mind Measure
          </span>
        </motion.div>

        {/* Hero area — text overlapping figure */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            minHeight: 380,
          }}
        >
          {/* Typography — positioned left */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              padding: '32px 24px 0',
            }}
          >
            <motion.p
              custom={1}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 12,
              }}
            >
              For Students
            </motion.p>

            <motion.h1
              custom={2}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              style={{
                fontFamily: "'Lato', sans-serif",
                fontWeight: 900,
                fontSize: 'clamp(44px, 13vw, 60px)',
                lineHeight: 0.93,
                letterSpacing: '-0.03em',
                color: '#fff',
                margin: 0,
              }}
            >
              Know
              <br />
              how you
              <br />
              <em style={{ fontWeight: 300, fontStyle: 'italic' }}>actually</em>
              <br />
              feel.
            </motion.h1>
          </div>

          {/* Hero figure — anchored bottom-right, overlapping text */}
          <motion.div
            custom={3}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: '58%',
              zIndex: 5,
            }}
          >
            <img
              src={heroStudent}
              alt="Student"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* ─── DARK GREEN SECTION ─── */}
      <motion.div
        custom={4}
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        style={{
          backgroundColor: spectra,
          padding: '28px 24px 48px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            lineHeight: 1.55,
            color: 'rgba(255,255,255,0.75)',
            marginBottom: 20,
            maxWidth: 320,
          }}
        >
          A two-minute daily check-in with Jodie, your AI companion. She listens, remembers, and gives you a score that
          actually means something.
        </p>

        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onGetStarted}
            className="h-14 px-8 text-base font-bold rounded-2xl shadow-lg"
            style={{
              backgroundColor: '#fff',
              color: spectra,
              width: '100%',
              maxWidth: 320,
              fontFamily: "'Lato', sans-serif",
              letterSpacing: '-0.01em',
            }}
          >
            Let&apos;s go
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Dev Debug */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ padding: '0 24px 24px', backgroundColor: spectra }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Debug:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/test-returning';
              }}
              style={{
                fontSize: 11,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Returning User
            </button>
            <button
              type="button"
              onClick={async () => {
                const mod = './Mobile' + 'AppWrapper';
                const { clearUserFromDevice } = await import(mod);
                await clearUserFromDevice();
                window.location.reload();
              }}
              style={{
                fontSize: 11,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Clear Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
