import { motion } from 'motion/react';
import mindMeasureLogo from '../../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';
import type { ProcessingPhase } from './types';

interface ProcessingOverlayProps {
  processingPhase: ProcessingPhase;
  processingMessage: string;
}

const PHASE_TITLES: Record<ProcessingPhase, string> = {
  extracting: 'Processing Your Assessment',
  calculating: 'Analysing Your Data',
  saving: 'Finalising Your Baseline',
};

export function ProcessingOverlay({ processingPhase, processingMessage }: ProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          ],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      />

      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-black/5" />

      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl"
        animate={{
          y: [0, -15, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/8 rounded-full blur-xl"
        animate={{
          y: [0, 10, 0],
          x: [0, -8, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Logo */}
        <motion.div
          className="mb-6"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="w-32 h-32 p-4 bg-white/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
            <img src={mindMeasureLogo} alt="Mind Measure" className="w-full h-full object-contain" />
          </div>
        </motion.div>

        {/* Processing messages with phase transitions */}
        <motion.div
          key={processingPhase}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-semibold text-white mb-3">{PHASE_TITLES[processingPhase]}</h1>
        </motion.div>

        <motion.div
          key={processingMessage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-white/90 text-lg font-medium mb-8">{processingMessage}</p>
        </motion.div>

        {/* Progress bar - infinite loop */}
        <motion.div
          className="mt-8 w-48 h-1 bg-white/30 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div
            className="h-full bg-white/60 rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ width: '50%' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
