import { MoodTrendChart } from '../MoodTrendChart';
import { KeyThemes, type ThemeData } from '../KeyThemes';
import type { UserData } from './types';

interface OverviewTabProps {
  userData: UserData;
  moodData: Array<{ date: string; score: number }>;
  themesData: ThemeData[];
}

export function OverviewTab({ userData, moodData, themesData }: OverviewTabProps) {
  return (
    <div>
      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              fontSize: '40px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '4px',
              lineHeight: '1',
            }}
          >
            {userData.currentStreak}
          </div>
          <div style={{ fontSize: '13px', color: '#666666' }}>Day Streak</div>
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              fontSize: '40px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '4px',
              lineHeight: '1',
            }}
          >
            {userData.averageScore ?? '-'}
          </div>
          <div style={{ fontSize: '13px', color: '#666666' }}>Avg Score</div>
        </div>
      </div>

      {/* Mood Trend Card */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Mood Trend</span>
        </div>
        <MoodTrendChart data={moodData} />
      </div>

      {/* Key Themes Card */}
      <KeyThemes
        themes={themesData.length > 0 ? themesData : undefined}
        title="Your Key Themes"
        subtitle={themesData.length > 0 ? `From ${userData.totalCheckIns} check-ins` : 'Top themes'}
        height="240px"
      />
    </div>
  );
}
