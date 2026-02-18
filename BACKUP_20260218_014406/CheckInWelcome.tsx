import { motion } from 'motion/react';
import studentPhoto from '@/assets/student-1.png';

const pampas = '#FAF9F7';
const spectra = '#2D4C4C';
const sinbad = '#99CCCE';
const lilac = '#DDD6FE';
const hotPink = '#EC4899';

interface CheckInWelcomeProps {
  onStartCheckIn: () => void;
  userName?: string;
}

export function CheckInWelcome({ onStartCheckIn, userName = 'Alex' }: CheckInWelcomeProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: pampas,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Lato, system-ui, sans-serif',
      }}
    >
      <motion.div
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero photo */}
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
            paddingTop: '60px',
          }}
        >
          <img
            src={studentPhoto}
            alt=""
            style={{
              width: '80%',
              maxHeight: '240px',
              objectFit: 'cover',
              objectPosition: 'center top',
              display: 'block',
              margin: '0 auto',
              borderRadius: '0 0 20px 20px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: `linear-gradient(transparent, ${pampas})`,
            }}
          />
        </motion.div>

        {/* Content */}
        <div style={{ padding: '0 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 300,
                color: spectra,
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
                lineHeight: 1.12,
              }}
            >
              Welcome back,{'\n'}
              {userName}
            </h1>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 300,
                color: spectra,
                margin: '0 0 28px',
                lineHeight: 1.6,
                opacity: 0.5,
              }}
            >
              Ready for your check-in with Jodie?
            </p>
          </motion.div>

          {/* What to expect */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: spectra,
                opacity: 0.35,
                marginBottom: '14px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase' as const,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              What to expect
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Visual Analysis', desc: 'Facial expression insights', accent: lilac },
                { label: 'Voice Patterns', desc: 'Speech and tone analysis', accent: hotPink },
                { label: 'Conversation', desc: 'Natural dialogue with Jodie', accent: lilac },
                {
                  label: 'Private and Secure',
                  desc: 'Your data is encrypted. Takes about 3 minutes.',
                  accent: hotPink,
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: item.accent,
                      opacity: 0.7,
                      marginTop: '7px',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontSize: '15px',
                        fontWeight: 400,
                        color: spectra,
                        margin: '0 0 2px',
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: '13px',
                        fontWeight: 300,
                        color: spectra,
                        margin: 0,
                        opacity: 0.4,
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quiet space hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
            style={{
              marginTop: '18px',
              fontSize: '14px',
              fontWeight: 300,
              fontStyle: 'italic',
              color: spectra,
              opacity: 0.25,
            }}
          >
            Find a quiet, comfortable space where you can speak freely
          </motion.p>

          {/* Start button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{ marginTop: 'auto', paddingBottom: '48px', paddingTop: '28px' }}
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onStartCheckIn}
              style={{
                width: '100%',
                height: '54px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: sinbad,
                color: spectra,
                border: 'none',
                borderRadius: '14px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '0.01em',
                boxShadow: '0 4px 16px rgba(153, 204, 206, 0.35)',
              }}
            >
              Start check-in
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
