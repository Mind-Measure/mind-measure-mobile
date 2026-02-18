import { motion, AnimatePresence, type Variants } from 'motion/react';
import { Loader2, Flame, TrendingUp, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveNudges } from '@/hooks/useActiveNudges';

// ── Brand palette ──────────────────────────────────────
const C = {
  buttercup: '#F59E0B',
  bittersweet: '#FF6B6B',
  sinbad: '#99CCCE',
  pampas: '#FAF9F7',
  spectra: '#2D4C4C',
  white: '#FFFFFF',
};

const body = "'Inter', system-ui, sans-serif";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const getScoreLabel = (s: number) => {
  if (s >= 80) return 'Excellent';
  if (s >= 70) return 'Great';
  if (s >= 60) return 'Good';
  if (s >= 50) return 'Fair';
  return 'Needs Attention';
};

function getHeroState(score: number) {
  if (score >= 80) return { backgroundColor: '#DDD6FE', textColor: C.spectra, affirmation: 'Strong momentum.', label: 'High' };
  if (score >= 60) return { backgroundColor: C.sinbad, textColor: C.spectra, greetingColor: '#1a2e2e', affirmation: "You're doing great.", label: 'Stable' };
  if (score >= 40) return { backgroundColor: C.buttercup, textColor: C.spectra, affirmation: "Let's build momentum.", label: 'Mid' };
  return { backgroundColor: C.bittersweet, textColor: '#ffffff', affirmation: 'Something needs attention.', label: 'Low' };
}

// ── Detail Panel ───────────────────────────────────────
type PanelId = 'score' | 'mood' | 'streak' | 'positive' | 'negative' | 'insight' | null;

const panelConfig: Record<string, { title: string; accent: string }> = {
  score: { title: 'Your Score', accent: C.sinbad },
  mood: { title: 'Mood', accent: C.buttercup },
  streak: { title: 'Streak', accent: C.bittersweet },
  positive: { title: 'Enjoying', accent: C.sinbad },
  negative: { title: 'On Your Mind', accent: C.bittersweet },
  insight: { title: 'Latest Insight', accent: C.buttercup },
};

