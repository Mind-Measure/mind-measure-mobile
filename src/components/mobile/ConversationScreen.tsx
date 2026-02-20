import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

const EMPHASIS_WORDS = [
  'last time',
  'manageable',
  'overwhelmed',
  'overwhelming',
  'stressed',
  'stressful',
  'anxious',
  'anxiety',
  'worried',
  'struggling',
  'difficult',
  'tough',
  'challenging',
  'exhausted',
  'lonely',
  'isolated',
  'motivated',
  'confident',
  'hopeful',
  'grateful',
  'calm',
  'relaxed',
  'proud',
  'happy',
  'sad',
  'angry',
  'frustrated',
  'scared',
  'nervous',
  'sleep',
  'energy',
  'mood',
  'wellbeing',
  'appetite',
  'focus',
  'concentration',
];

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
  userName?: string;
}

function buildEmphasisRegex(userName?: string): RegExp {
  const words = [...EMPHASIS_WORDS];
  if (userName && userName.length > 1) words.push(userName);
  const numberPattern = '\\d+\\s*(?:out of\\s*)?(?:/\\s*)?\\d+';
  const wordPattern = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`(\\*[^*]+\\*|\\b(?:${wordPattern}|${numberPattern})\\b)`, 'gi');
}

function renderEmphasis(text: string, _baseFontSize: number, baseColour: string, userName?: string) {
  const regex = buildEmphasisRegex(userName);
  const parts = text.split(regex).filter(Boolean);

  if (parts.length <= 1) {
    return <span style={{ color: baseColour }}>{text}</span>;
  }

  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} style={{ fontStyle: 'italic', color: sinbad }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    regex.lastIndex = 0;
    if (regex.test(part)) {
      regex.lastIndex = 0;
      return (
        <span key={i} style={{ fontStyle: 'italic', color: sinbad }}>
          {part}
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
  userName,
}: ConversationScreenProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const finishTriggered = useMemo(
    () => messages.some((m) => m.sender === 'ai' && /finish button/i.test(m.text)),
    [messages]
  );

  const lastAiIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'ai') return i;
    }
    return -1;
  }, [messages]);

  const lastAiMsg = lastAiIdx >= 0 ? messages[lastAiIdx] : null;

  const aiSentences = useMemo(() => {
    if (!lastAiMsg) return [];
    return lastAiMsg.text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  }, [lastAiMsg?.id]);

  const [revealedCount, setRevealedCount] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (!lastAiMsg || aiSentences.length === 0) {
      setRevealedCount(0);
      return;
    }

    setRevealedCount(1);
    let idx = 1;
    const tick = () => {
      if (idx >= aiSentences.length) return;
      const delay = Math.min(1000 + aiSentences[idx - 1].length * 13, 2400);
      revealTimer.current = setTimeout(() => {
        setRevealedCount((c) => c + 1);
        idx++;
        tick();
      }, delay);
    };
    tick();

    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, [lastAiMsg?.id, aiSentences.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, revealedCount]);

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
      {/* Top fade mask */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '18vh',
          background: `linear-gradient(to bottom, ${spectra} 0%, ${spectra} 30%, transparent 100%)`,
          zIndex: 10,
          pointerEvents: 'none',
        }}
      />

      {/* Back button */}
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

      {/* Scrolling transcript */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 28px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Spacer pushes first message to lower portion of screen */}
        <div style={{ minHeight: '75vh' }} />

        {messages.map((msg, idx) => {
          const isLastAi = idx === lastAiIdx;
          const isAi = msg.sender === 'ai';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'left', maxWidth: '100%', marginBottom: 28 }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: sinbad,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  margin: '0 0 12px',
                  opacity: 0.6,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {isAi ? 'JODIE' : 'YOU'}
              </p>

              {isAi ? (
                <div style={{ lineHeight: 1.25, margin: 0 }}>
                  {isLastAi
                    ? aiSentences.slice(0, revealedCount).map((sentence, si) => (
                        <motion.span
                          key={`${msg.id}-s${si}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          style={{ display: 'inline', fontSize: 34, fontWeight: 700, color: pampas }}
                        >
                          {si > 0 ? ' ' : ''}
                          {renderEmphasis(sentence, 34, pampas, userName)}
                        </motion.span>
                      ))
                    : renderEmphasis(msg.text, 34, pampas, userName)}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 400,
                    color: sinbad,
                    lineHeight: 1.3,
                    whiteSpace: 'pre-line' as const,
                    margin: 0,
                  }}
                >
                  {msg.text}
                </div>
              )}

              {type === 'baseline' && isAi && msg.options && (
                <div style={{ marginTop: 32 }}>
                  {msg.options.map((opt, i) => (
                    <motion.p
                      key={opt}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ delay: 1.2 + i * 0.9, duration: 0.8 }}
                      style={{ fontSize: 20, fontWeight: 400, fontStyle: 'italic', color: sinbad, margin: '10px 0' }}
                    >
                      {opt}
                    </motion.p>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Bottom padding so text doesn't sit right against the finish button */}
        <div ref={bottomRef} style={{ height: '28vh' }} />
      </div>

      {/* Finish button */}
      {onFinish && (
        <div style={{ position: 'absolute', bottom: 40, right: 28, zIndex: 20 }}>
          <motion.button
            onClick={() => {
              try {
                Haptics.impact({ style: ImpactStyle.Heavy });
              } catch {
                /* web fallback */
              }
              onFinish();
            }}
            animate={{
              backgroundColor: finishTriggered ? buttercup : 'transparent',
              color: finishTriggered ? spectra : sinbad,
              borderColor: finishTriggered ? buttercup : sinbad,
              boxShadow: finishTriggered ? '0 4px 20px rgba(245,158,11,0.35)' : '0 0 0 transparent',
              scale: finishTriggered ? 1.05 : 1,
            }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.5 }}
            style={{
              padding: '14px 32px',
              border: '2px solid',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Finish
          </motion.button>
        </div>
      )}

      {/* Camera + mic indicators */}
      <div
        style={{
          position: 'absolute',
          bottom: 44,
          left: 28,
          display: 'flex',
          gap: 14,
          alignItems: 'center',
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
          style={{ opacity: 0.3 }}
        >
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <motion.svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={sinbad}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ opacity: isListening ? [0.3, 0.6, 0.3] : 0.3 }}
          transition={isListening ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        >
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </motion.svg>
      </div>
    </div>
  );
}
