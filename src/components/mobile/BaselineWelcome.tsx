import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import studentPhoto from '@/assets/student-2.png';

const pampas = '#FAF9F7';
const spectra = '#2D4C4C';
const lilac = '#DDD6FE';
const hotPink = '#F59E0B';

interface BaselineAssessmentScreenProps {
  onStartAssessment: () => void;
}

export function BaselineAssessmentScreen({ onStartAssessment }: BaselineAssessmentScreenProps) {
  const [showExpect, setShowExpect] = useState(false);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: pampas,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Lato, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AnimatePresence mode="wait">
        {!showExpect ? (
          /* ═══ SCREEN 1: Welcome ═══ */
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            {/* Photo with top padding so Dynamic Island doesn't obscure face */}
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
                  maxHeight: '280px',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                  margin: '0 auto',
                  borderRadius: '0 0 20px 20px',
                }}
              />
              {/* Soft fade into background */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '80px',
                  background: `linear-gradient(transparent, ${pampas})`,
                }}
              />
            </motion.div>

            {/* Content */}
            <div style={{ padding: '0 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 10px',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.15,
                  }}
                >
                  Welcome to{'\n'}Mind Measure
                </h1>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 300,
                    color: spectra,
                    margin: '0 0 24px',
                    lineHeight: 1.55,
                    opacity: 0.5,
                  }}
                >
                  Let's establish your personal wellness baseline with Jodie
                </p>
              </motion.div>

              {/* Why baseline card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                style={{
                  padding: '18px 20px',
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 500,
                    color: spectra,
                    margin: '0 0 6px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Why a baseline?
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    fontWeight: 300,
                    color: spectra,
                    margin: 0,
                    lineHeight: 1.6,
                    opacity: 0.55,
                  }}
                >
                  This helps us understand where you are right now, creating a personalised starting point for your
                  wellbeing journey.
                </p>
              </motion.div>

              {/* CTA button — moved up to replace key details */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                style={{ marginTop: '24px' }}
              >
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowExpect(true)}
                  style={{
                    width: '100%',
                    height: '54px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#99CCCE',
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
                  Continue
                </motion.button>
              </motion.div>

              {/* Key details — below button as subtle footnotes */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  paddingBottom: '40px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: lilac }} />
                  <span
                    style={{
                      fontSize: '13px',
                      color: spectra,
                      opacity: 0.35,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    3-5 minutes
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: hotPink, opacity: 0.6 }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      color: spectra,
                      opacity: 0.35,
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    Private and secure
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ═══ SCREEN 2: What to expect ═══ */
          <motion.div
            key="expect"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 28px' }}
          >
            {/* Back */}
            <button
              type="button"
              onClick={() => setShowExpect(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: spectra,
                opacity: 0.35,
                paddingTop: '56px',
                marginBottom: '36px',
                padding: '56px 0 0',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: '14px',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ marginBottom: '36px' }}
            >
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 300,
                  color: spectra,
                  margin: '0 0 10px',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                }}
              >
                What to expect
              </h1>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 300,
                  color: spectra,
                  margin: 0,
                  lineHeight: 1.5,
                  opacity: 0.5,
                }}
              >
                Five questions with Jodie to establish your starting point
              </p>
            </motion.div>

            {/* Bullet points as cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { text: 'Five questions from Jodie', accent: lilac },
                { text: '3-5 minutes max', accent: hotPink },
                { text: 'We use your camera so make sure you are looking at the screen', accent: lilac },
                { text: 'We analyse your voice to understand your mood', accent: hotPink },
                { text: 'We delete any voice and images we collect as soon as we have analysed them', accent: lilac },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 16px',
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
                      opacity: 0.6,
                      marginTop: '7px',
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontSize: '15px',
                      fontWeight: 300,
                      color: spectra,
                      margin: 0,
                      lineHeight: 1.5,
                      opacity: 0.75,
                    }}
                  >
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Quiet space hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                marginTop: '24px',
                fontSize: '14px',
                fontWeight: 300,
                fontStyle: 'italic',
                color: spectra,
                opacity: 0.3,
              }}
            >
              Find a quiet, comfortable space where you can speak freely
            </motion.p>

            {/* Start button */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              style={{ marginTop: 'auto', paddingBottom: '48px', paddingTop: '32px' }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onStartAssessment}
                style={{
                  width: '100%',
                  height: '54px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#99CCCE',
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
                Let's get started
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
