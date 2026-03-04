import type { UserData } from './types';

interface WellnessTabProps {
  userData: UserData;
}

export function WellnessTab({ userData }: WellnessTabProps) {
  return (
    <div>
      {/* Wellness Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
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
          <div style={{ fontSize: '13px', color: '#666666' }}>Current Streak</div>
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
            {userData.longestStreak}
          </div>
          <div style={{ fontSize: '13px', color: '#666666' }}>Longest Streak</div>
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
            {userData.totalCheckIns}
          </div>
          <div style={{ fontSize: '13px', color: '#666666' }}>Total Check-ins</div>
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
          <div style={{ fontSize: '13px', color: '#666666' }}>Average Score</div>
        </div>
      </div>
    </div>
  );
}
