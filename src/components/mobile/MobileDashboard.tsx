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
  if (score >= 80)
    return {
      backgroundColor: '#DDD6FE',
      textColor: C.spectra,
      affirmation: "You're doing great today.",
      label: 'High',
    };
  if (score >= 60)
    return {
      backgroundColor: C.sinbad,
      textColor: C.spectra,
      greetingColor: '#1a2e2e',
      affirmation: "You're doing well today.",
      label: 'Stable',
    };
  if (score >= 40)
    return { backgroundColor: C.buttercup, textColor: C.spectra, affirmation: "Let's build momentum.", label: 'Mid' };
  return {
    backgroundColor: C.bittersweet,
    textColor: '#ffffff',
    affirmation: 'Something needs attention.',
    label: 'Low',
  };
}

// ── Detail Panel ───────────────────────────────────────
type PanelId = 'score' | 'mood' | 'streak' | 'positive' | 'negative' | 'insight' | 'history' | null;

const panelConfig: Record<string, { title: string; accent: string }> = {
  score: { title: 'Your Score', accent: C.sinbad },
  mood: { title: 'Mood', accent: C.buttercup },
  streak: { title: 'Streak', accent: C.bittersweet },
  positive: { title: 'Enjoying', accent: C.sinbad },
  negative: { title: 'On Your Mind', accent: C.bittersweet },
  insight: { title: 'Latest Insight', accent: C.buttercup },
  history: { title: 'Your Journey', accent: C.spectra },
};

