import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
const MM_LOGO = '/images/mind-measure-logo.png';

const student1 = '/images/student1.png';
const student2 = '/images/student2.png';
const student3 = '/images/student3.png';
const student4 = '/images/student4.png';
const student5 = '/images/student5.png';
const student6 = '/images/student6.png';

const spectra = '#2D4C4C';
const sinbad = '#99CCCE';
const pampas = '#FAF9F7';

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const taglineWords = ['Measure', 'Monitor', 'Manage'];

  const studentImages = [
    { src: student1, alt: 'Mind Measure student with sunglasses and colorful jacket' },
    { src: student2, alt: 'Mind Measure student with confident pose' },
    { src: student3, alt: 'Mind Measure student looking thoughtful' },
    { src: student4, alt: 'Mind Measure student with pink knit scarf smiling warmly' },
    { src: student5, alt: 'Mind Measure student with glasses and blonde hair' },
    { src: student6, alt: 'Mind Measure student with curly hair in black top' },
  ];

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglineWords.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % studentImages.length);
    }, 4500);
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
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: sinbad }}>
      {/* Warm branded gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(45,76,76,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(245,158,11,0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(153,204,206,0.4) 0%, transparent 60%)
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

        {/* Student Image Carousel */}
        <motion.div variants={fadeUp} className="mb-8 relative">
          <div
            className="w-48 h-64 rounded-3xl overflow-hidden shadow-xl relative"
            style={{ border: '3px solid rgba(255,255,255,0.3)' }}
          >
            {studentImages.map((image, idx) => (
              <motion.div
                key={idx}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{
                  opacity: idx === currentImageIndex ? 1 : 0,
                  scale: idx === currentImageIndex ? 1 : 1.08,
                }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
              >
                <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex gap-1.5 justify-center mt-3">
            {studentImages.map((_, idx) => (
              <motion.div
                key={idx}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: idx === currentImageIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
                }}
                animate={{ scale: idx === currentImageIndex ? 1.2 : 1 }}
              />
            ))}
          </div>
        </motion.div>

        {/* Main Heading */}
        <motion.div variants={fadeUp} className="mb-6 max-w-xs">
          <h2 className="text-2xl font-semibold mb-3" style={{ color: '#ffffff' }}>
            Empowering <span style={{ color: '#F59E0B' }}>every student&apos;s</span> mental wellness
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Join thousands of students who use Mind Measure to understand and improve their wellbeing with just a few
            minutes each day.
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div variants={fadeUp} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={onGetStarted}
            className="h-14 px-8 text-lg font-semibold rounded-2xl shadow-lg min-w-[280px]"
            style={{ backgroundColor: '#ffffff', color: spectra }}
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
            <p className="text-sm" style={{ color: `${spectra}70` }}>
              Debug Options:
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button
                onClick={() => (window.location.href = '/test-returning')}
                className="text-xs px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: `${sinbad}30`,
                  color: spectra,
                  borderColor: `${sinbad}60`,
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
                  backgroundColor: '#FC686830',
                  color: spectra,
                  borderColor: '#FC686860',
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
                  backgroundColor: '#F59E0B30',
                  color: spectra,
                  borderColor: '#F59E0B60',
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
