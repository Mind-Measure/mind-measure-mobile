import type { UseRegistrationFlowReturn } from '@/hooks/useRegistrationFlow';
import mindMeasureLogo from '../../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';
import { containerStyle, cardStyle, buttonPrimaryStyle, inputStyle } from './styles';

interface SignInStepProps {
  flow: UseRegistrationFlowReturn;
  onBack?: () => void;
}

export function SignInStep({ flow, onBack }: SignInStepProps) {
  const {
    signInEmail,
    setSignInEmail,
    signInPassword,
    setSignInPassword,
    showSignInPassword,
    setShowSignInPassword,
    loading,
    error,
    setError,
    handleSignIn,
    goToForgotPassword,
    goToStep,
  } = flow;

  const isValid = !!signInEmail.trim() && !!signInPassword;

  return (
    <div style={containerStyle}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#8B5CF6',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
      )}
      <div style={{ textAlign: 'center', marginBottom: '32px', paddingTop: onBack ? 0 : '40px' }}>
        <img
          src={mindMeasureLogo}
          alt="Mind Measure"
          style={{ width: '100px', height: '100px', margin: '0 auto 24px' }}
        />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 12px 0', lineHeight: 1.2 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '16px', color: '#666666', margin: 0, lineHeight: 1.5 }}>
          Sign in to continue your wellbeing journey
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
            Email
          </label>
          <input
            type="email"
            value={signInEmail}
            onChange={(e) => {
              setSignInEmail(e.target.value);
              setError(null);
            }}
            placeholder="Your university email"
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
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showSignInPassword ? 'text' : 'password'}
              value={signInPassword}
              onChange={(e) => {
                setSignInPassword(e.target.value);
                setError(null);
              }}
              placeholder="Your password"
              style={{ ...inputStyle, paddingRight: '48px' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8B5CF6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            />
            <button
              type="button"
              onClick={() => setShowSignInPassword(!showSignInPassword)}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
              }}
              aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
            >
              {showSignInPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSignIn}
        disabled={!isValid || loading}
        style={{
          ...buttonPrimaryStyle,
          opacity: isValid && !loading ? 1 : 0.5,
          cursor: isValid && !loading ? 'pointer' : 'not-allowed',
          marginBottom: '16px',
        }}
      >
        {loading ? 'Signing in\u2026' : 'Sign In'}
      </button>

      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={goToForgotPassword}
          style={{
            background: 'none',
            border: 'none',
            color: '#8B5CF6',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          Lost password?
        </button>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 12px 0' }}>{"Don't have an account?"}</p>
        <button
          type="button"
          onClick={() => goToStep('welcome')}
          style={{
            background: 'none',
            border: '2px solid #8B5CF6',
            color: '#8B5CF6',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '12px 32px',
            borderRadius: '12px',
            transition: 'all 0.2s',
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
