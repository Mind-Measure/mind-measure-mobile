import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

interface CheckInWelcomeProps {
  onStartCheckIn: () => void;
  onBack?: () => void;
  userName?: string;
  isBaseline?: boolean;
}

export function CheckInWelcome({ onStartCheckIn, onBack, userName = 'Alex', isBaseline = false }: CheckInWelcomeProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: spectra,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          padding: '0 28px',
        }}
      >
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              position: 'absolute', top: '56px', left: '24px',
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              color: sinbad, opacity: 0.5,
            }}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Title + subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{ paddingTop: '140px' }}
        >
          <h1 style={{
            fontSize: '48px',
            fontWeight: 300,
            color: pampas,
            margin: '0 0 14px',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            fontFamily: 'Lato, system-ui, sans-serif',
          }}>
            {isBaseline ? 'Baseline' : 'Check in'}
          </h1>
          <p style={{
            fontSize: '18px',
            fontWeight: 300,
            color: sinbad,
            margin: 0,
            lineHeight: 1.6,
            fontFamily: 'Lato, system-ui, sans-serif',
            opacity: 0.6,
          }}>
            {isBaseline
              ? 'Five questions with Jodie to establish your starting point'
              : `A few minutes with Jodie to see how you're doing today`}
          </p>
        </motion.div>

        {/* What to expect */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{ marginTop: '32px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { text: 'Visual analysis of your facial expressions', accent: sinbad },
              { text: 'Voice patterns and speech analysis', accent: buttercup },
              { text: 'Natural conversation with Jodie', accent: sinbad },
              { text: 'Private and encrypted — takes about 3 minutes', accent: buttercup },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.4 }}
                style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
              >
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: item.accent, flexShrink: 0, marginTop: '7px',
                  opacity: 0.6,
                }} />
                <p style={{
                  fontSize: '15px', color: pampas, margin: 0, lineHeight: 1.6,
                  opacity: 0.5, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 300,
                }}>
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Begin button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          style={{ marginTop: '40px' }}
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStartCheckIn}
            style={{
              padding: '16px 40px',
              backgroundColor: buttercup,
              color: spectra,
              border: 'none',
              borderRadius: '14px',
              fontSize: '17px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.01em',
            }}
          >
            Begin
          </motion.button>
        </motion.div>

        {/* Camera + mic icons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            position: 'absolute', bottom: '40px', left: '28px',
            display: 'flex', alignItems: 'center', gap: '14px',
            opacity: 0.3,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sinbad} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sinbad} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </motion.div>

        {/* Quiet space hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          style={{
            position: 'absolute', bottom: '40px', right: '28px',
            fontSize: '12px', fontWeight: 300, fontStyle: 'italic',
            color: sinbad, opacity: 0.25, margin: 0,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Find a quiet space
        </motion.p>
      </motion.div>
    </div>
  );
}
