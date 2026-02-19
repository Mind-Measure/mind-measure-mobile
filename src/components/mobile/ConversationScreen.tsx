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

function renderEmphasis(text: string, baseFontSize: number, baseColour: string, userName?: string) {
  const regex = buildEmphasisRegex(userName);
  const parts = text.split(regex).filter(Boolean);

  if (parts.length <= 1) {
    return <span style={{ color: baseColour }}>{text}</span>;
  }

  return parts.map((part, i) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} style={{ fontStyle: 'italic', fontWeight: 400, color: sinbad, fontSize: baseFontSize }}>
          {part.slice(1, -1)}
        </span>
      );
    }
    regex.lastIndex = 0;
    if (regex.test(part)) {
      regex.lastIndex = 0;
      return (
        <span key={i} style={{ fontStyle: 'italic', fontWeight: 400, color: sinbad, fontSize: baseFontSize }}>
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

const USER_HOLD_MS = 3000;
const USER_FADE_MS = 3000;

export function ConversationScreen({
  type = 'checkin',
  messages = [],
  isListening = false,
  onFinish,
  onBack,
  userName,
}: ConversationScreenProps) {
  const [displayedAiIdx, setDisplayedAiIdx] = useState(-1);
  const [fadingUserMsg, setFadingUserMsg] = useState<Message | null>(null);
  const [userFading, setUserFading] = useState(false);
  const userShownAtRef = useRef<number>(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finishTriggered = useMemo(
    () => messages.some((m) => m.sender === 'ai' && /finish button/i.test(m.text)),
    [messages]
  );

  const latestUserMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') return messages[i];
    }
    return null;
  }, [messages]);

  const latestAiMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'ai') return messages[i];
    }
    return null;
  }, [messages]);

  const latestAiIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'ai') return i;
    }
    return -1;
  }, [messages]);

  useEffect(() => {
    if (!latestUserMsg) return;
    userShownAtRef.current = Date.now();
    setFadingUserMsg(latestUserMsg);
    setUserFading(false);
  }, [latestUserMsg?.id]);

  useEffect(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);

    if (latestAiIdx <= displayedAiIdx) return;
    if (latestAiIdx < 0) return;

    const elapsed = Date.now() - userShownAtRef.current;
    const waitMore = Math.max(0, USER_HOLD_MS - elapsed);

    holdTimerRef.current = setTimeout(() => {
      setDisplayedAiIdx(latestAiIdx);
      setUserFading(true);
      fadeTimerRef.current = setTimeout(() => {
        setFadingUserMsg(null);
        setUserFading(false);
      }, USER_FADE_MS);
    }, waitMore);

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [latestAiIdx]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const showingAiMsg = displayedAiIdx >= 0 ? messages[displayedAiIdx] : null;

  const aiSentences = useMemo(() => {
    if (!showingAiMsg || showingAiMsg.sender !== 'ai') return [];
    return showingAiMsg.text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  }, [showingAiMsg]);

  const [revealedCount, setRevealedCount] = useState(0);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const revealNext = useCallback(() => {
    setRevealedCount((c) => c + 1);
  }, []);

  useEffect(() => {
    if (revealTimer.current) clearTimeout(revealTimer.current);
    if (!showingAiMsg) {
      setRevealedCount(0);
      return;
    }

    setRevealedCount(1);

    let idx = 1;
    const tick = () => {
      if (idx >= aiSentences.length) return;
      const delay = Math.min(1000 + aiSentences[idx - 1].length * 13, 2400);
      revealTimer.current = setTimeout(() => {
        revealNext();
        idx++;
        tick();
      }, delay);
    };
    tick();

    return () => {
      if (revealTimer.current) clearTimeout(revealTimer.current);
    };
  }, [showingAiMsg?.id, aiSentences.length]);

  const showUserOnly = !showingAiMsg && latestUserMsg;
  const currentSoloMsg = showUserOnly
    ? latestUserMsg
    : !fadingUserMsg && !showingAiMsg
      ? latestAiMsg || messages[messages.length - 1]
      : null;

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
          height: '22vh',
          background: `linear-gradient(to bottom, ${spectra}, transparent)`,
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

      {/* Message area — bottom-anchored, grows upward */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 28px 26vh',
          gap: 32,
        }}
      >
        {/* Solo message display (only user, or only AI with no stacked pair) */}
        <AnimatePresence>
          {currentSoloMsg && !fadingUserMsg && !showingAiMsg && (
            <motion.div
              key={`solo-${currentSoloMsg.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
                {currentSoloMsg.sender === 'ai' ? 'JODIE' : 'YOU'}
              </p>
              {currentSoloMsg.sender === 'ai' ? (
                <div style={{ lineHeight: 1.2, margin: 0 }}>
                  {renderEmphasis(currentSoloMsg.text, 40, pampas, userName)}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 400,
                    color: sinbad,
                    lineHeight: 1.25,
                    whiteSpace: 'pre-line' as const,
                    margin: 0,
                  }}
                >
                  {currentSoloMsg.text}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stacked: user text (fading) above, Jodie text (building) below */}
        <AnimatePresence>
          {fadingUserMsg && (
            <motion.div
              key={`held-${fadingUserMsg.id}`}
              initial={{ opacity: 1, y: 0 }}
              animate={{
                opacity: userFading ? 0 : 1,
                y: userFading ? -30 : 0,
              }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: userFading ? USER_FADE_MS / 1000 : 0.4, ease: 'easeOut' }}
              style={{ textAlign: 'left', maxWidth: '100%' }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: sinbad,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  margin: '0 0 10px',
                  opacity: 0.6,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                YOU
              </p>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 400,
                  color: sinbad,
                  lineHeight: 1.25,
                  whiteSpace: 'pre-line' as const,
                }}
              >
                {fadingUserMsg.text}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showingAiMsg && (
            <motion.div
              key={`ai-${showingAiMsg.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
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
                JODIE
              </p>

              <div style={{ lineHeight: 1.2, margin: 0 }}>
                {aiSentences.slice(0, revealedCount).map((sentence, si) => (
                  <motion.span
                    key={`${showingAiMsg.id}-s${si}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'inline', fontSize: 40, fontWeight: 700, color: pampas }}
                  >
                    {si > 0 ? ' ' : ''}
                    {renderEmphasis(sentence, 40, pampas, userName)}
                  </motion.span>
                ))}
              </div>

              {/* Baseline options */}
              {type === 'baseline' && showingAiMsg.options && (
                <div style={{ marginTop: 32 }}>
                  {showingAiMsg.options.map((opt, i) => (
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
          )}
        </AnimatePresence>
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
