import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
const MM_LOGO = '/images/mind-measure-logo.png';

const heroStudent = '/images/hero-student.png';

const coral = '#E8706E';
const coralDeep = '#D4605E';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);

  const taglineWords = ['Measure', 'Monitor', 'Manage'];

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglineWords.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.15 } },
  };

  const fadeUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: coral }}>
      {/* Bold gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(212,96,94,0.6) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(245,158,11,0.12) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 100%, rgba(180,60,60,0.3) 0%, transparent 50%)
          `,
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={fadeUp} className="mb-5">
          <img src={MM_LOGO} alt="Mind Measure" style={{ width: 120, height: 120, objectFit: 'contain' }} />
        </motion.div>

        {/* App Name */}
        <motion.h1 variants={fadeUp} className="text-4xl font-bold mb-2" style={{ color: '#ffffff' }}>
          Mind Measure
        </motion.h1>

        {/* Cycling Tagline */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center gap-1 text-lg font-medium">
            {taglineWords.map((word, idx) => (
              <span key={word} className="flex items-center">
                <motion.span
                  className="transition-all duration-400"
                  style={{
                    color: idx === currentTaglineIndex ? '#ffffff' : 'rgba(255,255,255,0.6)',
                    fontWeight: idx === currentTaglineIndex ? 600 : 400,
                  }}
                  animate={idx === currentTaglineIndex ? { y: [-1, 0, -1] } : { y: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  {word}
                </motion.span>
                {idx < taglineWords.length - 1 && (
                  <span className="mx-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    &bull;
                  </span>
                )}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Hero Student Image */}
        <motion.div variants={fadeUp} className="mb-6">
          <img
            src={heroStudent}
            alt="Student"
            style={{
              width: '100%',
              maxWidth: 280,
              height: 'auto',
              objectFit: 'contain',
            }}
          />
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={fadeUp} className="mb-6 max-w-xs">
          <h2
            className="text-3xl font-black mb-3"
            style={{ color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}
          >
            Know how you <em style={{ fontStyle: 'italic', fontWeight: 300 }}>actually</em> feel.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>
            A two-minute daily check-in with Jodie, your AI companion. She listens, remembers, and gives you a score
            that actually means something.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={fadeUp} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onGetStarted}
            className="h-14 px-8 text-lg font-semibold rounded-2xl shadow-lg min-w-[280px]"
            style={{ backgroundColor: '#ffffff', color: coralDeep }}
          >
            Take Your First Check-In
            <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.div>
          </Button>
        </motion.div>

        {/* Dev Debug Buttons */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div variants={fadeUp} className="mt-6 space-y-2">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Debug Options:
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                onClick={() => (window.location.href = '/test-returning')}
                className="text-xs px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                Test Returning User
              </Button>
              <Button
                onClick={async () => {
                  const mod = './Mobile' + 'AppWrapper';
                  const { clearUserFromDevice } = await import(mod);
                  await clearUserFromDevice();
                  window.location.reload();
                }}
                className="text-xs px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                Clear Device Data
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const capMod = '@capacitor' + '/preferences';
                    const { Preferences } = await import(capMod);
                    const { value } = await Preferences.get({ key: 'mindmeasure_user' });
                    alert(value ? `Device data: ${value}` : 'No device data found');
                  } catch (error) {
                    console.error('Error reading preferences:', error);
                    alert('Error reading device data');
                  }
                }}
                className="text-xs px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.3)',
                }}
              >
                Check Device Data
              </Button>
            </div>
          </motion.div>
        )}

        <div className="h-8" />
      </motion.div>
    </div>
  );
}
