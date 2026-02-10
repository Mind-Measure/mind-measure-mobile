import type { UseRegistrationFlowReturn } from '@/hooks/useRegistrationFlow';
import mindMeasureLogo from '../../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';
import { containerStyle, cardStyle, buttonPrimaryStyle, inputStyle } from './styles';

interface WelcomeStepProps {
  flow: UseRegistrationFlowReturn;
}

export function WelcomeStep({ flow }: WelcomeStepProps) {
  const { userData, updateUserData, loading, error, handleWelcomeContinue, goToStep } = flow;

  const isValid =
    !!userData.firstName.trim() &&
    !!userData.lastName.trim() &&
    !!userData.email.trim() &&
    userData.email.includes('@');

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => goToStep('signin')}
        style={{
          background: 'none',
          border: 'none',
          color: '#8B5CF6',
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 0',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <img
          src={mindMeasureLogo}
          alt="Mind Measure"
          style={{ width: '100px', height: '100px', margin: '0 auto 24px' }}
        />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0', lineHeight: 1.2 }}>
          Welcome to Mind Measure
        </h1>
        <p style={{ fontSize: '16px', color: '#666666', margin: 0, lineHeight: 1.5 }}>
          Your personal wellbeing companion
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#FEE2E2', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#B91C1C' }}>{error}</p>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            First Name
          </label>
          <input
            type="text"
            value={userData.firstName}
            onChange={(e) => updateUserData('firstName', e.target.value)}
            placeholder="e.g., Sarah"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#8B5CF6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            Last Name
          </label>
          <input
            type="text"
            value={userData.lastName}
            onChange={(e) => updateUserData('lastName', e.target.value)}
            placeholder="e.g., Johnson"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#8B5CF6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            Your University Email
          </label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => updateUserData('email', e.target.value)}
            placeholder="e.g., sarah.j@student.ac.uk"
            style={inputStyle}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#8B5CF6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleWelcomeContinue}
        disabled={!isValid || loading}
        style={{
          ...buttonPrimaryStyle,
          opacity: isValid && !loading ? 1 : 0.5,
          cursor: isValid && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Checking\u2026' : 'Continue'}
      </button>
    </div>
  );
}
