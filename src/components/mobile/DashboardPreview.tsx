/**
 * DashboardPreview — Multi-variant design exploration.
 * Access via http://localhost:3000?preview=dashboard
 *
 * Tap the variant label at the top to cycle through:
 *   E — Poster Hero (Pantone-inspired, score-state colours) ← PRIMARY
 *   A — Softer dark (not so black, better asymmetry)
 *   B — Cream canvas with colour blocks (lighter, transitions well)
 *   C — Split: dark score hero, cream detail cards below
 *   D — Rounded floating cards on dark, with depth
 *
 * Variant E has its own score-state switcher (Low/Mid/Stable/High)
 * to preview how the hero changes with different score values.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Plus, X, Flame, TrendingUp, ChevronRight, ChevronLeft, HelpCircle, Clock } from 'lucide-react';
import mindMeasureLogo from '../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';

// ── Brand palette ──────────────────────────────────────
const C = {
  buttercup: '#F59E0B',
  bittersweet: '#FF6B6B',
  sinbad: '#99CCCE',
  pampas: '#FAF9F7',
  spectra: '#2D4C4C',
  spectraMid: '#1E3A3A',
  spectraDeep: '#142828',
  apricot: '#FF9966',
  white: '#FFFFFF',
};

const heading = "'Lato', sans-serif";
const body = "'Inter', sans-serif";

const getScoreLabel = (s: number) => { if (s >= 80) return 'Excellent'; if (s >= 70) return 'Great'; if (s >= 60) return 'Good'; if (s >= 50) return 'Fair'; return 'Needs Attention'; };

const MOCK = {
  firstName: 'Alex',
  score: 72,
  scoreDelta: +7,
  streak: 4,
  lastUpdated: new Date().toLocaleDateString('en-GB'),
  moodScore: 7,
  summary: 'Balancing coursework and social life. Generally positive but stressed about exams.',
  themes: ['Academic Pressure', 'Social Life', 'Sleep', 'Exercise'],
  driverPositive: ['Friends', 'Sport', 'Music'],
  driverNegative: ['Deadlines', 'Sleep'],
};

const GAP = 5;

const containerV: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3, staggerChildren: 0.05 } } };
const blockV: Variants = { hidden: { scale: 0.96, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } } };

const getGreeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 18) return 'Good afternoon'; return 'Good evening'; };

// ── Detail Panel — centred modal style (unified) ─────────
type PanelId = 'score' | 'mood' | 'streak' | 'positive' | 'negative' | 'insight' | null;

const panelConfig: Record<string, { title: string; accent: string }> = {
  score: { title: 'Your Score', accent: '#99CCCE' },
  mood: { title: 'Mood', accent: '#F59E0B' },
  streak: { title: 'Streak', accent: '#FF6B6B' },
  positive: { title: 'Enjoying', accent: '#99CCCE' },
  negative: { title: 'On Your Mind', accent: '#FF6B6B' },
  insight: { title: 'Latest Insight', accent: '#F59E0B' },
};

const MOCK_MOOD_HISTORY = [
  { day: 'Mon', score: 6 }, { day: 'Tue', score: 5 }, { day: 'Wed', score: 7 },
  { day: 'Thu', score: 6 }, { day: 'Fri', score: 8 }, { day: 'Sat', score: 7 }, { day: 'Sun', score: 7 },
];

const MOCK_STREAK_DAYS = [
  { day: 'Thu', date: '13', done: true }, { day: 'Fri', date: '14', done: true },
  { day: 'Sat', date: '15', done: true }, { day: 'Sun', date: '16', done: true },
  { day: 'Mon', date: '17', done: false }, { day: 'Tue', date: '18', done: false },
  { day: 'Wed', date: '19', done: false },
];

function DetailPanel({ id, onClose }: { id: PanelId; onClose: () => void }) {
  if (!id) return null;
  const cfg = panelConfig[id];

  return (
    /* Container — fixed, mirrors the 430px phone frame, centres content */
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        maxWidth: '430px', margin: '0 auto',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Card — centred within the phone frame */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflowY: 'auto' as const,
          maxHeight: '80vh',
          backgroundColor: '#FAF9F7',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: '32px', borderRadius: '24px 24px 0 0', backgroundColor: cfg.accent }} />

        <div style={{ padding: '24px', position: 'relative' }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: '12px', right: '12px',
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="#2D4C4C" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Title */}
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#2D4C4C', margin: '0 0 16px' }}>{cfg.title}</h3>

          {/* ── SCORE ── */}
          {id === 'score' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '56px', fontWeight: 900, color: '#2D4C4C', letterSpacing: '-0.03em', lineHeight: 1 }}>{MOCK.score}</span>
                <span style={{ fontSize: '18px', fontWeight: 400, color: '#2D4C4C', opacity: 0.5 }}>{getScoreLabel(MOCK.score)}</span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                backgroundColor: `${cfg.accent}25`, padding: '6px 12px',
                borderRadius: '9999px', width: 'fit-content', marginBottom: '16px',
              }}>
                <TrendingUp size={14} color={cfg.accent} />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2D4C4C' }}>+{MOCK.scoreDelta} from last check-in</span>
              </div>
              <p style={{ fontSize: '15px', lineHeight: 1.625, color: 'rgba(45,76,76,0.8)', margin: 0 }}>
                This reflects sleep, stress, social connection, motivation, and emotional state.
              </p>
            </div>
          )}

          {/* ── MOOD — graph ── */}
          {id === 'mood' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: '#2D4C4C', letterSpacing: '-0.03em', lineHeight: 1 }}>{MOCK.moodScore}</span>
                <span style={{ fontSize: '16px', fontWeight: 400, color: '#2D4C4C', opacity: 0.4 }}>/10 today</span>
              </div>
              {/* 7-day mood bar chart */}
              <div style={{
                backgroundColor: `${cfg.accent}15`, borderRadius: '16px',
                padding: '16px', marginBottom: '16px',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#2D4C4C', opacity: 0.5, marginBottom: '12px' }}>
                  Last 7 days
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px' }}>
                  {MOCK_MOOD_HISTORY.map((d, i) => {
                    const barH = (d.score / 10) * 80;
                    const isToday = i === MOCK_MOOD_HISTORY.length - 1;
                    return (
                      <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#2D4C4C', opacity: isToday ? 1 : 0.5 }}>{d.score}</span>
                        <div style={{
                          width: '100%', height: `${barH}px`, borderRadius: '6px',
                          backgroundColor: isToday ? cfg.accent : `${cfg.accent}50`,
                          transition: 'height 0.3s ease',
                        }} />
                        <span style={{ fontSize: '10px', color: '#2D4C4C', opacity: 0.4, fontWeight: isToday ? 600 : 400 }}>{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.625, color: 'rgba(45,76,76,0.7)', margin: 0 }}>
                Your mood has been steady this week, with a high point on Friday.
              </p>
            </div>
          )}

          {/* ── STREAK — calendar + reward progress ── */}
          {id === 'streak' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Flame size={24} color={cfg.accent} />
                <span style={{ fontSize: '48px', fontWeight: 900, color: '#2D4C4C', letterSpacing: '-0.03em', lineHeight: 1 }}>{MOCK.streak}</span>
                <span style={{ fontSize: '16px', fontWeight: 400, color: '#2D4C4C', opacity: 0.4 }}>day streak</span>
              </div>
              {/* 7-day calendar view */}
              <div style={{
                backgroundColor: `${cfg.accent}12`, borderRadius: '16px',
                padding: '16px', marginBottom: '16px',
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {MOCK_STREAK_DAYS.map(d => (
                    <div key={d.date} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    }}>
                      <span style={{ fontSize: '10px', color: '#2D4C4C', opacity: 0.4 }}>{d.day}</span>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: d.done ? cfg.accent : 'rgba(45,76,76,0.06)',
                        color: d.done ? '#ffffff' : 'rgba(45,76,76,0.3)',
                        fontSize: '13px', fontWeight: d.done ? 700 : 400,
                      }}>
                        {d.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Reward progress */}
              <div style={{
                backgroundColor: `${cfg.accent}10`, borderRadius: '12px',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#2D4C4C', marginBottom: '6px' }}>
                    3 more days to your next reward
                  </div>
                  <div style={{
                    height: '6px', borderRadius: '3px', backgroundColor: 'rgba(45,76,76,0.08)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${(MOCK.streak / 7) * 100}%`,
                      borderRadius: '3px', backgroundColor: cfg.accent,
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: cfg.accent }}>{MOCK.streak}/7</span>
              </div>
            </div>
          )}

          {/* ── ENJOYING ── */}
          {id === 'positive' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOCK.driverPositive.map((d, i) => (
                  <div key={d} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: `${cfg.accent}${i === 0 ? '20' : '10'}`,
                    borderRadius: '12px', padding: '14px 16px',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: cfg.accent,
                    }} />
                    <span style={{ fontSize: '16px', fontWeight: i === 0 ? 600 : 400, color: '#2D4C4C' }}>{d}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.625, color: 'rgba(45,76,76,0.7)', margin: '16px 0 0' }}>
                These came up as positives in your latest conversation.
              </p>
            </div>
          )}

          {/* ── WORRY ── */}
          {id === 'negative' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOCK.driverNegative.map((d, i) => (
                  <div key={d} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: `${cfg.accent}${i === 0 ? '18' : '0A'}`,
                    borderRadius: '12px', padding: '14px 16px',
                  }}>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      backgroundColor: cfg.accent,
                    }} />
                    <span style={{ fontSize: '16px', fontWeight: i === 0 ? 600 : 400, color: '#2D4C4C' }}>{d}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.625, color: 'rgba(45,76,76,0.7)', margin: '16px 0 0' }}>
                These came up as stressors in your latest conversation.
              </p>
            </div>
          )}

          {/* ── INSIGHT ── */}
          {id === 'insight' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{
                  fontSize: '12px', textTransform: 'uppercase' as const,
                  letterSpacing: '0.025em', fontWeight: 300,
                  color: 'rgba(45,76,76,0.6)',
                }}>Latest Check-in</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(45,76,76,0.7)' }}>14/02/2026</div>
              </div>
              <div style={{ paddingTop: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 500, color: '#2D4C4C', margin: 0 }}>Conversation Summary</h3>
              </div>
              <div style={{ fontSize: '15px', lineHeight: 1.625, color: 'rgba(45,76,76,0.8)' }}>
                You talked about feeling a bit relaxed on the weekend, though the project you're working on was still on your mind. The bad weather was also an annoyance, but overall your mood was fairly solid.
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Block helper ───────────────────────────────────────
function B({ children, bg, onClick, style: s = {} }: { children: React.ReactNode; bg: string; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <motion.div variants={blockV} whileTap={onClick ? { scale: 0.97 } : undefined} onClick={onClick}
      style={{ background: bg, borderRadius: '4px', padding: '20px', cursor: onClick ? 'pointer' : 'default', overflow: 'hidden', position: 'relative', ...s }}>
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// VARIANT A — Softer dark, better asymmetry
// ═══════════════════════════════════════════════════════
function VariantA({ onPanel }: { onPanel: (id: PanelId) => void }) {
  return (
    <motion.div style={{ minHeight: '100vh', background: C.spectraMid, paddingBottom: '100px' }} variants={containerV} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ padding: '52px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={mindMeasureLogo} alt="" style={{ width: 28, height: 28, filter: 'brightness(0) invert(1)', opacity: 0.75 }} />
          <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Mind Measure</span>
        </div>
        {/* Need Help — always visible in header */}
        <button style={{ background: 'rgba(255,107,107,0.15)', border: `1px solid rgba(255,107,107,0.3)`, borderRadius: '9999px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <HelpCircle size={14} color={C.bittersweet} />
          <span style={{ fontFamily: body, fontSize: '12px', fontWeight: 600, color: C.bittersweet }}>Help</span>
        </button>
      </div>

      {/* Greeting */}
      <motion.div variants={blockV} style={{ padding: '0 20px 16px' }}>
        <h1 style={{ fontFamily: heading, fontWeight: 900, fontSize: '26px', color: C.white, margin: '0 0 2px', lineHeight: 1.15 }}>
          {getGreeting()}, {MOCK.firstName}
        </h1>
        <p style={{ fontFamily: body, fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{MOCK.lastUpdated}</p>
      </motion.div>

      {/* Grid */}
      <div style={{ padding: `0 ${GAP}px`, display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {/* Score — Sinbad, spans full width, tall */}
        <B bg={C.sinbad} onClick={() => onPanel('score')} style={{ padding: '24px 24px 28px' }}>
          <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A2E2E', opacity: 0.55, textTransform: 'uppercase' as const }}>Your Score</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '100px', lineHeight: 0.85, color: '#1A2E2E', letterSpacing: '-0.04em' }}>{MOCK.score}</span>
            <div>
              <div style={{ fontFamily: heading, fontWeight: 400, fontSize: '26px', color: '#1A2E2E', lineHeight: 1.1 }}>{getScoreLabel(MOCK.score)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <TrendingUp size={14} color="#1A2E2E" />
                <span style={{ fontFamily: body, fontSize: '13px', fontWeight: 600, color: '#1A2E2E' }}>+{MOCK.scoreDelta}</span>
              </div>
            </div>
          </div>
        </B>

        {/* Row 2: Mood (Buttercup) + Streak+CTA stacked */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${GAP}px` }}>
          <B bg={C.buttercup} onClick={() => onPanel('mood')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A1A1A', opacity: 0.5, textTransform: 'uppercase' as const }}>Mood</span>
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '52px', lineHeight: 0.85, color: '#1A1A1A', letterSpacing: '-0.03em' }}>{MOCK.moodScore}</span>
              <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '18px', color: '#1A1A1A', opacity: 0.5 }}> /10</span>
            </div>
          </B>

          <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
            <B bg={C.bittersweet} onClick={() => onPanel('streak')} style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color={C.white} style={{ opacity: 0.85 }} />
                <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '28px', color: C.white, lineHeight: 1 }}>{MOCK.streak}</span>
                <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '14px', color: C.white, opacity: 0.75 }}>day streak</span>
              </div>
            </B>
            {/* Check-In CTA */}
            <motion.button variants={blockV} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, padding: '16px', background: C.apricot, color: C.white, border: 'none', borderRadius: '4px', fontFamily: heading, fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Plus size={18} strokeWidth={2.5} /> Check In
            </motion.button>
          </div>
        </div>

        {/* Row 3: Enjoying (Pampas, wide) + On your mind (Spectra, narrow) — asymmetric */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: `${GAP}px` }}>
          <B bg={C.pampas} onClick={() => onPanel('positive')}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.spectra, opacity: 0.4, textTransform: 'uppercase' as const }}>Enjoying</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverPositive.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '24px' : '18px', fontWeight: i === 0 ? 900 : 400, color: C.spectra, lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </B>
          <B bg={C.spectra} onClick={() => onPanel('negative')}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.bittersweet, textTransform: 'uppercase' as const }}>Worry</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverNegative.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '20px' : '16px', fontWeight: i === 0 ? 900 : 400, color: C.white, lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </B>
        </div>

        {/* Insight — Buttercup bar */}
        <B bg={C.buttercup} onClick={() => onPanel('insight')} style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A1A1A', opacity: 0.5, textTransform: 'uppercase' as const }}>Insight</span>
              <div style={{ fontFamily: heading, fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginTop: '2px', lineHeight: 1.35 }}>{MOCK.summary.slice(0, 52)}...</div>
            </div>
            <ChevronRight size={18} color="#1A1A1A" style={{ opacity: 0.35 }} />
          </div>
        </B>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// VARIANT B — Cream canvas, colour blocks pop differently
// ═══════════════════════════════════════════════════════
function VariantB({ onPanel }: { onPanel: (id: PanelId) => void }) {
  return (
    <motion.div style={{ minHeight: '100vh', background: C.pampas, paddingBottom: '100px' }} variants={containerV} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ padding: '52px 20px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={mindMeasureLogo} alt="" style={{ width: 28, height: 28 }} />
          <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '11px', color: C.spectra, letterSpacing: '0.15em', textTransform: 'uppercase' as const, opacity: 0.5 }}>Mind Measure</span>
        </div>
        <button style={{ background: C.bittersweet, border: 'none', borderRadius: '9999px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <HelpCircle size={14} color={C.white} />
          <span style={{ fontFamily: body, fontSize: '12px', fontWeight: 600, color: C.white }}>Help</span>
        </button>
      </div>

      {/* Greeting */}
      <motion.div variants={blockV} style={{ padding: '8px 20px 16px' }}>
        <h1 style={{ fontFamily: heading, fontWeight: 900, fontSize: '26px', color: C.spectra, margin: '0 0 2px', lineHeight: 1.15 }}>
          {getGreeting()}, {MOCK.firstName}
        </h1>
        <p style={{ fontFamily: body, fontSize: '13px', color: '#9CA3AF', margin: 0 }}>{MOCK.lastUpdated}</p>
      </motion.div>

      {/* Grid */}
      <div style={{ padding: `0 ${GAP}px`, display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {/* Score — Sinbad hero */}
        <B bg={C.sinbad} onClick={() => onPanel('score')} style={{ padding: '24px 24px 28px' }}>
          <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A2E2E', opacity: 0.55, textTransform: 'uppercase' as const }}>Your Score</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '100px', lineHeight: 0.85, color: '#1A2E2E', letterSpacing: '-0.04em' }}>{MOCK.score}</span>
            <div>
              <div style={{ fontFamily: heading, fontWeight: 400, fontSize: '26px', color: '#1A2E2E', lineHeight: 1.1 }}>{getScoreLabel(MOCK.score)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <TrendingUp size={14} color="#1A2E2E" />
                <span style={{ fontFamily: body, fontSize: '13px', fontWeight: 600, color: '#1A2E2E' }}>+{MOCK.scoreDelta}</span>
              </div>
            </div>
          </div>
        </B>

        {/* Mood + Streak+CTA */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${GAP}px` }}>
          <B bg={C.spectra} onClick={() => onPanel('mood')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.sinbad, textTransform: 'uppercase' as const }}>Mood</span>
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '52px', lineHeight: 0.85, color: C.white, letterSpacing: '-0.03em' }}>{MOCK.moodScore}</span>
              <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '18px', color: C.white, opacity: 0.4 }}> /10</span>
            </div>
          </B>

          <div style={{ display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
            <B bg={C.buttercup} onClick={() => onPanel('streak')} style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="#1A1A1A" style={{ opacity: 0.7 }} />
                <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '28px', color: '#1A1A1A', lineHeight: 1 }}>{MOCK.streak}</span>
                <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '14px', color: '#1A1A1A', opacity: 0.6 }}>day streak</span>
              </div>
            </B>
            <motion.button variants={blockV} whileTap={{ scale: 0.97 }}
              style={{ flex: 1, padding: '16px', background: C.apricot, color: C.white, border: 'none', borderRadius: '4px', fontFamily: heading, fontSize: '15px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Plus size={18} strokeWidth={2.5} /> Check In
            </motion.button>
          </div>
        </div>

        {/* Enjoying + Worry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: `${GAP}px` }}>
          <B bg={C.white} onClick={() => onPanel('positive')} style={{ border: `1px solid #E5E7EB` }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.spectra, opacity: 0.35, textTransform: 'uppercase' as const }}>Enjoying</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverPositive.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '24px' : '18px', fontWeight: i === 0 ? 900 : 400, color: C.spectra, lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </B>
          <B bg={C.bittersweet} onClick={() => onPanel('negative')}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.white, opacity: 0.7, textTransform: 'uppercase' as const }}>Worry</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverNegative.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '20px' : '16px', fontWeight: i === 0 ? 900 : 400, color: C.white, lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </B>
        </div>

        {/* Insight */}
        <B bg={C.spectra} onClick={() => onPanel('insight')} style={{ padding: '14px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.sinbad, textTransform: 'uppercase' as const }}>Insight</span>
              <div style={{ fontFamily: heading, fontSize: '14px', fontWeight: 700, color: C.white, marginTop: '2px', lineHeight: 1.35 }}>{MOCK.summary.slice(0, 52)}...</div>
            </div>
            <ChevronRight size={18} color={C.sinbad} style={{ opacity: 0.5 }} />
          </div>
        </B>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// VARIANT C — Split: dark hero score, cream detail below
// ═══════════════════════════════════════════════════════
function VariantC({ onPanel }: { onPanel: (id: PanelId) => void }) {
  return (
    <motion.div style={{ minHeight: '100vh', paddingBottom: '100px' }} variants={containerV} initial="hidden" animate="visible">
      {/* ── Dark zone: score hero ── */}
      <div style={{ background: C.spectraMid }}>
        <div style={{ padding: '52px 24px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={mindMeasureLogo} alt="" style={{ width: 28, height: 28, filter: 'brightness(0) invert(1)', opacity: 0.75 }} />
            <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Mind Measure</span>
          </div>
          <button style={{ background: 'rgba(255,107,107,0.15)', border: `1px solid rgba(255,107,107,0.3)`, borderRadius: '9999px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <HelpCircle size={14} color={C.bittersweet} />
            <span style={{ fontFamily: body, fontSize: '12px', fontWeight: 600, color: C.bittersweet }}>Help</span>
          </button>
        </div>
        <motion.div variants={blockV} style={{ padding: '8px 24px 0' }}>
          <p style={{ fontFamily: body, fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px' }}>{getGreeting()}, {MOCK.firstName}</p>
        </motion.div>
        {/* Score */}
        <motion.div variants={blockV} onClick={() => onPanel('score')} style={{ padding: '8px 24px 32px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
            <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '108px', lineHeight: 0.82, color: C.sinbad, letterSpacing: '-0.04em' }}>{MOCK.score}</span>
            <div>
              <div style={{ fontFamily: heading, fontWeight: 400, fontSize: '28px', color: C.white, lineHeight: 1.1 }}>{getScoreLabel(MOCK.score)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                <TrendingUp size={14} color={C.sinbad} />
                <span style={{ fontFamily: body, fontSize: '13px', fontWeight: 600, color: C.sinbad }}>+{MOCK.scoreDelta}</span>
                <span style={{ fontFamily: body, fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: '8px' }}>{MOCK.lastUpdated}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Cream zone: detail cards ── */}
      <div style={{ background: C.pampas, padding: `16px ${GAP}px 0`, display: 'flex', flexDirection: 'column', gap: `${GAP}px` }}>
        {/* Mood + Streak */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${GAP}px` }}>
          <B bg={C.buttercup} onClick={() => onPanel('mood')}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A1A1A', opacity: 0.5, textTransform: 'uppercase' as const }}>Mood</span>
            <div style={{ marginTop: '6px' }}>
              <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '48px', lineHeight: 0.85, color: '#1A1A1A', letterSpacing: '-0.03em' }}>{MOCK.moodScore}</span>
              <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '16px', color: '#1A1A1A', opacity: 0.5 }}> /10</span>
            </div>
          </B>
          <B bg={C.bittersweet} onClick={() => onPanel('streak')} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.white, opacity: 0.7, textTransform: 'uppercase' as const }}>Streak</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <Flame size={22} color={C.white} style={{ opacity: 0.85 }} />
              <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '36px', color: C.white, lineHeight: 1 }}>{MOCK.streak}</span>
              <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '15px', color: C.white, opacity: 0.65 }}>days</span>
            </div>
          </B>
        </div>

        {/* Enjoying + Worry */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: `${GAP}px` }}>
          <B bg={C.sinbad} onClick={() => onPanel('positive')}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A2E2E', opacity: 0.5, textTransform: 'uppercase' as const }}>Enjoying</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverPositive.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '24px' : '18px', fontWeight: i === 0 ? 900 : 400, color: '#1A2E2E', lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </B>
          <B bg={C.spectra} onClick={() => onPanel('negative')}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.bittersweet, textTransform: 'uppercase' as const }}>Worry</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverNegative.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '20px' : '16px', fontWeight: i === 0 ? 900 : 400, color: C.white, lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </B>
        </div>

        {/* Insight */}
        <B bg={C.white} onClick={() => onPanel('insight')} style={{ padding: '14px 20px', border: `1px solid #E5E7EB` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.spectra, opacity: 0.4, textTransform: 'uppercase' as const }}>Insight</span>
              <div style={{ fontFamily: heading, fontSize: '14px', fontWeight: 700, color: C.spectra, marginTop: '2px', lineHeight: 1.35 }}>{MOCK.summary.slice(0, 52)}...</div>
            </div>
            <ChevronRight size={18} color={C.spectra} style={{ opacity: 0.3 }} />
          </div>
        </B>

        {/* CTA */}
        <motion.button variants={blockV} whileTap={{ scale: 0.97 }}
          style={{ width: '100%', padding: '18px', background: C.apricot, color: C.white, border: 'none', borderRadius: '4px', fontFamily: heading, fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Plus size={18} strokeWidth={2.5} /> Check In
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// VARIANT D — Rounded floating cards on dark, with depth
// ═══════════════════════════════════════════════════════
const R = 16; // border-radius for floating cards
const floatShadow = '0 4px 20px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)';

function VariantD({ onPanel }: { onPanel: (id: PanelId) => void }) {
  return (
    <motion.div style={{ minHeight: '100vh', background: C.spectraMid, paddingBottom: '100px' }} variants={containerV} initial="hidden" animate="visible">
      {/* Header */}
      <div style={{ padding: '52px 20px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={mindMeasureLogo} alt="" style={{ width: 28, height: 28, filter: 'brightness(0) invert(1)', opacity: 0.75 }} />
          <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase' as const }}>Mind Measure</span>
        </div>
        <button style={{ background: 'rgba(255,107,107,0.15)', border: `1px solid rgba(255,107,107,0.3)`, borderRadius: '9999px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <HelpCircle size={14} color={C.bittersweet} />
          <span style={{ fontFamily: body, fontSize: '12px', fontWeight: 600, color: C.bittersweet }}>Help</span>
        </button>
      </div>

      {/* Greeting */}
      <motion.div variants={blockV} style={{ padding: '0 20px 16px' }}>
        <h1 style={{ fontFamily: heading, fontWeight: 900, fontSize: '26px', color: C.white, margin: '0 0 2px', lineHeight: 1.15 }}>
          {getGreeting()}, {MOCK.firstName}
        </h1>
        <p style={{ fontFamily: body, fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{MOCK.lastUpdated}</p>
      </motion.div>

      {/* Cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Score — Sinbad, floating hero card */}
        <motion.div variants={blockV} whileTap={{ scale: 0.98 }} onClick={() => onPanel('score')}
          style={{ background: C.sinbad, borderRadius: R + 4, padding: '24px 24px 28px', boxShadow: floatShadow, cursor: 'pointer' }}>
          <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A2E2E', opacity: 0.55, textTransform: 'uppercase' as const }}>Your Score</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
            <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '100px', lineHeight: 0.85, color: '#1A2E2E', letterSpacing: '-0.04em' }}>{MOCK.score}</span>
            <div>
              <div style={{ fontFamily: heading, fontWeight: 400, fontSize: '26px', color: '#1A2E2E', lineHeight: 1.1 }}>{getScoreLabel(MOCK.score)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <TrendingUp size={14} color="#1A2E2E" />
                <span style={{ fontFamily: body, fontSize: '13px', fontWeight: 600, color: '#1A2E2E' }}>+{MOCK.scoreDelta}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mood + Streak side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <motion.div variants={blockV} whileTap={{ scale: 0.97 }} onClick={() => onPanel('mood')}
            style={{ background: C.buttercup, borderRadius: R, padding: '20px', boxShadow: floatShadow, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A1A1A', opacity: 0.5, textTransform: 'uppercase' as const }}>Mood</span>
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '52px', lineHeight: 0.85, color: '#1A1A1A', letterSpacing: '-0.03em' }}>{MOCK.moodScore}</span>
              <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '18px', color: '#1A1A1A', opacity: 0.5 }}> /10</span>
            </div>
          </motion.div>

          <motion.div variants={blockV} whileTap={{ scale: 0.97 }} onClick={() => onPanel('streak')}
            style={{ background: C.bittersweet, borderRadius: R, padding: '20px', boxShadow: floatShadow, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.white, opacity: 0.7, textTransform: 'uppercase' as const }}>Streak</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <Flame size={22} color={C.white} style={{ opacity: 0.85 }} />
              <span style={{ fontFamily: heading, fontWeight: 900, fontSize: '36px', color: C.white, lineHeight: 1 }}>{MOCK.streak}</span>
              <span style={{ fontFamily: heading, fontWeight: 400, fontSize: '15px', color: C.white, opacity: 0.65 }}>days</span>
            </div>
          </motion.div>
        </div>

        {/* Enjoying + Worry — asymmetric */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '14px' }}>
          <motion.div variants={blockV} whileTap={{ scale: 0.97 }} onClick={() => onPanel('positive')}
            style={{ background: C.pampas, borderRadius: R, padding: '20px', boxShadow: floatShadow, cursor: 'pointer' }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.spectra, opacity: 0.4, textTransform: 'uppercase' as const }}>Enjoying</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverPositive.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '24px' : '18px', fontWeight: i === 0 ? 900 : 400, color: C.spectra, lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={blockV} whileTap={{ scale: 0.97 }} onClick={() => onPanel('negative')}
            style={{ background: C.spectra, borderRadius: R, padding: '20px', boxShadow: floatShadow, cursor: 'pointer' }}>
            <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: C.bittersweet, textTransform: 'uppercase' as const }}>Worry</span>
            <div style={{ marginTop: '10px' }}>
              {MOCK.driverNegative.map((d, i) => (
                <div key={d} style={{ fontFamily: heading, fontSize: i === 0 ? '20px' : '16px', fontWeight: i === 0 ? 900 : 400, color: C.white, lineHeight: 1.25, marginBottom: '2px' }}>{d}</div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Insight — floating pill */}
        <motion.div variants={blockV} whileTap={{ scale: 0.97 }} onClick={() => onPanel('insight')}
          style={{ background: C.buttercup, borderRadius: R, padding: '14px 20px', boxShadow: floatShadow, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, marginRight: 12 }}>
              <span style={{ fontFamily: heading, fontSize: '11px', fontWeight: 400, letterSpacing: '0.15em', color: '#1A1A1A', opacity: 0.5, textTransform: 'uppercase' as const }}>Insight</span>
              <div style={{ fontFamily: heading, fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginTop: '2px', lineHeight: 1.35 }}>{MOCK.summary.slice(0, 52)}...</div>
            </div>
            <ChevronRight size={18} color="#1A1A1A" style={{ opacity: 0.35 }} />
          </div>
        </motion.div>

        {/* CTA — rounded pill */}
        <motion.button variants={blockV} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
          style={{ width: '100%', padding: '18px', background: C.apricot, color: C.white, border: 'none', borderRadius: '9999px', fontFamily: heading, fontSize: '16px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 4px 16px rgba(255,153,102,0.3)' }}>
          <Plus size={18} strokeWidth={2.5} /> Check In
        </motion.button>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// NUDGE CAROUSEL — university notifications
// Solid colour cards, black/white text, themed by subject
// ═══════════════════════════════════════════════════════
const MOCK_NUDGES = [
  {
    id: 1,
    title: 'Fancy A Cuppa?',
    body: 'Our Student Wellbeing Champions are here to listen, chat, and help you feel at home.',
    where: 'Peirson Guidance Centre',
    when: 'Tuesdays & Thursdays 1-2pm',
    bg: '#99CCCE',
    text: '#1a2e2e',
    cta: 'Learn More',
  },
  {
    id: 2,
    title: 'Exam Support Sessions',
    body: 'Drop-in workshops to help manage revision stress and build a study plan.',
    where: 'Library, Room 204',
    when: 'Weekdays 10am-12pm',
    bg: '#F59E0B',
    text: '#1a2e2e',
    cta: 'Book a Slot',
  },
  {
    id: 3,
    title: 'Need To Talk?',
    body: 'Confidential support available 24/7 through the university counselling service.',
    where: 'Online & In-person',
    when: 'Anytime',
    bg: '#FF6B6B',
    text: '#ffffff',
    cta: 'Get Support',
  },
  {
    id: 4,
    title: 'Move Your Body',
    body: 'Free yoga and mindfulness sessions — no experience needed.',
    where: 'Sports Centre, Studio 2',
    when: 'Mondays & Wednesdays 5pm',
    bg: '#DDD6FE',
    text: '#1a2e2e',
    cta: 'See Schedule',
  },
];

function NudgeCarousel() {
  const [active, setActive] = useState(0);
  const nudge = MOCK_NUDGES[active];
  const next = () => setActive(i => (i + 1) % MOCK_NUDGES.length);
  const prev = () => setActive(i => (i === 0 ? MOCK_NUDGES.length - 1 : i - 1));

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={nudge.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: nudge.bg,
            borderRadius: '16px',
            padding: '22px 20px',
            color: nudge.text,
            cursor: 'pointer',
          }}
          onClick={next}
        >
          {/* Title */}
          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>{nudge.title}</h4>

          {/* Body */}
          <p style={{ fontSize: '14px', lineHeight: 1.5, margin: '0 0 14px', opacity: 0.85 }}>{nudge.body}</p>

          {/* Where + When */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: 0.7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span><strong>Where:</strong> {nudge.where}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', opacity: 0.7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              <span><strong>When:</strong> {nudge.when}</span>
            </div>
          </div>

          {/* CTA */}
          <button style={{
            width: '100%', padding: '14px',
            backgroundColor: nudge.text === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.75)',
            color: nudge.text === '#ffffff' ? '#ffffff' : '#ffffff',
            border: 'none', borderRadius: '12px',
            fontSize: '15px', fontWeight: 600, cursor: 'pointer',
          }}>
            {nudge.cta}
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
        {MOCK_NUDGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              width: i === active ? '20px' : '6px',
              height: '6px',
              borderRadius: '3px',
              backgroundColor: i === active ? '#2D4C4C' : 'rgba(45,76,76,0.15)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// VARIANT E — Poster Hero (Pantone-inspired, score-state colours)
// Exact port of Figma: PosterHero.tsx + DashboardGrid.tsx + InsightModal.tsx
// ═══════════════════════════════════════════════════════
const heroStates = [
  { score: 28, backgroundColor: '#FF6B6B', affirmation: 'Something needs attention.', textColor: '#ffffff', label: 'Low' },
  { score: 52, backgroundColor: '#F59E0B', affirmation: "Let's build momentum.", textColor: '#2D4C4C', label: 'Mid' },
  { score: 72, backgroundColor: '#99CCCE', affirmation: "You're doing great.", textColor: '#2D4C4C', greetingColor: '#1a2e2e', label: 'Stable' },
  { score: 88, backgroundColor: '#DDD6FE', affirmation: 'Strong momentum.', textColor: '#2D4C4C', label: 'High' },
];

function VariantE({ onPanel, onCheckin }: { onPanel: (id: PanelId) => void; onCheckin?: () => void }) {
  const [stateIdx, setStateIdx] = useState(2);
  const hs = heroStates[stateIdx];

  const nextState = () => setStateIdx(i => (i + 1) % heroStates.length);
  const prevState = () => setStateIdx(i => (i === 0 ? heroStates.length - 1 : i - 1));

  const getAdaptiveColor = (opacity: number) =>
    `${hs.backgroundColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;

  const cardTextColor = hs.textColor === '#ffffff' ? '#2D4C4C' : hs.textColor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ═══ POSTER HERO — exact match of PosterHero.tsx ═══ */}
      <div style={{ position: 'relative', width: '100%', flexShrink: 0 }}>
        {/* Background colour area — 624px */}
        <div style={{ height: '624px', backgroundColor: hs.backgroundColor }} />

        {/* Content overlaid */}
        <div style={{ position: 'absolute', inset: 0, padding: '0 24px' }}>
          <motion.div
            key={stateIdx}
            style={{ paddingTop: '17%' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* Score — 285px, font-black, tracking-tighter */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{
                fontSize: '285px',
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: '-0.05em',
                display: 'inline-block',
                color: hs.textColor,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {hs.score}
              </div>
            </div>

            {/* Typography — tight relationship */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <h1 style={{
                fontSize: '32px',
                fontWeight: 500,
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
                color: hs.greetingColor || hs.textColor,
                margin: 0,
              }}>
                {getGreeting()}, {MOCK.firstName}
              </h1>
              <p style={{
                fontSize: '26px',
                fontWeight: 300,
                letterSpacing: '-0.025em',
                lineHeight: 1.25,
                fontStyle: 'italic',
                color: hs.textColor,
                margin: 0,
              }}>
                {hs.affirmation}
              </p>
            </div>
          </motion.div>

          {/* Mood + Streak removed — now displayed as dedicated cards in the grid */}
        </div>
      </div>

      {/* ═══ DASHBOARD GRID — exact match of DashboardGrid.tsx ═══ */}
      <div style={{
        flex: 1,
        overflowY: 'auto' as const,
        backgroundColor: '#ffffff',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingBottom: '100px',
      }}>
        {/* Buttons — 5-col grid: Check-in (3/5) + Help (2/5) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={onCheckin}
            style={{
              gridColumn: 'span 3',
              backgroundColor: '#2D4C4C',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '20px',
              height: '64px',
              fontSize: '18px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            + Check in
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F66B6B';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(246, 107, 107, 0.15)';
              e.currentTarget.style.color = '#F66B6B';
            }}
            style={{
              gridColumn: 'span 2',
              borderRadius: '16px',
              padding: '12px',
              height: '64px',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: 'rgba(246, 107, 107, 0.15)',
              color: '#F66B6B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}>
            Need Help?
          </motion.button>
        </div>

        {/* Mood + Streak — tappable cards, will open to detail views */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <motion.div whileTap={{ scale: 0.97 }}
            onClick={() => onPanel('mood')}
            style={{
              borderRadius: '16px',
              padding: '16px',
              height: '80px',
              backgroundColor: getAdaptiveColor(0.18),
              color: cardTextColor,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
            }}>
            <div style={{
              fontSize: '12px', textTransform: 'uppercase' as const,
              letterSpacing: '0.025em', opacity: 0.6, fontWeight: 300,
            }}>Mood</div>
            <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.025em' }}>
              {MOCK.moodScore}<span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.4 }}>/10</span>
            </div>
          </motion.div>

          <motion.div whileTap={{ scale: 0.97 }}
            onClick={() => onPanel('streak')}
            style={{
              borderRadius: '16px',
              padding: '16px',
              height: '80px',
              backgroundColor: getAdaptiveColor(0.18),
              color: cardTextColor,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
            }}>
            <div style={{
              fontSize: '12px', textTransform: 'uppercase' as const,
              letterSpacing: '0.025em', opacity: 0.6, fontWeight: 300,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Flame size={12} style={{ opacity: 0.7 }} />
              Streak
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.025em' }}>
              {MOCK.streak}<span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.4 }}> days</span>
            </div>
          </motion.div>
        </div>

        {/* Insight — clickable preview, adaptive bg + border */}
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={() => onPanel('insight')}
          style={{
            width: '100%',
            borderRadius: '16px',
            padding: '16px',
            textAlign: 'left' as const,
            cursor: 'pointer',
            backgroundColor: getAdaptiveColor(0.18),
            color: cardTextColor,
            border: `1.5px solid ${getAdaptiveColor(0.35)}`,
          }}>
          <div style={{
            fontSize: '12px', textTransform: 'uppercase' as const,
            letterSpacing: '0.025em', opacity: 0.6,
            marginBottom: '8px', fontWeight: 300,
          }}>Insight</div>
          <div style={{ fontSize: '16px' }}>Your energy patterns show you're most...</div>
        </motion.button>

        {/* Enjoying + Worry — 2-col, 140px tall, different opacities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <motion.div whileTap={{ scale: 0.97 }}
            onClick={() => onPanel('positive')}
            style={{
              borderRadius: '16px',
              padding: '16px',
              height: '140px',
              backgroundColor: getAdaptiveColor(0.20),
              color: cardTextColor,
              cursor: 'pointer',
            }}>
            <div style={{
              fontSize: '12px', textTransform: 'uppercase' as const,
              letterSpacing: '0.025em', opacity: 0.6,
              marginBottom: '8px', fontWeight: 300,
            }}>Enjoying</div>
            <div style={{ fontSize: '18px' }}>
              {MOCK.driverPositive.map(d => (
                <div key={d} style={{ marginBottom: '4px' }}>{d}</div>
              ))}
            </div>
          </motion.div>

          <motion.div whileTap={{ scale: 0.97 }}
            onClick={() => onPanel('negative')}
            style={{
              borderRadius: '16px',
              padding: '16px',
              height: '140px',
              backgroundColor: getAdaptiveColor(0.45),
              color: cardTextColor,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}>
            <div style={{
              fontSize: '12px', textTransform: 'uppercase' as const,
              letterSpacing: '0.025em', opacity: 0.6,
              marginBottom: '8px', fontWeight: 300,
            }}>Worry</div>
            <div style={{ fontSize: '18px' }}>
              {MOCK.driverNegative.map(d => (
                <div key={d} style={{ marginBottom: '4px' }}>{d}</div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Previous Check-in — colour represents THAT score, not the current one */}
        {(() => {
          const prevScore = 71;
          const prevBg = prevScore >= 80 ? '#DDD6FE' : prevScore >= 60 ? '#99CCCE' : prevScore >= 40 ? '#F59E0B' : '#FF6B6B';
          const prevText = prevScore < 40 ? '#ffffff' : '#1a2e2e';
          return (
            <div style={{
              borderRadius: '16px', padding: '16px 18px',
              backgroundColor: prevBg,
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                backgroundColor: 'rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={prevText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: prevText, opacity: 0.5, marginBottom: '2px' }}>Previous Check-in</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: prevText }}>Monday, 9 February 2026</div>
              </div>
              <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: prevText, letterSpacing: '-0.03em', lineHeight: 1 }}>{prevScore}</div>
                <div style={{ fontSize: '11px', fontWeight: 400, color: prevText, opacity: 0.6 }}>Good</div>
              </div>
            </div>
          );
        })()}

        {/* ── Nudges — university notifications carousel ── */}
        <div>
          <div style={{
            fontSize: '12px', fontWeight: 300, letterSpacing: '0.1em',
            textTransform: 'uppercase' as const, color: 'rgba(45,76,76,0.4)',
            marginBottom: '10px', paddingLeft: '2px',
          }}>What's Happening</div>
          <NudgeCarousel />
        </div>
      </div>

      {/* ═══ SCORE STATE SWITCHER — design-time only ═══ */}
      <div style={{
        position: 'fixed', bottom: 70, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: '16px', zIndex: 200,
      }}>
        <button onClick={prevState} style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1.5px solid rgba(45,76,76,0.2)',
          background: 'rgba(255,255,255,0.9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronLeft size={16} color="#2D4C4C" />
        </button>
        <span style={{
          fontSize: '14px', fontWeight: 500, color: '#ffffff',
          minWidth: 80, textAlign: 'center',
          background: 'rgba(0,0,0,0.5)', padding: '4px 14px', borderRadius: '9999px',
          backdropFilter: 'blur(4px)',
        }}>
          {hs.label} ({stateIdx + 1}/{heroStates.length})
        </span>
        <button onClick={nextState} style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '1.5px solid rgba(45,76,76,0.2)',
          background: 'rgba(255,255,255,0.9)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ChevronRight size={16} color="#2D4C4C" />
        </button>
      </div>

      {/* Insight modal now handled by shared DetailPanel */}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SCREEN: CONTENT — solid colour hero + filters + article cards
// ═══════════════════════════════════════════════════════
const CONTENT_FILTERS = ['All', 'Wellbeing', 'Anxiety', 'Sleep', 'Stress', 'Relationships', 'Exercise'];

const MOCK_ARTICLES = [
  {
    id: 1,
    title: 'The Importance of Connection: Building Supportive Relationships',
    excerpt: 'University can be one of the most socially intense times of your life but also one of the loneliest. Moving away from home, adjusting to a new environment, and trying to find your place can be overwhelming.',
    category: 'Relationships',
    categoryColor: '#DDD6FE',
    readTime: '4 min',
    isNew: true,
    imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=430&h=220&fit=crop',
  },
  {
    id: 2,
    title: 'Managing Exam Stress: Practical Strategies That Work',
    excerpt: 'Exams are one of the biggest sources of stress for students. But with the right strategies, you can manage your anxiety and perform at your best.',
    category: 'Anxiety',
    categoryColor: '#F59E0B',
    readTime: '5 min',
    isNew: true,
    imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=430&h=220&fit=crop',
  },
  {
    id: 3,
    title: 'Sleep Better Tonight: Small Changes, Big Impact',
    excerpt: 'Poor sleep affects everything — your mood, focus, and even your immune system. Here are evidence-based tips to improve your sleep quality.',
    category: 'Sleep',
    categoryColor: '#99CCCE',
    readTime: '3 min',
    isNew: false,
    imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=430&h=220&fit=crop',
  },
  {
    id: 4,
    title: 'Moving Your Body Doesn\'t Mean the Gym',
    excerpt: 'Exercise is one of the most effective ways to improve your mental health. But it doesn\'t have to be intense or structured.',
    category: 'Exercise',
    categoryColor: '#99CCCE',
    readTime: '4 min',
    isNew: false,
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=430&h=220&fit=crop',
  },
  {
    id: 5,
    title: 'When Motivation Dips: What Actually Helps',
    excerpt: 'Losing motivation is completely normal, especially during long terms. Understanding why can help you find your way back.',
    category: 'Wellbeing',
    categoryColor: '#FF6B6B',
    readTime: '3 min',
    isNew: false,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=430&h=220&fit=crop',
  },
];

function ContentScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = activeFilter === 'All'
    ? MOCK_ARTICLES
    : MOCK_ARTICLES.filter(a => a.category === activeFilter);

  const newCount = MOCK_ARTICLES.filter(a => a.isNew).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F0', paddingBottom: '100px' }}>

      {/* ═══ SOLID COLOUR HERO — top 30% ═══ */}
      <div style={{
        backgroundColor: '#2D4C4C',
        padding: '56px 24px 32px',
        minHeight: '260px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p style={{
            fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.5)',
            margin: '0 0 16px', letterSpacing: '0.05em',
          }}>
            University of Worcester
          </p>

          <h1 style={{
            fontSize: '32px', fontWeight: 700, color: '#ffffff',
            margin: '0 0 8px', letterSpacing: '-0.025em', lineHeight: 1.15,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Wellbeing Content
          </h1>

          <p style={{
            fontSize: '15px', fontWeight: 400, color: 'rgba(255,255,255,0.6)',
            margin: '0 0 20px', lineHeight: 1.5, maxWidth: '320px',
          }}>
            Expert tips, resources and insights from your student wellbeing team
          </p>

          {newCount > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '20px', padding: '8px 16px',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {newCount} new article{newCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══ FILTER PILLS ═══ */}
      <div style={{
        padding: '20px 0 12px',
        backgroundColor: '#F5F5F0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          display: 'flex', gap: '8px', overflowX: 'auto',
          padding: '0 24px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {CONTENT_FILTERS.map(filter => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  flexShrink: 0,
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: isActive ? 'none' : '1.5px solid rgba(45,76,76,0.15)',
                  backgroundColor: isActive ? '#2D4C4C' : '#ffffff',
                  color: isActive ? '#ffffff' : '#2D4C4C',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ ARTICLE CARDS ═══ */}
      <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filtered.map((article, i) => (
          <motion.div
            key={article.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {/* Image */}
            <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
              <div style={{
                width: '100%', height: '100%',
                backgroundColor: `${article.categoryColor}40`,
                backgroundImage: `url(${article.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />
              {article.isNew && (
                <div style={{
                  position: 'absolute', top: '12px', right: '12px',
                  backgroundColor: '#99CCCE',
                  color: '#1a2e2e',
                  fontSize: '11px', fontWeight: 700,
                  padding: '4px 10px', borderRadius: '6px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase' as const,
                }}>
                  NEW
                </div>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: '16px 20px 20px' }}>
              {/* Category + Read time row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 500, color: '#2D4C4C',
                  backgroundColor: `${article.categoryColor}30`,
                  padding: '4px 12px', borderRadius: '12px',
                }}>
                  {article.category}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(45,76,76,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {article.readTime}
                </span>
              </div>

              <h3 style={{
                fontSize: '17px', fontWeight: 600, color: '#2D4C4C',
                margin: '0 0 8px', lineHeight: 1.35,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>
                {article.title}
              </h3>

              <p style={{
                fontSize: '14px', color: 'rgba(45,76,76,0.6)',
                margin: '0 0 14px', lineHeight: 1.55,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}>
                {article.excerpt}
              </p>

              <span style={{
                fontSize: '14px', fontWeight: 600, color: '#2D4C4C',
                display: 'inline-flex', alignItems: 'center', gap: '4px',
              }}>
                Read full article <ChevronRight size={14} />
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SCREEN: BUDDIES — solid colour hero + ranked buddy list
// ═══════════════════════════════════════════════════════
const MOCK_BUDDIES = [
  { id: '1', name: 'Jamie Taylor', relationship: 'Partner', status: 'active' as const, lastContact: '2 hours ago', color: '#99CCCE' },
  { id: '2', name: 'Sam Chen', relationship: 'Housemate', status: 'active' as const, lastContact: 'Yesterday', color: '#DDD6FE' },
];

function BuddiesScreen() {
  const [showInfo, setShowInfo] = useState(false);
  const [buddyOrder, setBuddyOrder] = useState(MOCK_BUDDIES.map(b => b.id));
  const [dragging, setDragging] = useState<string | null>(null);

  const orderedBuddies = buddyOrder.map(id => MOCK_BUDDIES.find(b => b.id === id)!).filter(Boolean);

  const moveBuddy = (fromIdx: number, toIdx: number) => {
    const next = [...buddyOrder];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);
    setBuddyOrder(next);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F0', display: 'flex', flexDirection: 'column', paddingBottom: '100px' }}>

      {/* ═══ SOLID COLOUR HERO ═══ */}
      <div style={{
        backgroundColor: '#2D4C4C',
        padding: '56px 24px 32px',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={{
            fontSize: '32px', fontWeight: 700, color: '#ffffff',
            margin: '0 0 10px', letterSpacing: '-0.025em', lineHeight: 1.15,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Buddies
          </h1>

          <p style={{
            fontSize: '15px', fontWeight: 400, color: 'rgba(255,255,255,0.6)',
            margin: 0, lineHeight: 1.55, maxWidth: '340px',
          }}>
            A Buddy is someone you trust who agrees to be gently reminded to check in with you if things feel harder than usual.
          </p>
        </motion.div>
      </div>

      {/* ── Buddies list — numbered, ranked, draggable ── */}
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

          {/* Info icon — top right of list area */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2px' }}>
            <button
              onClick={() => setShowInfo(true)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                backgroundColor: 'rgba(45,76,76,0.06)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D4C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
              </svg>
            </button>
          </div>

          {/* Buddy cards — numbered spots */}
          {orderedBuddies.map((buddy, i) => (
            <motion.div
              key={buddy.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.08 }}
              layout
              style={{
                backgroundColor: '#ffffff', borderRadius: '16px',
                padding: '16px 16px 16px 12px',
                display: 'flex', alignItems: 'center', gap: '12px',
                boxShadow: dragging === buddy.id
                  ? '0 8px 24px rgba(0,0,0,0.12)'
                  : '0 2px 8px rgba(0,0,0,0.06)',
                cursor: 'grab',
                transition: 'box-shadow 0.2s ease',
                transform: dragging === buddy.id ? 'scale(1.02)' : 'scale(1)',
              }}
              onPointerDown={() => setDragging(buddy.id)}
              onPointerUp={() => setDragging(null)}
            >
              {/* Drag handle */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '2px',
                padding: '4px 2px', cursor: 'grab', flexShrink: 0,
                opacity: 0.25,
              }}>
                <div style={{ width: '12px', height: '2px', backgroundColor: '#2D4C4C', borderRadius: '1px' }} />
                <div style={{ width: '12px', height: '2px', backgroundColor: '#2D4C4C', borderRadius: '1px' }} />
                <div style={{ width: '12px', height: '2px', backgroundColor: '#2D4C4C', borderRadius: '1px' }} />
              </div>

              {/* Numbered spot */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: buddy.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 700, color: '#1a2e2e',
                flexShrink: 0,
              }}>
                {i + 1}
              </div>

              {/* Name + details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#2D4C4C', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {buddy.name}
                  </span>
                  {buddy.status === 'active' && (
                    <div style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      backgroundColor: '#4ADE80', flexShrink: 0,
                    }} />
                  )}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)' }}>
                  {buddy.relationship} · {buddy.lastContact}
                </div>
              </div>

              {/* Nudge button */}
              <button
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: 'rgba(153,204,206,0.2)',
                  color: '#2D4C4C',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(153,204,206,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(153,204,206,0.2)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                Nudge
              </button>
            </motion.div>
          ))}

          {/* Empty slot */}
          {orderedBuddies.length < 2 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{
                border: '2px dashed rgba(45,76,76,0.12)',
                borderRadius: '16px',
                padding: '20px 16px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <div style={{ width: '12px' }} />
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                backgroundColor: 'rgba(45,76,76,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 700, color: 'rgba(45,76,76,0.2)',
                flexShrink: 0,
              }}>
                {orderedBuddies.length + 1}
              </div>
              <span style={{ fontSize: '14px', color: 'rgba(45,76,76,0.3)', fontStyle: 'italic' }}>
                Empty spot
              </span>
            </motion.div>
          )}

          {/* Add buddy button */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{
              width: '100%', padding: '16px', marginTop: '8px',
              backgroundColor: '#2D4C4C', color: '#ffffff',
              border: 'none', borderRadius: '16px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <Plus size={16} /> Add a buddy
          </motion.button>

          {/* Reorder hint */}
          <p style={{
            fontSize: '12px', color: 'rgba(45,76,76,0.35)',
            textAlign: 'center', margin: '8px 0 0',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Drag to reorder — Spot 1 is contacted first
          </p>
        </div>

      {/* ═══ INFORMATION POP-UP ═══ */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setShowInfo(false)}
          >
            {/* Backdrop */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }} />

            {/* Modal — contained to 430px frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={e => e.stopPropagation()}
              style={{
                position: 'relative', zIndex: 101,
                width: 'calc(100% - 48px)', maxWidth: '382px',
                backgroundColor: '#ffffff', borderRadius: '20px',
                overflow: 'hidden',
              }}
            >
              {/* Accent bar */}
              <div style={{ height: '32px', backgroundColor: '#99CCCE' }} />

              {/* Close */}
              <button
                onClick={() => setShowInfo(false)}
                style={{
                  position: 'absolute', top: '44px', right: '16px',
                  width: '36px', height: '36px', borderRadius: '50%',
                  backgroundColor: 'rgba(45,76,76,0.06)', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} color="#2D4C4C" />
              </button>

              {/* Content */}
              <div style={{ padding: '24px 24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
                <h2 style={{
                  fontSize: '22px', fontWeight: 700, color: '#2D4C4C',
                  margin: '0 0 12px', lineHeight: 1.2,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  How Buddies Work
                </h2>

                <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.7)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  A Buddy is someone you trust who agrees to be gently reminded to check in with you if things feel harder than usual.
                </p>

                {/* What happens */}
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2D4C4C', margin: '0 0 10px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  What happens
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {[
                    'You choose someone and send them an invite',
                    'They can accept or decline, with no explanation needed',
                    'If they accept, they may occasionally get a nudge to check in with you',
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: '#99CCCE', flexShrink: 0, marginTop: '7px',
                      }} />
                      <p style={{ fontSize: '14px', color: '#2D4C4C', margin: 0, lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </div>

                {/* What Buddies see */}
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2D4C4C', margin: '0 0 10px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  What Buddies see
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {[
                    'They do not see your scores, check-ins, or activity',
                    'They are not alerted in emergencies',
                    'They are never expected to provide professional support',
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: '#DDD6FE', flexShrink: 0, marginTop: '7px',
                      }} />
                      <p style={{ fontSize: '14px', color: '#2D4C4C', margin: 0, lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </div>

                {/* Your control */}
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#2D4C4C', margin: '0 0 10px', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Your control
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                  {[
                    'Buddies are always optional',
                    'You can add or remove them at any time',
                    'They can opt out whenever they want',
                  ].map((text, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        backgroundColor: '#F59E0B', flexShrink: 0, marginTop: '7px',
                      }} />
                      <p style={{ fontSize: '14px', color: '#2D4C4C', margin: 0, lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </div>

                <p style={{
                  fontSize: '14px', color: 'rgba(45,76,76,0.5)', margin: '0 0 20px', lineHeight: 1.6,
                  fontStyle: 'italic',
                }}>
                  Buddies are about staying connected, not monitoring or intervention.
                </p>

                <button
                  onClick={() => setShowInfo(false)}
                  style={{
                    width: '100%', padding: '14px',
                    backgroundColor: '#2D4C4C', color: '#ffffff',
                    border: 'none', borderRadius: '14px',
                    fontSize: '15px', fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SCREEN: CHECK-IN — immersive, lyrics-scroll conversation
// Spotify lyrics meets Typeform: full Spectra, centred text,
// Pampas/Sinbad colours, Buttercup finish button
// ═══════════════════════════════════════════════════════
interface ConversationMessage {
  id: number;
  from: 'ai' | 'user';
  text: string;
  options?: string[];
}

const CHECKIN_MESSAGES: ConversationMessage[] = [
  { id: 1, from: 'ai', text: "Hey Alex. How are you *feeling* today?" },
  { id: 2, from: 'user', text: "Not bad actually. Had a good lecture this morning." },
  { id: 3, from: 'ai', text: "That's *great* to hear.\nWhat made it good?" },
  { id: 4, from: 'user', text: "The topic was interesting and I actually understood it for once." },
  { id: 5, from: 'ai', text: "Sounds like a *confidence boost*. Those moments *matter* — they remind you that you're making progress even when it doesn't always feel like it." },
  { id: 6, from: 'ai', text: "On a scale of one to ten, how would you rate your *mood* right now?" },
  { id: 7, from: 'user', text: "I'd say about a seven." },
  { id: 8, from: 'ai', text: "Compared to your *last check-in*, would you say things feel *better*, the *same*, or *worse*?" },
  { id: 9, from: 'user', text: "Better, definitely." },
  { id: 10, from: 'ai', text: "That's *really* good to hear, Alex. Keep noticing those *small wins* — they add up.\n\nDon't forget to press the finish button." },
];

const BASELINE_MESSAGES: ConversationMessage[] = [
  { id: 1, from: 'ai', text: "Hello Alex. I'm *Jodie*, and I'll be guiding you through your baseline assessment. There are *five* questions." },
  {
    id: 2, from: 'ai',
    text: "Question one.\nOver the past two weeks, how often have you felt *little interest* or *pleasure* in doing things?",
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
  },
  { id: 3, from: 'user', text: "Several days." },
  {
    id: 4, from: 'ai',
    text: "Question two.\nOver the past two weeks, how often have you felt *down*, *depressed*, or *hopeless*?",
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
  },
  { id: 5, from: 'user', text: "Not at all." },
  {
    id: 6, from: 'ai',
    text: "Question three.\nOver the past two weeks, how often have you felt *nervous*, *anxious*, or *on edge*?",
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
  },
  { id: 7, from: 'user', text: "Several days." },
  {
    id: 8, from: 'ai',
    text: "Question four.\nOver the past two weeks, how often have you been unable to *stop* or *control* worrying?",
    options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
  },
  { id: 9, from: 'user', text: "Not at all." },
  {
    id: 10, from: 'ai',
    text: "Question five.\nOn a scale of *one* to *ten*, how would you rate your current mood, where one is very low and ten is very high?",
  },
  { id: 11, from: 'user', text: "Seven." },
  { id: 12, from: 'ai', text: "That concludes our *baseline assessment*.\n\nDon't forget to press the finish button." },
];

// ─── PRODUCTION INTEGRATION NOTE ────────────────────────────────────
// Kinetic typography emphasis — tested in preview, ready for production.
//
// How it works:
//   Jodie's AI responses include *asterisks* around emotionally resonant
//   words. The renderEmphasis() parser below renders those words with:
//     • italic (fontStyle)
//     • +6px font size bump
//     • Sinbad (#99CCCE) accent colour
//
// To enable in production:
//   1. Add to Jodie's system prompt:
//      "Use *asterisks* around emotionally resonant or key words to
//       indicate natural spoken emphasis. Use sparingly — typically
//       1–3 words per response. Choose words you would naturally
//       stress if speaking aloud."
//   2. Use renderEmphasis() when rendering AI message text.
//   3. No post-processing or NLP pass needed — the LLM handles
//      emphasis placement natively.
//
// Guardrails: cap at ~3 emphasized words per message to avoid noise.
// ────────────────────────────────────────────────────────────────────
function renderEmphasis(text: string, baseColor: string, accentColor: string, baseFontSize: number): React.ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i, arr) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      const next = arr[i + 1] || '';
      const followedByPunctuation = /^[?,.\-!;:]/.test(next);
      return (
        <em key={i} style={{
          fontStyle: 'italic',
          fontWeight: 400,
          color: accentColor,
          fontSize: `${baseFontSize + 6}px`,
          marginRight: followedByPunctuation ? '2px' : undefined,
        }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function CheckinScreen({ onBack, mode = 'checkin', onToggleMode }: { onBack: () => void; mode?: 'checkin' | 'baseline'; onToggleMode?: () => void }) {
  const messages = mode === 'baseline' ? BASELINE_MESSAGES : CHECKIN_MESSAGES;
  const [phase, setPhase] = useState<'welcome' | 'conversation' | 'finished'>('welcome');
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Auto-advance: show one message at a time in the centre
  useEffect(() => {
    if (phase !== 'conversation') return;
    if (currentIdx >= messages.length - 1) return;

    const currentMsg = currentIdx >= 0 ? messages[currentIdx] : null;
    const optionCount = currentMsg?.options?.length ?? 0;

    const nextIdx = currentIdx + 1;
    const nextMsg = messages[nextIdx];
    // If current message has options, wait for them all to write on + time to speak
    // Each option takes 0.9s stagger + 1.2s initial delay + speaking time
    const optionsDelay = optionCount > 0 ? (1200 + optionCount * 900 + 2800) : 0;
    const baseDelay = currentIdx === -1 ? 600 : nextMsg.from === 'ai' ? 2800 : 1600;
    const delay = optionCount > 0 ? optionsDelay : baseDelay;

    const timer = setTimeout(() => {
      setCurrentIdx(nextIdx);
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, currentIdx, messages]);

  const handleFinish = () => {
    setPhase('finished');
    setTimeout(() => onBack(), 2000);
  };

  const handleBegin = () => {
    setCurrentIdx(-1);
    setPhase('conversation');
  };

  // Colour palette
  const spectra = '#2D4C4C';
  const pampas = '#FAF9F7';
  const sinbad = '#99CCCE';
  const buttercup = '#F59E0B';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: spectra,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ═══ WELCOME STATE ═══ */}
      <AnimatePresence>
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              padding: '0 28px',
              zIndex: 10,
            }}
          >
            {/* Back button — top left */}
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

            {/* Title + subtitle — left justified, upper portion */}
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
                {mode === 'baseline' ? 'Baseline' : 'Check in'}
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
                {mode === 'baseline'
                  ? 'Five questions with Jodie to establish your starting point'
                  : 'A few minutes with Jodie to see how you\'re doing today'}
              </p>
            </motion.div>

            {/* Begin button — left justified below text */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{ marginTop: '40px' }}
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleBegin}
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

            {/* Preview mode toggle — bottom right */}
            {onToggleMode && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={onToggleMode}
                style={{
                  position: 'absolute', bottom: '40px', right: '28px',
                  background: 'none', border: `1px solid rgba(153,204,206,0.2)`,
                  borderRadius: '8px', padding: '6px 12px',
                  color: sinbad, opacity: 0.4, fontSize: '11px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  cursor: 'pointer', letterSpacing: '0.02em',
                }}
              >
                {mode === 'baseline' ? 'Preview: Baseline' : 'Preview: Check-in'} — tap to switch
              </motion.button>
            )}

            {/* Camera + mic icons — bottom left */}
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
              {/* Camera icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sinbad} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
              </svg>
              {/* Mic icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sinbad} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CONVERSATION STATE — lyrics scroll ═══ */}
      <AnimatePresence>
        {phase === 'conversation' && (
          <motion.div
            key="conversation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              zIndex: 10,
            }}
          >
            {/* Subtle back — top left */}
            <button
              onClick={onBack}
              style={{
                position: 'absolute', top: '56px', left: '24px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: sinbad, opacity: 0.3,
                zIndex: 20,
              }}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Message — single message, left-justified, vertically centred */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '80px 28px 140px',
              overflow: 'hidden',
            }}>
              <AnimatePresence mode="wait">
                {currentIdx >= 0 && currentIdx < messages.length && (() => {
                  const msg = messages[currentIdx];
                  const isAI = msg.from === 'ai';
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                      style={{
                        textAlign: 'left',
                        width: '100%',
                      }}
                    >
                      {/* Speaker label */}
                      <p style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: sinbad,
                        opacity: isAI ? 0.4 : 0.3,
                        margin: '0 0 10px',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        fontFamily: 'Inter, system-ui, sans-serif',
                      }}>
                        {isAI ? 'Jodie' : 'You'}
                      </p>

                      {/* Message text */}
                      <p style={{
                        fontSize: isAI ? '34px' : '30px',
                        fontWeight: 300,
                        color: isAI ? pampas : sinbad,
                        margin: 0,
                        lineHeight: 1.45,
                        fontFamily: 'Lato, system-ui, sans-serif',
                        whiteSpace: 'pre-line',
                        letterSpacing: '-0.015em',
                      }}>
                        {isAI ? renderEmphasis(msg.text, pampas, sinbad, 34) : msg.text}
                      </p>

                      {/* Options — plain text, slow staggered write-on */}
                      {msg.options && (
                        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {msg.options.map((option, oi) => (
                            <motion.p
                              key={option}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 0.7, x: 0 }}
                              transition={{ delay: 1.2 + oi * 0.9, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                              style={{
                                margin: 0,
                                fontSize: '20px',
                                fontWeight: 300,
                                fontStyle: 'italic',
                                color: sinbad,
                                fontFamily: 'Lato, system-ui, sans-serif',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.6,
                              }}
                            >
                              {option}
                            </motion.p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>

            {/* Floating finish button — subtle outline, goes solid on last message */}
            {(() => {
              const isLastMessage = currentIdx >= messages.length - 1;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  style={{
                    position: 'absolute',
                    bottom: '40px',
                    right: '28px',
                    zIndex: 20,
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFinish}
                    animate={{
                      backgroundColor: isLastMessage ? buttercup : 'rgba(0,0,0,0)',
                      color: isLastMessage ? spectra : sinbad,
                      borderColor: isLastMessage ? buttercup : sinbad,
                      boxShadow: isLastMessage ? '0 4px 20px rgba(245,158,11,0.3)' : '0 0 0 rgba(0,0,0,0)',
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                      padding: '12px 28px',
                      border: `2px solid ${sinbad}`,
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'Inter, system-ui, sans-serif',
                      backgroundColor: 'transparent',
                      color: sinbad,
                    }}
                  >
                    Finish
                  </motion.button>
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FINISHED STATE ═══ */}
      <AnimatePresence>
        {phase === 'finished' && (
          <motion.div
            key="finished"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '60px 40px',
              zIndex: 10,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ textAlign: 'center' }}
            >
              <h2 style={{
                fontSize: '36px',
                fontWeight: 300,
                color: pampas,
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
                fontFamily: 'Lato, system-ui, sans-serif',
              }}>
                All done
              </h2>
              <p style={{
                fontSize: '17px',
                fontWeight: 300,
                color: sinbad,
                margin: 0,
                opacity: 0.6,
                fontFamily: 'Lato, system-ui, sans-serif',
                lineHeight: 1.6,
              }}>
                Thanks, Alex. Take care of yourself.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SCREEN: PROFILE — profile data + report + settings
// Design overlay only — production code untouched
// ═══════════════════════════════════════════════════════
const MOCK_PROFILE_FIELDS = [
  { key: 'course', label: 'Faculty / School', value: 'Social Sciences', filled: true },
  { key: 'year', label: 'Year of Study', value: 'Year 2', filled: true },
  { key: 'studyMode', label: 'Study Mode', value: 'Full-time', filled: true },
  { key: 'residence', label: 'Residence', value: 'On Campus', filled: true },
  { key: 'hall', label: 'Hall of Residence', value: 'St John\u2019s Campus', filled: true },
  { key: 'domicile', label: 'Domicile', value: 'Home', filled: true },
  { key: 'ageRange', label: 'Age Range', value: '18\u201320', filled: true },
];

const MOCK_SCORE_HISTORY = [62, 58, 65, 60, 68, 64, 70, 66, 72, 68, 74, 72];

function ProfileScreen() {
  const [profileExpanded, setProfileExpanded] = useState(false);

  const filledCount = MOCK_PROFILE_FIELDS.filter(f => f.filled).length;
  const totalCount = MOCK_PROFILE_FIELDS.length;
  const completionPct = Math.round((filledCount / totalCount) * 100);
  const isComplete = filledCount === totalCount;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F0', paddingBottom: '100px' }}>

      {/* ═══ SOLID COLOUR HERO ═══ */}
      <div style={{
        backgroundColor: '#2D4C4C',
        padding: '56px 24px 32px',
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              backgroundColor: '#99CCCE', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 700, color: '#1a2e2e',
            }}>AJ</div>
            <div>
              <h1 style={{
                fontSize: '26px', fontWeight: 700, color: '#ffffff',
                margin: '0 0 2px', letterSpacing: '-0.025em',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>Alex Johnson</h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                alex.johnson@worc.ac.uk
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '14px', fontWeight: 400, color: 'rgba(255,255,255,0.5)',
            margin: 0,
          }}>
            University of Worcester · Social Sciences · Year 2
          </p>
        </motion.div>
      </div>

      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* ═══ STATS ROW ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Check-ins', value: '24' },
            { label: 'Avg Score', value: '67' },
            { label: 'Best Streak', value: '12' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                backgroundColor: '#ffffff', borderRadius: '14px',
                padding: '14px 12px', textAlign: 'center' as const,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#2D4C4C', letterSpacing: '-0.03em', fontFamily: 'Inter, system-ui, sans-serif' }}>{stat.value}</div>
              <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: 'rgba(45,76,76,0.4)', marginTop: '2px' }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ═══ SCORE TREND ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(45,76,76,0.4)', marginBottom: '12px' }}>Score trend — 12 weeks</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '64px' }}>
            {MOCK_SCORE_HISTORY.map((s, i) => {
              const barH = ((s - 50) / 50) * 54 + 10;
              const isLast = i === MOCK_SCORE_HISTORY.length - 1;
              return (
                <div key={i} style={{
                  flex: 1, height: `${barH}px`, borderRadius: '3px',
                  backgroundColor: isLast ? '#99CCCE' : `rgba(153,204,206,${0.2 + (i / MOCK_SCORE_HISTORY.length) * 0.4})`,
                }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(45,76,76,0.3)' }}>12 wks ago</span>
            <span style={{ fontSize: '10px', color: 'rgba(45,76,76,0.3)' }}>Now</span>
          </div>
        </motion.div>

        {/* ═══ YOUR PROFILE — completion + fields ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header — tappable to expand */}
          <div
            onClick={() => setProfileExpanded(!profileExpanded)}
            style={{
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                {/* Completion ring */}
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="17" fill="none" stroke="rgba(45,76,76,0.08)" strokeWidth="3" />
                  <circle cx="20" cy="20" r="17" fill="none"
                    stroke={isComplete ? '#99CCCE' : '#F59E0B'}
                    strokeWidth="3"
                    strokeDasharray={`${completionPct * 1.07} 107`}
                    strokeLinecap="round"
                    transform="rotate(-90 20 20)"
                  />
                </svg>
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: isComplete ? '#2D4C4C' : '#F59E0B',
                }}>
                  {isComplete ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D4C4C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : `${completionPct}%`}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#2D4C4C', fontFamily: 'Inter, system-ui, sans-serif' }}>Your Profile</div>
                <div style={{ fontSize: '12px', color: isComplete ? 'rgba(45,76,76,0.4)' : '#F59E0B' }}>
                  {isComplete ? 'Complete' : `${filledCount} of ${totalCount} fields`}
                </div>
              </div>
            </div>
            <motion.div animate={{ rotate: profileExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight size={18} color="rgba(45,76,76,0.3)" />
            </motion.div>
          </div>

          {/* Expandable fields */}
          <AnimatePresence>
            {profileExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ borderTop: '1px solid rgba(45,76,76,0.06)', padding: '4px 0' }}>
                  {MOCK_PROFILE_FIELDS.map((field) => (
                    <div
                      key={field.key}
                      style={{
                        padding: '14px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: '14px', color: 'rgba(45,76,76,0.5)' }}>{field.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: 500,
                          color: field.filled ? '#2D4C4C' : 'rgba(45,76,76,0.25)',
                        }}>
                          {field.filled ? field.value : 'Not set'}
                        </span>
                        <ChevronRight size={14} color="rgba(45,76,76,0.2)" />
                      </div>
                    </div>
                  ))}
                </div>

                {!isComplete && (
                  <div style={{ padding: '12px 20px 16px' }}>
                    <div style={{
                      backgroundColor: 'rgba(245,158,11,0.08)',
                      borderRadius: '12px', padding: '12px 16px',
                      fontSize: '13px', color: '#92600A', lineHeight: 1.5,
                    }}>
                      Complete your profile to unlock streak rewards and help your university better support students like you.
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══ WELLBEING REPORT — major USP ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* Accent bar */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #99CCCE, #DDD6FE, #F59E0B)' }} />

          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{
                  fontSize: '17px', fontWeight: 700, color: '#2D4C4C', margin: '0 0 4px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>Your Wellbeing Report</h3>
                <p style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)', margin: 0 }}>
                  AI-powered personal insights
                </p>
              </div>
              <div style={{
                backgroundColor: 'rgba(153,204,206,0.15)',
                borderRadius: '10px', padding: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D4C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>

            {/* Report preview — 3 pages summary */}
            <div style={{
              backgroundColor: 'rgba(45,76,76,0.03)',
              borderRadius: '12px', padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[
                  { page: 'Dashboard', desc: 'Score, trends, clinical vitals' },
                  { page: 'AI Summary', desc: '5-section personalised analysis' },
                  { page: 'Check-in Log', desc: 'Detailed history with themes' },
                ].map((p, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center' as const }}>
                    <div style={{
                      width: '100%', aspectRatio: '3/4',
                      backgroundColor: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid rgba(45,76,76,0.08)',
                      marginBottom: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', fontWeight: 600, color: 'rgba(45,76,76,0.2)',
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#2D4C4C' }}>{p.page}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(45,76,76,0.4)', lineHeight: 1.3, marginTop: '1px' }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Period selector */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              {['14 days', '30 days', '90 days'].map((period, i) => (
                <button key={period} style={{
                  flex: 1, padding: '8px',
                  borderRadius: '10px',
                  border: i === 1 ? 'none' : '1.5px solid rgba(45,76,76,0.1)',
                  backgroundColor: i === 1 ? '#2D4C4C' : 'transparent',
                  color: i === 1 ? '#ffffff' : 'rgba(45,76,76,0.5)',
                  fontSize: '13px', fontWeight: i === 1 ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  {period}
                </button>
              ))}
            </div>

            {/* Generate button */}
            <button style={{
              width: '100%', padding: '14px',
              backgroundColor: '#2D4C4C', color: '#ffffff',
              border: 'none', borderRadius: '14px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
              Generate & Email Report
            </button>

            <p style={{
              fontSize: '11px', color: 'rgba(45,76,76,0.35)',
              textAlign: 'center', margin: '10px 0 0',
            }}>
              Report sent to your email with a secure 7-day link
            </p>

            <div style={{
              textAlign: 'center', marginTop: '10px',
            }}>
              <span style={{
                fontSize: '12px', fontWeight: 500, color: 'rgba(153,204,206,0.5)',
                cursor: 'default',
              }}>
                What is a Wellbeing Report?
              </span>
            </div>
          </div>
        </motion.div>

        {/* ═══ DATA OWNERSHIP ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            backgroundColor: 'rgba(153,204,206,0.1)',
            borderRadius: '16px',
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D4C4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#2D4C4C', margin: '0 0 4px' }}>This is your data</p>
              <p style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)', margin: 0, lineHeight: 1.5 }}>
                Every conversation, score and insight belongs to you. Share it with a counsellor, keep it for yourself, or export it any time.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ LEGAL & SETTINGS ═══ */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            backgroundColor: '#ffffff', borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {[
            { label: 'Privacy', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', sub: 'How we handle your data', isCard: true },
            { label: 'Privacy Policy', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', sub: 'mindmeasure.app', isLink: true },
            { label: 'Terms of Service', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', sub: 'mindmeasure.app', isLink: true },
          ].map((item, i) => (
            <div
              key={item.label}
              style={{
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer',
                borderTop: i > 0 ? '1px solid rgba(45,76,76,0.06)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(45,76,76,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {item.icon.split(' M').map((seg, j) => <path key={j} d={j === 0 ? seg : `M${seg}`} />)}
                </svg>
                <div>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#2D4C4C', fontFamily: 'Inter, system-ui, sans-serif', display: 'block' }}>{item.label}</span>
                  {item.sub && (
                    <span style={{ fontSize: '12px', color: 'rgba(45,76,76,0.35)' }}>{item.sub}</span>
                  )}
                </div>
              </div>
              {item.isLink ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(45,76,76,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              ) : (
                <ChevronRight size={16} color="rgba(45,76,76,0.2)" />
              )}
            </div>
          ))}
        </motion.div>

        {/* Sign out */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            width: '100%', padding: '14px',
            backgroundColor: 'transparent',
            color: '#FF6B6B',
            border: '1.5px solid rgba(255,107,107,0.2)',
            borderRadius: '14px',
            fontSize: '15px', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          Sign Out
        </motion.button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN — variant switcher
// ═══════════════════════════════════════════════════════
const variants = ['E', 'A', 'B', 'C', 'D'] as const;
type Variant = typeof variants[number];
const variantLabels: Record<Variant, string> = { E: 'E · Poster Hero', A: 'A · Sharp Dark', B: 'B · Cream Canvas', C: 'C · Split', D: 'D · Floating Cards' };

export function DashboardPreview() {
  const [variant, setVariant] = useState<Variant>('E');
  const [activeTab, setActiveTab] = useState<'home' | 'content' | 'buddies' | 'profile' | 'chat'>('home');
  const [openPanel, setOpenPanel] = useState<PanelId>(null);
  const [checkinMode, setCheckinMode] = useState<'checkin' | 'baseline'>('baseline');

  const nextVariant = () => { const i = variants.indexOf(variant); setVariant(variants[(i + 1) % variants.length]); };

  const isDark = variant === 'A' || variant === 'C' || variant === 'D';
  const isLight = variant === 'B' || variant === 'E';
  const navBg = isDark ? C.spectraDeep : C.white;
  const navActive = isDark ? C.apricot : C.spectra;
  const navInactive = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(45,76,76,0.3)';
  const navBorder = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';

  return (
    <div style={{ maxWidth: '430px', margin: '0 auto', position: 'relative', minHeight: '100vh', background: isDark ? C.spectraMid : variant === 'E' ? '#ffffff' : C.pampas }}>
      {/* Variant switcher */}
      <div onClick={nextVariant} style={{ position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)', background: C.apricot, color: C.white, fontSize: '11px', fontFamily: body, fontWeight: 600, padding: '3px 16px', borderRadius: '0 0 10px 10px', zIndex: 9999, letterSpacing: '0.04em', cursor: 'pointer', userSelect: 'none' }}>
        {variantLabels[variant]} — tap to switch
      </div>

      <AnimatePresence mode="wait">
        {variant === 'E' ? (
          <motion.div key={`E-${activeTab}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.2 }}>
            {activeTab === 'home' && <VariantE onPanel={setOpenPanel} onCheckin={() => setActiveTab('chat')} />}
            {activeTab === 'content' && <ContentScreen />}
            {activeTab === 'buddies' && <BuddiesScreen />}
            {activeTab === 'profile' && <ProfileScreen />}
            {activeTab === 'chat' && <CheckinScreen onBack={() => setActiveTab('home')} mode={checkinMode} onToggleMode={() => setCheckinMode(m => m === 'checkin' ? 'baseline' : 'checkin')} />}
          </motion.div>
        ) : (
          <motion.div key={variant} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
            {variant === 'A' && <VariantA onPanel={setOpenPanel} />}
            {variant === 'B' && <VariantB onPanel={setOpenPanel} />}
            {variant === 'C' && <VariantC onPanel={setOpenPanel} />}
            {variant === 'D' && <VariantD onPanel={setOpenPanel} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail panel */}
      <AnimatePresence>{openPanel && <DetailPanel id={openPanel} onClose={() => setOpenPanel(null)} />}</AnimatePresence>

      {/* Bottom nav — adapts to variant */}
      {variant !== 'E' && (
        <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: navBg, borderTop: `1px solid ${navBorder}`, padding: '8px 0', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
          {([['home','Home','M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10'],['content','Content','M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],['buddies','Buddies','M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],['profile','Profile','M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2']] as const).map(([id, label, d]) => {
            const isActive = activeTab === id;
            const color = isActive ? navActive : navInactive;
            return (
              <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color, flex: 1, maxWidth: 100 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {d.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : `M${seg}`} />)}
                  {id === 'buddies' && <circle cx="9" cy="7" r="4" />}
                  {id === 'profile' && <circle cx="12" cy="7" r="4" />}
                </svg>
                <span style={{ fontFamily: body, fontSize: '10px', fontWeight: isActive ? 600 : 400 }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Bottom nav for Variant E — hidden during chat */}
      {variant === 'E' && activeTab !== 'chat' && (
        <nav style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: C.white, borderTop: '1px solid #E5E7EB', padding: '8px 0', paddingBottom: 'max(8px, env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'space-around', zIndex: 100 }}>
          {([['home','Home','M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10'],['content','Content','M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],['buddies','Buddies','M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75'],['profile','Profile','M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2']] as const).map(([id, label, d]) => {
            const isActive = activeTab === id;
            const color = isActive ? C.buttercup : 'rgba(45,76,76,0.25)';
            return (
              <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 16px', background: 'transparent', border: 'none', cursor: 'pointer', color, flex: 1, maxWidth: 100 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {d.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : `M${seg}`} />)}
                  {id === 'buddies' && <circle cx="9" cy="7" r="4" />}
                  {id === 'profile' && <circle cx="12" cy="7" r="4" />}
                </svg>
                <span style={{ fontFamily: body, fontSize: '9px', fontWeight: isActive ? 600 : 300, letterSpacing: '0.05em' }}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
