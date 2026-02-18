import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { MoodTrendChart } from '../MoodTrendChart';
import { KeyThemes, type ThemeData } from '../KeyThemes';
import type { UserData } from './types';

interface OverviewTabProps {
  userData: UserData;
  moodData: Array<{ date: string; score: number }>;
  themesData: ThemeData[];
}

export function OverviewTab({ userData, moodData, themesData }: OverviewTabProps) {
  const [profileExpanded, setProfileExpanded] = useState(false);

  const profileFields = [
    { label: 'Faculty / School', value: userData.school, filled: !!userData.school },
    { label: 'Year of Study', value: userData.yearOfStudy, filled: !!userData.yearOfStudy },
    { label: 'Study Mode', value: userData.studyMode, filled: !!userData.studyMode },
    { label: 'Residence', value: userData.livingArrangement, filled: !!userData.livingArrangement },
    { label: 'Hall of Residence', value: userData.accommodationName, filled: !!userData.accommodationName },
    { label: 'Domicile', value: userData.domicileStatus, filled: !!userData.domicileStatus },
    { label: 'Age Range', value: userData.ageRange, filled: !!userData.ageRange },
  ];

  const filledCount = profileFields.filter(f => f.filled).length;
  const totalCount = profileFields.length;
  const completionPct = Math.round((filledCount / totalCount) * 100);
  const isComplete = filledCount === totalCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Stats Row — 3-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        {[
          { label: 'Check-ins', value: userData.totalCheckIns ?? 0 },
          { label: 'Avg Score', value: userData.averageScore ?? '-' },
          { label: 'Best Streak', value: userData.currentStreak ?? 0 },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              backgroundColor: '#ffffff', borderRadius: '14px',
              padding: '14px 12px', textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#2D4C4C', letterSpacing: '-0.03em', fontFamily: 'Inter, system-ui, sans-serif' }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(45,76,76,0.4)', marginTop: '2px' }}>
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mood Trend */}
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: '#ffffff', borderRadius: '16px',
          padding: '18px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(45,76,76,0.4)', marginBottom: '12px' }}>
          Mood Trend
        </div>
        <MoodTrendChart data={moodData} />
      </motion.div>

      {/* Profile Completion — expandable */}
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{
          backgroundColor: '#ffffff', borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
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
                {profileFields.map((field) => (
                  <div
                    key={field.label}
                    style={{
                      padding: '14px 20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
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

      {/* Key Themes */}
      <KeyThemes
        themes={themesData.length > 0 ? themesData : undefined}
        title="Your Key Themes"
        subtitle={themesData.length > 0 ? `From ${userData.totalCheckIns} check-ins` : 'Top themes'}
        height="240px"
      />
    </div>
  );
}
