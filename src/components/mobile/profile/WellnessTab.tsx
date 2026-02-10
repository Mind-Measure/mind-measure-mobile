import { Download } from 'lucide-react';
import type { UserData } from './types';

interface WellnessTabProps {
  userData: UserData;
  onExportData: () => void;
}

export function WellnessTab({ userData, onExportData }: WellnessTabProps) {
  return (
    <div>
      {/* Wellness Stats */}
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

      {/* Data Ownership Card */}
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0,
            marginBottom: '16px',
          }}
        >
          This is YOUR Data
        </h3>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '14px',
            color: '#666666',
            lineHeight: '1.6',
          }}
        >
          Every conversation, score, and insight belongs to you. Use this data for personal reflection and growth, share
          with therapists or counsellors when helpful, and export to keep for your personal records.
        </p>
        <button
          onClick={onExportData}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '14px 24px',
            background: 'linear-gradient(135deg, #5B8FED, #6BA3FF)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          <Download size={18} />
          Export My Data
        </button>
      </div>
    </div>
  );
}