function DetailPanel({
  id,
  onClose,
  data,
}: {
  id: PanelId;
  onClose: () => void;
  data: {
    score: number;
    scoreDelta: number;
    moodScore: number;
    moodHistory: Array<{ date: string; score: number; dayLabel: string }>;
    checkinHistory: Array<{ date: string; score: number; dayLabel: string; dateLabel: string }>;
    streak: number;
    driverPositive: string[];
    driverNegative: string[];
    summary: string;
    lastCheckinDate: string;
    prevPositive: string[];
    prevNegative: string[];
    prevSummary: string;
    prevCheckinDate: string;
    scoreHistory: Array<{ date: string; score: number; dayLabel: string; dateLabel: string }>;
  };
}) {
  if (!id) return null;
  const cfg = panelConfig[id];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflowY: 'auto',
          maxHeight: '80vh',
          backgroundColor: C.pampas,
        }}
      >
        <div style={{ height: '32px', borderRadius: '24px 24px 0 0', backgroundColor: cfg.accent }} />
        <div style={{ padding: '24px', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} color={C.spectra} />
          </button>

          <h3 style={{ fontSize: '18px', fontWeight: 500, color: C.spectra, margin: '0 0 16px', fontFamily: body }}>
            {cfg.title}
          </h3>

          {id === 'score' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                <span
                  style={{
                    fontSize: '56px',
                    fontWeight: 900,
                    color: C.spectra,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {data.score}
                </span>
                <span style={{ fontSize: '18px', fontWeight: 400, color: C.spectra, opacity: 0.5 }}>
                  {getScoreLabel(data.score)}
                </span>
              </div>
              {data.scoreDelta !== 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: `${cfg.accent}25`,
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    width: 'fit-content',
                    marginBottom: '16px',
                  }}
                >
                  <TrendingUp size={14} color={cfg.accent} />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: C.spectra }}>
                    {data.scoreDelta > 0 ? '+' : ''}
                    {data.scoreDelta} from last check-in
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <span
                  style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: C.spectra,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {data.moodScore}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 400, color: C.spectra, opacity: 0.4 }}>/10</span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)', margin: '0 0 20px', fontWeight: 400 }}>
                How you rated your mood today
              </p>

              {data.moodHistory.length > 1 && (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      color: 'rgba(45,76,76,0.5)',
                      marginBottom: '12px',
                    }}
                  >
                    Last {data.moodHistory.length} check-ins
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: '6px',
                      height: '120px',
                      padding: '0 4px',
                    }}
                  >
                    {data.moodHistory.map((entry, i) => {
                      const pct = (entry.score / 10) * 100;
                      const isToday = i === data.moodHistory.length - 1;
                      const barColor = isToday ? C.buttercup : `${C.spectra}30`;
                      return (
                        <div
                          key={entry.date}
                          style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            height: '100%',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: isToday ? 700 : 500,
                              color: isToday ? C.spectra : 'rgba(45,76,76,0.5)',
                            }}
                          >
                            {entry.score}
                          </span>
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '32px',
                              height: `${Math.max(pct, 8)}%`,
                              backgroundColor: barColor,
                              borderRadius: '6px 6px 4px 4px',
                              transition: 'height 0.4s ease',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: isToday ? 600 : 400,
                              color: isToday ? C.spectra : 'rgba(45,76,76,0.45)',
                              letterSpacing: '0.01em',
                            }}
                          >
                            {entry.dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const avg =
                      Math.round((data.moodHistory.reduce((s, e) => s + e.score, 0) / data.moodHistory.length) * 10) /
                      10;
                    const latest = data.moodHistory[data.moodHistory.length - 1]?.score ?? 0;
                    const diff = latest - avg;
                    return (
                      <div
                        style={{
                          marginTop: '16px',
                          padding: '12px 14px',
                          backgroundColor: 'rgba(45,76,76,0.04)',
                          borderRadius: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              color: 'rgba(45,76,76,0.5)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            Average
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: C.spectra }}>{avg}</div>
                        </div>
                        {diff !== 0 && (
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 600,
                              color: diff > 0 ? '#22c55e' : C.bittersweet,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span style={{ fontSize: '16px' }}>{diff > 0 ? '↑' : '↓'}</span>
                            {Math.abs(diff).toFixed(1)} vs avg
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
              {data.moodHistory.length <= 1 && (
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.625,
                    color: 'rgba(45,76,76,0.6)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  Complete more check-ins to see your mood trend here.
                </p>
              )}
            </div>
          )}

          {id === 'streak' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                <Flame size={22} color={cfg.accent} style={{ alignSelf: 'center' }} />
                <span
                  style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    color: C.spectra,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}
                >
                  {data.streak}
                </span>
                <span style={{ fontSize: '16px', fontWeight: 400, color: C.spectra, opacity: 0.4 }}>
                  {data.streak === 1 ? 'day' : 'days'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)', margin: '0 0 20px', fontWeight: 400 }}>
                Consecutive days with a check-in
              </p>

              {/* Weekly goal progress */}
              <div
                style={{
                  backgroundColor: `${cfg.accent}10`,
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 500, color: C.spectra }}>
                    {data.streak >= 7
                      ? 'Weekly streak achieved!'
                      : `${7 - Math.min(data.streak, 7)} more days to weekly goal`}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: cfg.accent }}>
                    {Math.min(data.streak, 7)}/7
                  </span>
                </div>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(45,76,76,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min((data.streak / 7) * 100, 100)}%`,
                      borderRadius: '3px',
                      backgroundColor: cfg.accent,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              {/* Recent check-in history */}
              {data.checkinHistory.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      color: 'rgba(45,76,76,0.5)',
                      marginBottom: '10px',
                    }}
                  >
                    Recent check-ins
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {data.checkinHistory.map((entry, i) => {
                      const isLatest = i === data.checkinHistory.length - 1;
                      return (
                        <div
                          key={entry.date}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            backgroundColor: isLatest ? `${cfg.accent}15` : 'rgba(45,76,76,0.03)',
                          }}
                        >
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isLatest ? cfg.accent : `${C.spectra}30`,
                              flexShrink: 0,
                            }}
                          />
                          <div
                            style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <span style={{ fontSize: '14px', fontWeight: isLatest ? 600 : 400, color: C.spectra }}>
                                {entry.dayLabel}
                              </span>
                              <span style={{ fontSize: '12px', color: 'rgba(45,76,76,0.45)', marginLeft: '6px' }}>
                                {entry.dateLabel}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: C.spectra,
                                backgroundColor: `${C.spectra}0A`,
                                padding: '2px 10px',
                                borderRadius: '8px',
                              }}
                            >
                              {entry.score}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {data.checkinHistory.length === 0 && (
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.625,
                    color: 'rgba(45,76,76,0.6)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  Complete a check-in to start building your streak.
                </p>
              )}
            </div>
          )}

          {id === 'positive' && (
            <div>
              <div
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                  color: 'rgba(45,76,76,0.5)',
                  marginBottom: '10px',
                }}
              >
                Today
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: data.prevPositive.length > 0 ? '20px' : '0',
                }}
              >
                {data.driverPositive.length > 0 ? (
                  data.driverPositive.map((d, i) => (
                    <div
                      key={d}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: `${cfg.accent}${i === 0 ? '20' : '10'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.accent }} />
                      <span style={{ fontSize: '15px', fontWeight: i === 0 ? 600 : 400, color: C.spectra }}>{d}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.5)', fontStyle: 'italic', margin: 0 }}>
                    No positive drivers discussed yet.
                  </p>
                )}
              </div>

              {data.prevPositive.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      color: 'rgba(45,76,76,0.35)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(45,76,76,0.08)' }} />
                    Previous — {data.prevCheckinDate}
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(45,76,76,0.08)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {data.prevPositive.map((d) => (
                      <div
                        key={d}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 16px',
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(45,76,76,0.15)',
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(45,76,76,0.5)' }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {id === 'negative' && (
            <div>
              <div
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                  color: 'rgba(45,76,76,0.5)',
                  marginBottom: '10px',
                }}
              >
                Today
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginBottom: data.prevNegative.length > 0 ? '20px' : '0',
                }}
              >
                {data.driverNegative.length > 0 ? (
                  data.driverNegative.map((d, i) => (
                    <div
                      key={d}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backgroundColor: `${cfg.accent}${i === 0 ? '18' : '0A'}`,
                        borderRadius: '12px',
                        padding: '12px 16px',
                      }}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.accent }} />
                      <span style={{ fontSize: '15px', fontWeight: i === 0 ? 600 : 400, color: C.spectra }}>{d}</span>
                    </div>
                  ))
                ) : (
                  <p style={{ fontSize: '14px', color: 'rgba(45,76,76,0.5)', fontStyle: 'italic', margin: 0 }}>
                    Nothing flagged as a worry.
                  </p>
                )}
              </div>

              {data.prevNegative.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      color: 'rgba(45,76,76,0.35)',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(45,76,76,0.08)' }} />
                    Previous — {data.prevCheckinDate}
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(45,76,76,0.08)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {data.prevNegative.map((d) => (
                      <div
                        key={d}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '8px 16px',
                        }}
                      >
                        <div
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(45,76,76,0.15)',
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 400, color: 'rgba(45,76,76,0.5)' }}>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {id === 'insight' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                    color: 'rgba(45,76,76,0.5)',
                  }}
                >
                  Latest Check-in
                </div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(45,76,76,0.7)' }}>
                  {data.lastCheckinDate}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: C.spectra, marginBottom: '8px' }}>Summary</div>
                <div style={{ fontSize: '15px', lineHeight: 1.65, color: 'rgba(45,76,76,0.8)' }}>
                  {data.summary || 'Complete a check-in to see your conversation summary here.'}
                </div>
              </div>

              {data.prevSummary && data.prevCheckinDate && (
                <div>
                  <div
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      color: 'rgba(45,76,76,0.35)',
                      marginBottom: '10px',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(45,76,76,0.08)' }} />
                    Previous — {data.prevCheckinDate}
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(45,76,76,0.08)' }} />
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(45,76,76,0.5)' }}>
                    {data.prevSummary}
                  </div>
                </div>
              )}
            </div>
          )}

          {id === 'history' && (
            <div>
              {/* Score trend chart */}
              {data.scoreHistory.length > 1 ? (
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      color: 'rgba(45,76,76,0.5)',
                      marginBottom: '14px',
                    }}
                  >
                    Score trend
                  </div>

                  {/* Line chart area */}
                  <div style={{ position: 'relative', height: '140px', marginBottom: '8px' }}>
                    {/* Background bands */}
                    {[
                      { threshold: 80, color: '#DDD6FE', label: '80+' },
                      { threshold: 60, color: C.sinbad, label: '60' },
                      { threshold: 40, color: C.buttercup, label: '40' },
                    ].map((band) => (
                      <div
                        key={band.threshold}
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: `${(band.threshold / 100) * 100}%`,
                          borderBottom: `1px dashed rgba(45,76,76,0.08)`,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '-2px',
                            top: '-7px',
                            fontSize: '9px',
                            color: 'rgba(45,76,76,0.25)',
                            fontWeight: 500,
                          }}
                        >
                          {band.label}
                        </span>
                      </div>
                    ))}

                    {/* SVG line chart */}
                    <svg
                      width="100%"
                      height="100%"
                      viewBox={`0 0 ${Math.max((data.scoreHistory.length - 1) * 100, 100)} 100`}
                      preserveAspectRatio="none"
                      style={{ overflow: 'visible' }}
                    >
                      {/* Gradient fill under line */}
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.spectra} stopOpacity="0.15" />
                          <stop offset="100%" stopColor={C.spectra} stopOpacity="0.02" />
                        </linearGradient>
                      </defs>
                      {/* Area fill */}
                      <path
                        d={
                          data.scoreHistory
                            .map((e, i) => {
                              const x =
                                (i / Math.max(data.scoreHistory.length - 1, 1)) *
                                Math.max((data.scoreHistory.length - 1) * 100, 100);
                              const y = 100 - e.score;
                              return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                            })
                            .join(' ') + ` L${Math.max((data.scoreHistory.length - 1) * 100, 100)},100 L0,100 Z`
                        }
                        fill="url(#scoreGrad)"
                      />
                      {/* Line */}
                      <path
                        d={data.scoreHistory
                          .map((e, i) => {
                            const x =
                              (i / Math.max(data.scoreHistory.length - 1, 1)) *
                              Math.max((data.scoreHistory.length - 1) * 100, 100);
                            const y = 100 - e.score;
                            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke={C.spectra}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {/* Dots rendered as HTML for perfect circles (SVG preserveAspectRatio="none" distorts them) */}
                    {data.scoreHistory.map((e, i) => {
                      const xPct = (i / Math.max(data.scoreHistory.length - 1, 1)) * 100;
                      const yPct = 100 - e.score;
                      const isLatest = i === data.scoreHistory.length - 1;
                      const size = isLatest ? 10 : 7;
                      return (
                        <div
                          key={e.date}
                          style={{
                            position: 'absolute',
                            left: `${xPct}%`,
                            top: `${yPct}%`,
                            width: size,
                            height: size,
                            borderRadius: '50%',
                            backgroundColor: isLatest ? C.buttercup : C.pampas,
                            border: isLatest ? 'none' : `2px solid ${C.spectra}`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Day labels below chart */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0px' }}>
                    {data.scoreHistory.map((e, i) => (
                      <span
                        key={e.date}
                        style={{
                          fontSize: '10px',
                          fontWeight: i === data.scoreHistory.length - 1 ? 600 : 400,
                          color: i === data.scoreHistory.length - 1 ? C.spectra : 'rgba(45,76,76,0.4)',
                        }}
                      >
                        {e.dayLabel}
                      </span>
                    ))}
                  </div>

                  {/* Stats row */}
                  {(() => {
                    const scores = data.scoreHistory.map((e) => e.score);
                    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                    const high = Math.max(...scores);
                    const low = Math.min(...scores);
                    return (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '16px',
                        }}
                      >
                        {[
                          { label: 'Average', value: avg, color: C.spectra },
                          { label: 'High', value: high, color: '#22c55e' },
                          { label: 'Low', value: low, color: C.bittersweet },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            style={{
                              flex: 1,
                              padding: '10px 12px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(45,76,76,0.04)',
                              textAlign: 'center',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                fontWeight: 500,
                                color: 'rgba(45,76,76,0.45)',
                                marginBottom: '4px',
                              }}
                            >
                              {stat.label}
                            </div>
                            <div
                              style={{ fontSize: '20px', fontWeight: 800, color: stat.color, letterSpacing: '-0.02em' }}
                            >
                              {stat.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.625,
                    color: 'rgba(45,76,76,0.6)',
                    margin: '0 0 16px',
                    fontStyle: 'italic',
                  }}
                >
                  Complete more check-ins to see your score trend here.
                </p>
              )}

              {/* Check-in timeline */}
              {data.scoreHistory.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div
                    style={{
                      fontSize: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontWeight: 500,
                      color: 'rgba(45,76,76,0.5)',
                      marginBottom: '10px',
                    }}
                  >
                    Check-in history
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                    {[...data.scoreHistory].reverse().map((entry, i, arr) => {
                      const isFirst = i === 0;
                      const scoreBg =
                        entry.score >= 80
                          ? '#DDD6FE'
                          : entry.score >= 60
                            ? C.sinbad
                            : entry.score >= 40
                              ? C.buttercup
                              : C.bittersweet;
                      const prev = i < arr.length - 1 ? arr[i + 1] : null;
                      const delta = prev ? entry.score - prev.score : null;
                      return (
                        <div
                          key={entry.date}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 0',
                            borderBottom: i < arr.length - 1 ? '1px solid rgba(45,76,76,0.05)' : 'none',
                          }}
                        >
                          {/* Timeline dot + line */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              width: '16px',
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                width: isFirst ? '10px' : '8px',
                                height: isFirst ? '10px' : '8px',
                                borderRadius: '50%',
                                backgroundColor: isFirst ? scoreBg : `${C.spectra}25`,
                                border: isFirst ? `2px solid ${scoreBg}` : 'none',
                              }}
                            />
                          </div>
                          {/* Date */}
                          <div style={{ flex: 1 }}>
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: isFirst ? 600 : 400,
                                color: isFirst ? C.spectra : 'rgba(45,76,76,0.6)',
                              }}
                            >
                              {entry.dayLabel} {entry.dateLabel}
                            </span>
                          </div>
                          {/* Score + delta */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {delta !== null && delta !== 0 && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: delta > 0 ? '#22c55e' : C.bittersweet,
                                }}
                              >
                                {delta > 0 ? '+' : ''}
                                {delta}
                              </span>
                            )}
                            <div
                              style={{
                                width: '36px',
                                height: '28px',
                                borderRadius: '8px',
                                backgroundColor: scoreBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 800,
                                  color: entry.score < 40 ? '#fff' : C.spectra,
                                }}
                              >
                                {entry.score}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Nudge Carousel ─────────────────────────────────────
const CATEGORY_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  urgent: { bg: C.bittersweet, text: '#ffffff', accent: 'rgba(255,255,255,0.3)' },
  social: { bg: C.sinbad, text: C.spectra, accent: 'rgba(45,76,76,0.15)' },
  educational: { bg: C.buttercup, text: C.spectra, accent: 'rgba(45,76,76,0.15)' },
};
const DEFAULT_CAT_STYLE = { bg: C.sinbad, text: C.spectra, accent: 'rgba(45,76,76,0.15)' };

function NudgeCarousel({
  nudges,
}: {
  nudges: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    eventDate?: string | null;
    linkUrl: string;
  }>;
}) {
  const [active, setActive] = useState(0);
  if (nudges.length === 0) return null;

  const nudge = nudges[active % nudges.length];
  const style = CATEGORY_STYLES[nudge.category] || DEFAULT_CAT_STYLE;

  const handleTap = () => {
    if (nudge.linkUrl) {
      window.open(nudge.linkUrl, '_blank');
    } else if (nudges.length > 1) {
      setActive((i) => (i + 1) % nudges.length);
    }
  };

  const handleSwipe = () => {
    if (nudges.length > 1) {
      setActive((i) => (i + 1) % nudges.length);
    }
  };

  const formattedDate = nudge.eventDate
    ? new Date(nudge.eventDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
    : null;

  return (
    <div style={{ position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={nudge.id}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          drag={nudges.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, info) => {
            if (Math.abs(info.offset.x) > 50) handleSwipe();
          }}
          onClick={handleTap}
          style={{
            backgroundColor: style.bg,
            borderRadius: '16px',
            padding: '22px 20px',
            color: style.text,
            cursor: 'pointer',
          }}
        >
          {nudge.category === 'urgent' && (
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.85,
                marginBottom: '6px',
              }}
            >
              Urgent
            </div>
          )}
          <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 6px', lineHeight: 1.25 }}>{nudge.title}</h4>
          <p style={{ fontSize: '13.5px', lineHeight: 1.5, margin: 0, opacity: 0.85 }}>{nudge.description}</p>
          {formattedDate && (
            <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7, fontWeight: 500 }}>{formattedDate}</div>
          )}
          {nudge.linkUrl && (
            <div style={{ fontSize: '12px', marginTop: formattedDate ? '4px' : '10px', opacity: 0.7, fontWeight: 600 }}>
              Tap to find out more →
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {nudges.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
          {nudges.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: i === active % nudges.length ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: i === active % nudges.length ? C.spectra : 'rgba(45,76,76,0.15)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0,
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
    previousSession,
    recentActivity,
    moodHistory,
    checkinHistory,
    computedStreak: _computedStreak,
    trendData: _trendData,
    hasData: _hasData,
    loading,
    error,
  } = useDashboardData();

  useEffect(() => {}, [profile]);

  const { nudges: activeNudges, loading: nudgesLoading } = useActiveNudges(profile?.university_id);

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
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: C.sinbad,
        }}
      />
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: C.pampas,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
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
  const prevPositive = previousSession?.driverPositive ?? [];
  const prevNegative = previousSession?.driverNegative ?? [];
  const prevSummary = previousSession?.summary ?? '';
  const prevCheckinDate = previousSession?.createdAt ?? '';
  const firstName = profile.firstName || 'there';

  const hs = getHeroState(score);
  const getAdaptiveColor = (opacity: number) =>
    `${hs.backgroundColor}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  const cardTextColor = hs.textColor === '#ffffff' ? C.spectra : hs.textColor;

  const checkInActivity = recentActivity.filter((a) => a.type === 'checkin');

  const panelData = {
    score,
    scoreDelta,
    moodScore,
    moodHistory,
    checkinHistory,
    streak,
    driverPositive,
    driverNegative,
    summary,
    lastCheckinDate,
    prevPositive,
    prevNegative,
    prevSummary,
    prevCheckinDate,
    scoreHistory: checkinHistory,
  };

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
                <div
                  style={{
                    fontSize: '285px',
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: '-0.05em',
                    display: 'inline-block',
                    color: hs.textColor,
                    fontVariantNumeric: 'tabular-nums',
                    cursor: 'pointer',
                  }}
                >
                  {score}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                <h1
                  style={{
                    fontSize: '32px',
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.25,
                    color: hs.greetingColor || hs.textColor,
                    margin: 0,
                  }}
                >
                  {getGreeting()}, {firstName}
                </h1>
                <p
                  style={{
                    fontSize: '26px',
                    fontWeight: 300,
                    letterSpacing: '-0.025em',
                    lineHeight: 1.25,
                    fontStyle: 'italic',
                    color: hs.textColor,
                    margin: 0,
                  }}
                >
                  {hs.affirmation}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      ) : (
        <div
          style={{
            height: '400px',
            backgroundColor: C.sinbad,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '0 24px',
          }}
        >
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
              padding: '16px 32px',
              backgroundColor: C.spectra,
              color: C.white,
              border: 'none',
              borderRadius: '16px',
              fontSize: '18px',
              fontWeight: 500,
              cursor: 'pointer',
              width: 'fit-content',
            }}
          >
            Start Assessment
          </motion.button>
        </div>
      )}

      {/* ═══ DASHBOARD GRID ═══ */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          backgroundColor: C.white,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: '100px',
        }}
      >
        {/* Check-in + Help buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onCheckIn}
            style={{
              gridColumn: 'span 3',
              backgroundColor: C.spectra,
              color: C.white,
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
            }}
          >
            + Check in
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onNeedHelp}
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
            }}
          >
            Need Help?
          </motion.button>
        </div>

        {/* Mood + Streak cards */}
        {!isPostBaselineView && latestSession && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('mood')}
              style={{
                borderRadius: '16px',
                padding: '16px 16px 14px',
                height: '88px',
                backgroundColor: getAdaptiveColor(0.18),
                color: cardTextColor,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  opacity: 0.55,
                  fontWeight: 400,
                }}
              >
                Mood
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1 }}>
                  {moodScore}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.4 }}>/10</span>
              </div>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('streak')}
              style={{
                borderRadius: '16px',
                padding: '16px 16px 14px',
                height: '88px',
                backgroundColor: getAdaptiveColor(0.18),
                color: cardTextColor,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  opacity: 0.55,
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Flame size={11} style={{ opacity: 0.7 }} />
                Streak
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1 }}>
                  {streak}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 400, opacity: 0.4 }}> days</span>
              </div>
            </motion.div>
          </div>
        )}

        {/* Insight */}
        {!isPostBaselineView && latestSession && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setOpenPanel('insight')}
            style={{
              width: '100%',
              borderRadius: '16px',
              padding: '16px',
              textAlign: 'left',
              cursor: 'pointer',
              backgroundColor: getAdaptiveColor(0.18),
              color: cardTextColor,
              border: `1.5px solid ${getAdaptiveColor(0.35)}`,
            }}
          >
            <div
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.025em',
                opacity: 0.6,
                marginBottom: '8px',
                fontWeight: 300,
              }}
            >
              Insight
            </div>
            <div style={{ fontSize: '16px' }}>
              {summary
                ? summary.length > 60
                  ? summary.slice(0, 60) + '...'
                  : summary
                : "Your energy patterns show you're most..."}
            </div>
          </motion.button>
        )}

        {/* Enjoying + Worry */}
        {!isPostBaselineView && latestSession && (driverPositive.length > 0 || driverNegative.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('positive')}
              style={{
                borderRadius: '16px',
                padding: '16px',
                minHeight: '120px',
                backgroundColor: getAdaptiveColor(0.2),
                color: cardTextColor,
                cursor: 'pointer',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  opacity: 0.6,
                  marginBottom: '8px',
                  fontWeight: 300,
                }}
              >
                Enjoying
              </div>
              <div style={{ fontSize: '15px', lineHeight: 1.4 }}>
                {driverPositive.slice(0, 3).map((d) => (
                  <div
                    key={d}
                    style={{ marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenPanel('negative')}
              style={{
                borderRadius: '16px',
                padding: '16px',
                minHeight: '120px',
                backgroundColor: getAdaptiveColor(0.45),
                color: cardTextColor,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em',
                  opacity: 0.6,
                  marginBottom: '8px',
                  fontWeight: 300,
                }}
              >
                Worry
              </div>
              <div style={{ fontSize: '15px', lineHeight: 1.4 }}>
                {driverNegative.length > 0 ? (
                  driverNegative.slice(0, 3).map((d) => (
                    <div
                      key={d}
                      style={{
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {d}
                    </div>
                  ))
                ) : (
                  <div style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '14px' }}>(none discussed)</div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Previous Check-in — tappable, opens history panel */}
        {checkInActivity.length > 1 &&
          (() => {
            const prevScore = checkInActivity[1].score;
            const prevBg =
              prevScore >= 80 ? '#DDD6FE' : prevScore >= 60 ? C.sinbad : prevScore >= 40 ? C.buttercup : C.bittersweet;
            const prevText = prevScore < 40 ? '#ffffff' : '#1a2e2e';
            return (
              <motion.div
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpenPanel('history')}
                style={{
                  borderRadius: '16px',
                  padding: '16px 18px',
                  backgroundColor: prevBg,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={prevText}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.5 }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 300,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: prevText,
                      opacity: 0.5,
                      marginBottom: '2px',
                    }}
                  >
                    Previous Check-in
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: prevText }}>
                    {new Date(checkInActivity[1].createdAt).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: 900,
                      color: prevText,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                    }}
                  >
                    {prevScore}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 400, color: prevText, opacity: 0.6 }}>
                    {getScoreLabel(prevScore)}
                  </div>
                </div>
              </motion.div>
            );
          })()}

        {/* Nudges */}
        {!nudgesLoading && activeNudges.length > 0 && (
          <div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 300,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(45,76,76,0.4)',
                marginBottom: '10px',
                paddingLeft: '2px',
              }}
            >
              What's Happening
            </div>
            <NudgeCarousel nudges={activeNudges} />
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
