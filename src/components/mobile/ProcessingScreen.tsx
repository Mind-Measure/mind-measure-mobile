import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
const MM_LOGO = '/images/mind-measure-logo.png';

const spectra = '#2D4C4C';
const sinbad = '#99CCCE';
const pampas = '#FAF9F7';

const statusMessages = [
  'Analysing your conversation…',
  'Building your insights…',
  'Identifying key themes…',
  'Nearly there…',
];

interface ProcessingScreenProps {
  /** Optional extra CSS class for the root container */
  className?: string;
}

/**
 * Full-viewport processing overlay shown while the backend analyses a conversation.
 *
 * - Spectra background with soft radial glow
 * - Animated SVG logo playing its drawing sequence
 * - Cycling status messages underneath
 */
export function ProcessingScreen({ className }: ProcessingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % statusMessages.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${className ?? ''}`}
      style={{ backgroundColor: spectra }}
    >
      {/* Soft glow */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: `radial-gradient(circle at 50% 42%, ${sinbad} 0%, transparent 55%)`,
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div
          className="mb-8"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <img src={MM_LOGO} alt="Mind Measure" style={{ width: 120, height: 120, objectFit: 'contain' }} />
        </motion.div>

        {/* Cycling status text */}
        <div className="h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              className="text-base font-medium"
              style={{ color: pampas }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {statusMessages[msgIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Subtle loading dots */}
        <div className="flex items-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: sinbad }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