function DetailPanel({ id, onClose, data }: {
  id: PanelId;
  onClose: () => void;
  data: {
    score: number;
    scoreDelta: number;
    moodScore: number;
    streak: number;
    driverPositive: string[];
    driverNegative: string[];
    summary: string;
    lastCheckinDate: string;
  };
}) {
  if (!id) return null;
  const cfg = panelConfig[id];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '400px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflowY: 'auto',
          maxHeight: '80vh',
          backgroundColor: C.pampas,
        }}
      >
        <div style={{ height: '32px', borderRadius: '24px 24px 0 0', backgroundColor: cfg.accent }} />
        <div style={{ padding: '24px', position: 'relative' }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '12px', right: '12px',
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={14} color={C.spectra} />
          </button>

          <h3 style={{ fontSize: '18px', fontWeight: 500, color: C.spectra, margin: '0 0 16px', fontFamily: body }}>{cfg.title}</h3>

          {id === 'score' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '56px', fontWeight: 900, color: C.spectra, letterSpacing: '-0.03em', lineHeight: 1 }}>{data.score}</span>
                <span style={{ fontSize: '18px', fontWeight: 400, color: C.spectra, opacity: 0.5 }}>{getScoreLabel(data.score)}</span>
              </div>
              {data.scoreDelta !== 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  backgroundColor: `${cfg.accent}25`, padding: '6px 12px',
                  borderRadius: '9999px', width: 'fit-content', marginBottom: '16px',
                }}>
                  <TrendingUp size={14} color={cfg.accent} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: C.spectra }}>
                    {data.scoreDelta > 0 ? '+' : ''}{data.scoreDelta} from last check-in
                  </span>
                </div>
              )}
              <p style={{ fontSize: '15px', lineHeight: 1.625, color: 'rgba(45,76,76,0.8)', margin: 0 }}>
                This reflects sleep, stress, social connection, motivation, and emotional state.
              </p>
            </div>
          )}

          {id === 'mood' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '48px', fontWeight: 900, color: C.spectra, letterSpacing: '-0.03em', lineHeight: 1 }}>{data.moodScore}</span>
                <span style={{ fontSize: '16px', fontWeight: 400, color: C.spectra, opacity: 0.4 }}>/10 today</span>
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.625, color: 'rgba(45,76,76,0.7)', margin: 0 }}>
                Your self-reported mood from your latest check-in.
              </p>
            </div>
          )}

          {id === 'streak' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <Flame size={24} color={cfg.accent} />
                <span style={{ fontSize: '48px', fontWeight: 900, color: C.spectra, letterSpacing: '-0.03em', lineHeight: 1 }}>{data.streak}</span>
                <span style={{ fontSize: '16px', fontWeight: 400, color: C.spectra, opacity: 0.4 }}>day streak</span>
              </div>
              <div style={{
                backgroundColor: `${cfg.accent}10`, borderRadius: '12px',
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: C.spectra, marginBottom: '6px' }}>
                    {data.streak < 7 ? `${7 - data.streak} more days to your next reward` : 'Weekly streak achieved!'}
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(45,76,76,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((data.streak / 7) * 100, 100)}%`, borderRadius: '3px', backgroundColor: cfg.accent }} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 600, color: cfg.accent }}>{data.streak}/7</span>
              </div>
            </div>
          )}

          {id === 'positive' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.driverPositive.length > 0 ? data.driverPositive.map((d, i) => (
                  <div key={d} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: `${cfg.accent}${i === 0 ? '20' : '10'}`,
                    borderRadius: '12px', padding: '14px 16px',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.accent }} />
                    <span style={{ fontSize: '16px', fontWeight: i === 0 ? 600 : 400, color: C.spectra }}>{d}</span>
                  </div>
                )) : (
                  <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.5)', fontStyle: 'italic' }}>No positive drivers discussed yet.</p>
                )}
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.625, color: 'rgba(45,76,76,0.7)', margin: '16px 0 0' }}>
                These came up as positives in your latest conversation.
              </p>
            </div>
          )}

          {id === 'negative' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.driverNegative.length > 0 ? data.driverNegative.map((d, i) => (
                  <div key={d} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    backgroundColor: `${cfg.accent}${i === 0 ? '18' : '0A'}`,
                    borderRadius: '12px', padding: '14px 16px',
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.accent }} />
                    <span style={{ fontSize: '16px', fontWeight: i === 0 ? 600 : 400, color: C.spectra }}>{d}</span>
                  </div>
                )) : (
                  <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.5)', fontStyle: 'italic' }}>No worries discussed.</p>
                )}
              </div>
              <p style={{ fontSize: '14px', lineHeight: 1.625, color: 'rgba(45,76,76,0.7)', margin: '16px 0 0' }}>
                These came up as stressors in your latest conversation.
              </p>
            </div>
          )}

          {id === 'insight' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.025em', fontWeight: 300, color: 'rgba(45,76,76,0.6)' }}>Latest Check-in</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(45,76,76,0.7)' }}>{data.lastCheckinDate}</div>
              </div>
              <div style={{ paddingTop: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 500, color: C.spectra, margin: 0 }}>Conversation Summary</h3>
              </div>
              <div style={{ fontSize: '15px', lineHeight: 1.625, color: 'rgba(45,76,76,0.8)' }}>
                {data.summary || 'Complete a check-in to see your conversation summary here.'}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Nudge Carousel ─────────────────────────────────────
function NudgeCarousel({ pinned, rotated }: { pinned: unknown; rotated: unknown }) {
  const nudges: Array<{ id: string; title: string; body: string; bg: string; text: string }> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapNudge = (n: any) => {
    if (!n) return null;
    return {
      id: n.id || String(Math.random()),
      title: n.title || '',
      body: n.body || n.content || '',
      bg: n.bg_color || n.background_color || C.sinbad,
      text: n.text_color || (n.bg_color === '#FF6B6B' ? '#ffffff' : '#1a2e2e'),
    };
  };

  if (pinned) nudges.push(mapNudge(pinned)!);
  if (rotated) nudges.push(mapNudge(rotated)!);
  const validNudges = nudges.filter(Boolean);

  const [active, setActive] = useState(0);
  if (validNudges.length === 0) return null;
  const nudge = validNudges[active % validNudges.length];

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
            cursor: validNudges.length > 1 ? 'pointer' : 'default',
          }}
          onClick={() => validNudges.length > 1 && setActive(i => (i + 1) % validNudges.length)}
        >
          <h4 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>{nudge.title}</h4>
          <p style={{ fontSize: '14px', lineHeight: 1.5, margin: 0, opacity: 0.85 }}>{nudge.body}</p>
        </motion.div>
      </AnimatePresence>

      {validNudges.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
          {validNudges.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active % validNudges.length ? '20px' : '6px',
                height: '6px', borderRadius: '3px',
                backgroundColor: i === active % validNudges.length ? C.spectra : 'rgba(45,76,76,0.15)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.2s ease', padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard Screen ───────────────────────────────────
interface DashboardScreenProps {
  onNeedHelp?: () => void;
  onCheckIn?: () => void;
  onRetakeBaseline?: () => void;
}

export function DashboardScreen({ onNeedHelp, onCheckIn, onRetakeBaseline }: DashboardScreenProps) {
  const { user: _user } = useAuth();
  const {
    profile,
    latestScore,
    latestSession,
    recentActivity,
    trendData: _trendData,
    hasData: _hasData,
    loading,
    error,
  } = useDashboardData();

  useEffect(() => {}, [profile]);

  const { pinned, rotated, loading: nudgesLoading } = useActiveNudges(profile?.university_id);

  const [openPanel, setOpenPanel] = useState<PanelId>(null);

  // Developer hack: Click score 5 times to reset baseline
  const [logoClickCount, setLogoClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScoreClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => setLogoClickCount(0), 2000);

    if (newCount === 5) {
      setLogoClickCount(0);
      const confirmed = window.confirm(
        'Developer Mode\n\nReset your baseline assessment?\n\nThis will clear your baseline data and let you retake the assessment.'
      );
      if (confirmed && onRetakeBaseline) onRetakeBaseline();
    }
  };

  const isPostBaselineView =
    recentActivity.length > 0 && recentActivity.every((activity) => activity.type === 'baseline');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.sinbad, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: C.spectra, marginBottom: '16px' }} />
          <p style={{ color: C.spectra, opacity: 0.7 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.pampas, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: C.bittersweet, marginBottom: '8px' }}>Failed to load dashboard</p>
          <p style={{ color: 'rgba(45,76,76,0.5)', fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  const score = latestScore?.score ?? 0;
  const scoreDelta = latestScore?.trend ?? 0;
  const moodScore = latestSession?.moodScore ?? 0;
  const streak = profile.streakCount ?? 0;
  const driverPositive = latestSession?.driverPositive ?? [];
  const driverNegative = latestSession?.driverNegative ?? [];
  const summary = latestSession?.summary ?? '';
  const lastCheckinDate = latestSession?.createdAt ?? '';
  const firstName = profile.firstName || 'there';

  const hs = getHeroState(score);
  const getAdaptiveColor = (opacity: number) =>
    `${hs.backgroundColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
  const cardTextColor = hs.textColor === '#ffffff' ? C.spectra : hs.textColor;

  const checkInActivity = recentActivity.filter((a) => a.type === 'checkin');

  const panelData = { score, scoreDelta, moodScore, streak, driverPositive, driverNegative, summary, lastCheckinDate };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ═══ POSTER HERO ═══ */}
      {latestScore ? (
        <div style={{ position: 'relative', width: '100%', flexShrink: 0 }}>
          <div style={{ height: '624px', backgroundColor: hs.backgroundColor }} />
          <div style={{ position: 'absolute', inset: 0, padding: '0 24px' }}>
            <motion.div
              style={{ paddingTop: '17%' }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              <div style={{ marginBottom: '14px' }} onClick={handleScoreClick}>
                <div style={{
                  fontSize: '285px', lineHeight: 1, fontWeight: 900,
                  letterSpacing: '-0.05em', display: 'inline-block',
                  color: hs.textColor, fontVariantNumeric: 'tabular-nums',
                  cursor: 'pointer',
                }}>
                  {score}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <h1 style={{
                  fontSize: '32px', fontWeight: 500, letterSpacing: '-0.025em',
                  lineHeight: 1.25, color: hs.greetingColor || hs.textColor, margin: 0,
                }}>
                  {getGreeting()}, {firstName}
                </h1>
                <p style={{
                  fontSize: '26px', fontWeight: 300, letterSpacing: '-0.025em',
                  lineHeight: 1.25, fontStyle: 'italic', color: hs.textColor, margin: 0,
                }}>
                  {hs.affirmation}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div style={{
          height: '400px', backgroundColor: C.sinbad,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 24px',
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 500, color: C.spectra, margin: '0 0 12px' }}>
            {getGreeting()}, {firstName}
          </h1>
          <p style={{ fontSize: '18px', color: C.spectra, opacity: 0.7, margin: '0 0 24px' }}>
            Complete your first check-in to see your score
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckIn}
            style={{
              padding: '16px 32px', backgroundColor: C.spectra, color: C.white,
              border: 'none', borderRadius: '16px', fontSize: '18px', fontWeight: 500,
              cursor: 'pointer', width: 'fit-content',
            }}
          >
            Start Assessment
          </motion.button>
        </div>
      )}

      {/* ═══ DASHBOARD GRID ═══ */}
      <div style={{
        flex: 1, overflowY: 'auto', backgroundColor: C.white,
        padding: '24px', display: 'flex', flexDirection: 'column',
        gap: '12px', paddingBottom: '100px',
      }}>
        {/* Check-in + Help buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={onCheckIn}
            style={{
              gridColumn: 'span 3', backgroundColor: C.spectra, color: C.white,
              borderRadius: '16px', padding: '20px', height: '64px',
              fontSize: '18px', fontWeight: 500, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            + Check in
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={onNeedHelp}
            style={{
              gridColumn: 'span 2', borderRadius: '16px', padding: '12px',
              height: '64px', fontSize: '14px', fontWeight: 500, border: 'none',
              cursor: 'pointer', backgroundColor: 'rgba(246, 107, 107, 0.15)',
              color: '#F66B6B', display: 'flex', alignItems: 'center',
              justifyContent: 'center', transition: 'all 0.15s ease',
            }}>
            Need Help?
          </motion.button>
        </div>

        {/* Mood + Streak cards */}
        {!isPostBaselineView && latestSession && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <motion.div whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('mood')}
              style={{
                borderRadius: '16px', padding: '16px', height: '80px',
                backgroundColor: getAdaptiveColor(0.18), color: cardTextColor,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
              }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.025em', opacity: 0.6, fontWeight: 300 }}>Mood</div>
              <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.025em' }}>
                {moodScore}<span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.4 }}>/10</span>
              </div>
            </motion.div>

            <motion.div whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('streak')}
              style={{
                borderRadius: '16px', padding: '16px', height: '80px',
                backgroundColor: getAdaptiveColor(0.18), color: cardTextColor,
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
              }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.025em', opacity: 0.6, fontWeight: 300, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={12} style={{ opacity: 0.7 }} />
                Streak
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.025em' }}>
                {streak}<span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.4 }}> days</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Insight */}
        {!isPostBaselineView && latestSession && (
          <motion.button whileTap={{ scale: 0.98 }}
            onClick={() => setOpenPanel('insight')}
            style={{
              width: '100%', borderRadius: '16px', padding: '16px',
              textAlign: 'left', cursor: 'pointer',
              backgroundColor: getAdaptiveColor(0.18), color: cardTextColor,
              border: `1.5px solid ${getAdaptiveColor(0.35)}`,
            }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.025em', opacity: 0.6, marginBottom: '8px', fontWeight: 300 }}>Insight</div>
            <div style={{ fontSize: '16px' }}>
              {summary ? (summary.length > 60 ? summary.slice(0, 60) + '...' : summary) : 'Your energy patterns show you\'re most...'}
            </div>
          </motion.button>
        )}

        {/* Enjoying + Worry */}
        {!isPostBaselineView && latestSession && (driverPositive.length > 0 || driverNegative.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <motion.div whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('positive')}
              style={{
                borderRadius: '16px', padding: '16px', minHeight: '120px',
                backgroundColor: getAdaptiveColor(0.20), color: cardTextColor,
                cursor: 'pointer', overflow: 'hidden',
              }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.025em', opacity: 0.6, marginBottom: '8px', fontWeight: 300 }}>Enjoying</div>
              <div style={{ fontSize: '15px', lineHeight: 1.4 }}>
                {driverPositive.slice(0, 3).map(d => (
                  <div key={d} style={{ marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d}</div>
                ))}
              </div>
            </motion.div>

            <motion.div whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('negative')}
              style={{
                borderRadius: '16px', padding: '16px', minHeight: '120px',
                backgroundColor: getAdaptiveColor(0.45), color: cardTextColor,
                cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.025em', opacity: 0.6, marginBottom: '8px', fontWeight: 300 }}>Worry</div>
              <div style={{ fontSize: '15px', lineHeight: 1.4 }}>
                {driverNegative.length > 0 ? driverNegative.slice(0, 3).map(d => (
                  <div key={d} style={{ marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d}</div>
                )) : (
                  <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '14px' }}>(none discussed)</div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Previous Check-in */}
        {checkInActivity.length > 1 && (() => {
          const prevScore = checkInActivity[1].score;
          const prevBg = prevScore >= 80 ? '#DDD6FE' : prevScore >= 60 ? C.sinbad : prevScore >= 40 ? C.buttercup : C.bittersweet;
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={prevText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 300, letterSpacing: '0.08em', textTransform: 'uppercase', color: prevText, opacity: 0.5, marginBottom: '2px' }}>Previous Check-in</div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: prevText }}>
                  {new Date(checkInActivity[1].createdAt).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: prevText, letterSpacing: '-0.03em', lineHeight: 1 }}>{prevScore}</div>
                <div style={{ fontSize: '11px', fontWeight: 400, color: prevText, opacity: 0.6 }}>{getScoreLabel(prevScore)}</div>
              </div>
            </div>
          );
        })()}

        {/* Nudges */}
        {!nudgesLoading && (pinned || rotated) && (
          <div>
            <div style={{
              fontSize: '12px', fontWeight: 300, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'rgba(45,76,76,0.4)',
              marginBottom: '10px', paddingLeft: '2px',
            }}>What's Happening</div>
            <NudgeCarousel pinned={pinned} rotated={rotated} />
          </div>
        )}
      </div>

      {/* Detail panels */}
      <AnimatePresence>
        {openPanel && <DetailPanel id={openPanel} onClose={() => setOpenPanel(null)} data={panelData} />}
      </AnimatePresence>
    </div>
  );
}
