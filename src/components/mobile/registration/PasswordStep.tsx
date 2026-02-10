import type { UseRegistrationFlowReturn } from '@/hooks/useRegistrationFlow';
import mindMeasureLogo from '../../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';
import { containerStyle, cardStyle, buttonPrimaryStyle, inputStyle } from './styles';

interface PasswordStepProps {
  flow: UseRegistrationFlowReturn;
}

export function PasswordStep({ flow }: PasswordStepProps) {
  const {
    userData,
    updateUserData,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    error,
    passwordRequirements,
    allRequirementsMet,
    handlePasswordContinue,
    goToStep,
  } = flow;

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => goToStep('welcome')}
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
          Create a secure password
        </h1>
        <p style={{ fontSize: '16px', color: '#666666', margin: 0, lineHeight: 1.5 }}>
          Keep your wellness data safe and secure
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
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={userData.password}
              onChange={(e) => updateUserData('password', e.target.value)}
              placeholder="Create a secure password"
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
              onClick={() => setShowPassword(!showPassword)}
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
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
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
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
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
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
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
        <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>
            Password Requirements:
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'At least 8 characters', met: passwordRequirements.minLength },
              { label: 'One uppercase letter (A-Z)', met: passwordRequirements.hasUppercase },
              { label: 'One lowercase letter (a-z)', met: passwordRequirements.hasLowercase },
              { label: 'One number (0-9)', met: passwordRequirements.hasNumber },
              { label: 'Passwords match', met: passwordRequirements.passwordsMatch },
            ].map((req, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    border: `2px solid ${req.met ? '#10B981' : '#D1D5DB'}`,
                    background: req.met ? '#10B981' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {req.met && (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: req.met ? '#374151' : '#9CA3AF' }}>{req.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePasswordContinue}
        disabled={!allRequirementsMet || loading}
        style={{
          ...buttonPrimaryStyle,
          opacity: allRequirementsMet && !loading ? 1 : 0.5,
          cursor: allRequirementsMet && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Creating account\u2026' : 'Continue'}
      </button>
    </div>
  );
}
