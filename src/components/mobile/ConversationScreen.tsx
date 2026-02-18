import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

const USER_HOLD_MS = 2500;

interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
  options?: string[];
}

interface ConversationScreenProps {
  type?: 'baseline' | 'checkin';
  messages?: Message[];
  isListening?: boolean;
  onFinish?: () => void;
  onBack?: () => void;
}

function renderEmphasis(text: string, baseFontSize: number, baseColour: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      const word = part.slice(1, -1);
      const needsMargin = i + 1 < parts.length && /^[.,!?;:]/.test(parts[i + 1]);
      return (
        <span
          key={i}
          style={{
            fontStyle: 'italic',
            fontWeight: 400,
            color: sinbad,
            fontSize: baseFontSize,
            marginRight: needsMargin ? 2 : 0,
          }}
        >
          {word}
        </span>
      );
    }
    return (
      <span key={i} style={{ color: baseColour }}>
        {part}
      </span>
    );
  });
}

export function ConversationScreen({
  type = 'checkin',
  messages = [],
  isListening = false,
  onFinish,
  onBack,
}: ConversationScreenProps) {
  const [visibleIndex, setVisibleIndex] = useState(0);
  const userShownAt = useRef<number>(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLastMessage = useMemo(
    () => messages.length > 0 && visibleIndex >= messages.length - 1,
    [visibleIndex, messages.length]
  );

  const advanceTo = useCallback(
    (idx: number) => {
      if (holdTimer.current) clearTimeout(holdTimer.current);

      const currentMsg = messages[visibleIndex];
      if (currentMsg?.sender === 'user') {
        const elapsed = Date.now() - userShownAt.current;
        if (elapsed < USER_HOLD_MS) {
          holdTimer.current = setTimeout(() => setVisibleIndex(idx), USER_HOLD_MS - elapsed);
          return;
        }
      }
      setVisibleIndex(idx);
    },
    [messages, visibleIndex]
  );

  useEffect(() => {
    if (messages.length === 0) return;
    const newIdx = messages.length - 1;
    if (newIdx === visibleIndex) return;
    advanceTo(newIdx);
  }, [messages.length]);

  useEffect(() => {
    const msg = messages[visibleIndex];
    if (msg?.sender === 'user') {
      userShownAt.current = Date.now();
    }
  }, [visibleIndex, messages]);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const currentMessage = messages[visibleIndex];

  return (
    <div
      style={{
        height: '100vh',
        backgroundColor: spectra,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: 'Lato, system-ui, sans-serif',
      }}
    >
      {/* Back button — top-left */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            top: 56,
            left: 24,
            zIndex: 20,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: sinbad,
            opacity: 0.3,
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Inter, system-ui, sans-serif',
            padding: '8px 0',
          }}
        >
          Back
        </button>
      )}

      {/* One message at a time — left-aligned */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 28px 140px',
        }}
      >
        <AnimatePresence mode="wait">
          {currentMessage && (
            <motion.div
              key={currentMessage.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                textAlign: 'left',
                maxWidth: '100%',
              }}
            >
              {/* Speaker label */}
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: sinbad,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  margin: '0 0 14px',
                  opacity: 0.6,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {currentMessage.sender === 'ai' ? 'JODIE' : 'YOU'}
              </p>

              {/* Message text */}
              <div
                style={{
                  fontSize: currentMessage.sender === 'ai' ? 40 : 32,
                  fontWeight: currentMessage.sender === 'ai' ? 700 : 400,
                  color: currentMessage.sender === 'ai' ? pampas : sinbad,
                  lineHeight: 1.2,
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}
              >
                {currentMessage.sender === 'ai' ? renderEmphasis(currentMessage.text, 40, pampas) : currentMessage.text}
              </div>

              {/* Baseline options — staggered write-on */}
              {type === 'baseline' && currentMessage.options && currentMessage.sender === 'ai' && (
                <div style={{ marginTop: 32 }}>
                  {currentMessage.options.map((opt, i) => (
                    <motion.p
                      key={opt}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ delay: 1.2 + i * 0.9, duration: 0.8 }}
                      style={{
                        fontSize: 20,
                        fontWeight: 400,
                        fontStyle: 'italic',
                        color: sinbad,
                        margin: '10px 0',
                      }}
                    >
                      {opt}
                    </motion.p>
                  ))}
                </div>
              )}

              {/* Listening indicator */}
              {isListening && currentMessage.sender === 'ai' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 32,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: ['12px', '24px', '12px'],
                        backgroundColor: [sinbad, pampas, sinbad],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: 'easeInOut',
                      }}
                      style={{ width: 4, borderRadius: 2 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Finish button — bottom-right, changes to Buttercup on last message */}
      {onFinish && (
        <div style={{ position: 'absolute', bottom: 40, right: 28, zIndex: 20 }}>
          <motion.button
            onClick={onFinish}
            animate={{
              backgroundColor: isLastMessage ? buttercup : 'transparent',
              color: isLastMessage ? spectra : sinbad,
              borderColor: isLastMessage ? buttercup : sinbad,
              boxShadow: isLastMessage ? '0 4px 20px rgba(245,158,11,0.35)' : '0 0 0 transparent',
            }}
            transition={{ duration: 0.5 }}
            style={{
              padding: '12px 28px',
              border: '2px solid',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Finish
          </motion.button>
        </div>
      )}

      {/* Camera + mic indicators — bottom-left */}
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: 28,
          display: 'flex',
          gap: 14,
          opacity: 0.3,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={sinbad}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={sinbad}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </div>
    </div>
  );
}
