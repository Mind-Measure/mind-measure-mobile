import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

const EMPHASIS_PATTERNS = [
  /\b(last time)\b/gi,
  /\b(manageable|overwhelm(?:ed|ing)?|stress(?:ed|ful)?|anxious|anxiety|worried|struggling|difficult|tough|challenging|exhausted|lonely|isolated|motivated|confident|hopeful|grateful|calm|relaxed|proud|happy|sad|angry|frustrated|scared|nervous)\b/gi,
  /\b(\d+[\s/-]+(?:out of[\s/-]+)?\d+|\d+\/\d+)\b/g,
  /\b(sleep|energy|mood|wellbeing|appetite|focus|concentration)\b/gi,
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

function renderEmphasis(text: string, baseFontSize: number, baseColour: string, userName?: string) {
  // First handle explicit *asterisk* markup
  const asteriskParts = text.split(/(\*[^*]+\*)/g);
  if (asteriskParts.some((p) => p.startsWith('*') && p.endsWith('*'))) {
    return asteriskParts.map((part, i) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span key={i} style={{ fontStyle: 'italic', fontWeight: 400, color: sinbad, fontSize: baseFontSize }}>
            {part.slice(1, -1)}
          </span>
        );
      }
      return applyAutoEmphasis(part, i, baseFontSize, baseColour, userName);
    });
  }
  return applyAutoEmphasis(text, 0, baseFontSize, baseColour, userName);
}

function applyAutoEmphasis(
  text: string,
  keyBase: number,
  baseFontSize: number,
  baseColour: string,
  userName?: string
): React.ReactNode {
  // Build a combined regex from all patterns + user's name
  const patternSources = EMPHASIS_PATTERNS.map((r) => r.source);
  if (userName && userName.length > 1) {
    patternSources.push(`\\b(${userName})\\b`);
  }
  const combined = new RegExp(`(${patternSources.join('|')})`, 'gi');

  const parts = text.split(combined).filter((p) => p !== undefined && p !== '');
  if (parts.length <= 1) {
    return (
      <span key={keyBase} style={{ color: baseColour }}>
        {text}
      </span>
    );
  }

  return parts.map((part, i) => {
    if (combined.test(part)) {
      combined.lastIndex = 0;
      return (
        <span
          key={`${keyBase}-${i}`}
          style={{ fontStyle: 'italic', fontWeight: 400, color: sinbad, fontSize: baseFontSize }}
        >
          {part}
        </span>
      );
    }
    return (
      <span key={`${keyBase}-${i}`} style={{ color: baseColour }}>
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
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [prevUserMsg, setPrevUserMsg] = useState<Message | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishTriggered = useMemo(
    () => messages.some((m) => m.sender === 'ai' && /finish button/i.test(m.text)),
    [messages]
  );

  useEffect(() => {
    if (messages.length === 0) return;
    const newIdx = messages.length - 1;
    if (newIdx <= visibleIndex) return;

    const currentMsg = messages[visibleIndex];
    const incomingMsg = messages[newIdx];

    // If user message is showing and AI is arriving, keep user text visible briefly
    if (currentMsg?.sender === 'user' && incomingMsg?.sender === 'ai') {
      setPrevUserMsg(currentMsg);
      setVisibleIndex(newIdx);
      if (holdTimer.current) clearTimeout(holdTimer.current);
      holdTimer.current = setTimeout(() => setPrevUserMsg(null), 2500);
    } else {
      setVisibleIndex(newIdx);
    }
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
    };
  }, []);

  const currentMessage = messages[visibleIndex];

  const aiSentences = useMemo(() => {
    if (!currentMessage || currentMessage.sender !== 'ai') return [];
    return currentMessage.text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  }, [currentMessage]);

  const [revealedCount, setRevealedCount] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealNext = useCallback(() => {
    setRevealedCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (!currentMessage || currentMessage.sender !== 'ai') {
      setRevealedCount(0);
      return;
    }
    setRevealedCount(1);

    if (aiSentences.length <= 1) return;

    let idx = 1;
    const scheduleNext = () => {
      if (idx >= aiSentences.length) return;
      const delay = Math.min(800 + aiSentences[idx - 1].length * 12, 2000);
      revealTimer.current = setTimeout(() => {
        revealNext();
        idx++;
        scheduleNext();
      }, delay);
    };
    scheduleNext();

    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, [currentMessage?.id, aiSentences.length]);

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

      {/* Conversation — user reply persists briefly, slides up as Jodie arrives */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '80px 28px 140px',
          gap: 32,
        }}
      >
        {/* Previous user message sliding up & fading out */}
        <AnimatePresence>
          {prevUserMsg && (
            <motion.div
              key={`prev-${prevUserMsg.id}`}
              initial={{ opacity: 0.7, y: 0 }}
              animate={{ opacity: 0.35, y: -20 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ textAlign: 'left', maxWidth: '100%' }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: sinbad,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  margin: '0 0 8px',
                  opacity: 0.4,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                YOU
              </p>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 400,
                  color: sinbad,
                  lineHeight: 1.2,
                  whiteSpace: 'pre-line' as const,
                  opacity: 0.5,
                }}
              >
                {prevUserMsg.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current message */}
        <AnimatePresence mode="wait">
          {currentMessage && (
            <motion.div
              key={currentMessage.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ textAlign: 'left', maxWidth: '100%' }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: sinbad,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  margin: '0 0 14px',
                  opacity: 0.6,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {currentMessage.sender === 'ai' ? 'JODIE' : 'YOU'}
              </p>

              {currentMessage.sender === 'ai' ? (
                <div style={{ lineHeight: 1.2, margin: 0 }}>
                  {aiSentences.slice(0, revealedCount).map((sentence, si) => (
                    <motion.span
                      key={`${currentMessage.id}-s${si}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        display: 'inline',
                        fontSize: 40,
                        fontWeight: 700,
                        color: pampas,
                      }}
                    >
                      {si > 0 ? ' ' : ''}
                      {renderEmphasis(sentence, 40, pampas, userName)}
                    </motion.span>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 400,
                    color: sinbad,
                    lineHeight: 1.2,
                    whiteSpace: 'pre-line' as const,
                    margin: 0,
                  }}
                >
                  {currentMessage.text}
                </div>
              )}

              {/* Baseline options */}
              {type === 'baseline' && currentMessage.options && currentMessage.sender === 'ai' && (
                <div style={{ marginTop: 32 }}>
                  {currentMessage.options.map((opt, i) => (
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

              {/* Listening indicator */}
              {isListening && currentMessage.sender === 'ai' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 32 }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ['12px', '24px', '12px'], backgroundColor: [sinbad, pampas, sinbad] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                      style={{ width: 4, borderRadius: 2 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Finish button — hollow until Jodie mentions "finish button", then solid Buttercup */}
      {onFinish && (
        <div style={{ position: 'absolute', bottom: 40, right: 28, zIndex: 20 }}>
          <motion.button
            onClick={onFinish}
            animate={{
              backgroundColor: finishTriggered ? buttercup : 'transparent',
              color: finishTriggered ? spectra : sinbad,
              borderColor: finishTriggered ? buttercup : sinbad,
              boxShadow: finishTriggered ? '0 4px 20px rgba(245,158,11,0.35)' : '0 0 0 transparent',
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
