import type { UseRegistrationFlowReturn } from '@/hooks/useRegistrationFlow';
import mindMeasureLogo from '../../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';
import { containerStyle, cardStyle, buttonPrimaryStyle, inputStyle } from './styles';
import type { RegistrationStep } from './types';

interface ForgotPasswordStepProps {
  flow: UseRegistrationFlowReturn;
  /** Which of the three forgot-password sub-steps to render. */
  step: Extract<RegistrationStep, 'forgot-password' | 'reset-verify' | 'reset-new-password'>;
}

export function ForgotPasswordStep({ flow, step }: ForgotPasswordStepProps) {
  if (step === 'forgot-password') return <EmailEntry flow={flow} />;
  if (step === 'reset-verify') return <ResetVerify flow={flow} />;
  return <ResetNewPassword flow={flow} />;
}

/* ── Email entry ──────────────────────────────────────────────────────── */

function EmailEntry({ flow }: { flow: UseRegistrationFlowReturn }) {
  const { resetEmail, setResetEmail, resetLoading, error, setError, handleSendResetCode, goToStep } = flow;

  const normalized = resetEmail.trim().toLowerCase().replace(/\s/g, '');
  const isValid = !!normalized && normalized.includes('@');

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => goToStep('signin')}
        style={{
          background: 'none',
          border: 'none',
          color: '#2D4C4C',
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
          style={{ width: '80px', height: '80px', margin: '0 auto 24px' }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px 0', lineHeight: 1.2 }}>
          Forgot Password?
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: '#666666',
            margin: 0,
            lineHeight: 1.5,
            maxWidth: '320px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {"Enter your email address and we'll send you a 6-digit code by email to reset your password."}
        </p>
      </div>
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#FEE2E2', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#B91C1C' }}>{error}</p>
        </div>
      )}
      <div style={cardStyle}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
          Email
        </label>
        <input
          type="email"
          value={resetEmail}
          onChange={(e) => {
            setResetEmail(e.target.value);
            setError(null);
          }}
          placeholder="Your university email"
          style={inputStyle}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#2D4C4C';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E5E7EB';
          }}
        />
      </div>
      <button
        type="button"
        onClick={handleSendResetCode}
        disabled={!isValid || resetLoading}
        style={{
          ...buttonPrimaryStyle,
          opacity: isValid && !resetLoading ? 1 : 0.5,
          cursor: isValid && !resetLoading ? 'pointer' : 'not-allowed',
        }}
      >
        {resetLoading ? 'Sending\u2026' : 'Send Reset Code'}
      </button>
    </div>
  );
}

/* ── Reset code verification ──────────────────────────────────────────── */

function ResetVerify({ flow }: { flow: UseRegistrationFlowReturn }) {
  const {
    resetEmail,
    resetCode,
    resetCodeDelivery,
    isResending,
    resetResendMessage,
    error,
    setError,
    isResetCodeComplete,
    handleResetCodeChange,
    handleResetCodeKeyDown,
    handleResetVerifyContinue,
    handleResetResendCode,
    goToStep,
  } = flow;

  const medium = resetCodeDelivery?.DeliveryMedium?.toUpperCase();
  const dest = resetCodeDelivery?.Destination;
  const byEmail = medium !== 'SMS';
  const channel = byEmail ? 'email' : 'SMS';
  const to = dest || resetEmail;

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => {
          setError(null);
          goToStep('forgot-password');
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#2D4C4C',
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
          style={{ width: '80px', height: '80px', margin: '0 auto 24px' }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px 0', lineHeight: 1.2 }}>
          Enter reset code
        </h1>
        <p style={{ fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.5 }}>
          {"We've sent a 6-digit code by "}
          {channel}
          {' to '}
          <strong style={{ color: '#1a1a1a' }}>{to}</strong>
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#FEE2E2', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#B91C1C' }}>{error}</p>
        </div>
      )}
      {resetResendMessage && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#D1FAE5', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#065F46' }}>{resetResendMessage}</p>
        </div>
      )}

      <div style={cardStyle}>
        <label
          style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1a1a1a',
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          Reset Code
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
          {resetCode.map((digit, i) => (
            <input
              key={i}
              id={`reset-code-input-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleResetCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleResetCodeKeyDown(i, e)}
              style={{
                width: '48px',
                height: '56px',
                fontSize: '24px',
                fontWeight: 600,
                textAlign: 'center',
                border: '2px solid #E5E7EB',
                borderRadius: '12px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2D4C4C';
                e.currentTarget.select();
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            />
          ))}
        </div>
        <p style={{ fontSize: '13px', color: '#999999', margin: 0, textAlign: 'center' }}>
          {medium === 'SMS' ? 'Enter the 6-digit code from your phone' : 'Enter the 6-digit code from your email'}
        </p>
      </div>

      <button
        type="button"
        onClick={handleResetVerifyContinue}
        disabled={!isResetCodeComplete}
        style={{
          ...buttonPrimaryStyle,
          opacity: isResetCodeComplete ? 1 : 0.5,
          cursor: isResetCodeComplete ? 'pointer' : 'not-allowed',
          marginBottom: '16px',
        }}
      >
        Verify Code
      </button>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 8px 0' }}>{"Didn't receive the code?"}</p>
        <button
          type="button"
          onClick={handleResetResendCode}
          disabled={isResending}
          style={{
            background: 'none',
            border: 'none',
            color: '#2D4C4C',
            fontSize: '15px',
            fontWeight: 600,
            cursor: isResending ? 'not-allowed' : 'pointer',
            padding: '8px 16px',
            opacity: isResending ? 0.5 : 1,
          }}
        >
          {isResending ? 'Sending\u2026' : medium === 'SMS' ? 'Resend code by SMS' : 'Resend code by email'}
        </button>
      </div>

      <div style={{ background: '#FAF9F7', borderRadius: '12px', padding: '16px' }}>
        <p style={{ fontSize: '13px', color: '#2D4C4C', margin: 0, lineHeight: 1.5 }}>
          {medium === 'SMS' ? (
            <>
              <strong>Note:</strong> The code may take a minute to arrive. Check your messages.
            </>
          ) : (
            <>
              <strong>Note:</strong> The reset email may take a few minutes. Check your spam and promotions folders if
              you don&apos;t see it.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/* ── New password entry ───────────────────────────────────────────────── */

function ResetNewPassword({ flow }: { flow: UseRegistrationFlowReturn }) {
  const {
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,
    resetLoading,
    error,
    setError,
    resetPasswordRequirements,
    resetPasswordRequirementsMet,
    handleResetPasswordSubmit,
    goToStep,
  } = flow;

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => {
          setError(null);
          goToStep('reset-verify');
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#2D4C4C',
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
          style={{ width: '80px', height: '80px', margin: '0 auto 24px' }}
        />
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 8px 0', lineHeight: 1.2 }}>
          Create new password
        </h1>
        <p style={{ fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.5 }}>
          Choose a strong password for your account
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
            New Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError(null);
              }}
              placeholder="Create a strong password"
              style={{ ...inputStyle, paddingRight: '48px' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2D4C4C';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
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
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? (
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
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '8px' }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmNewPassword ? 'text' : 'password'}
              value={confirmNewPassword}
              onChange={(e) => {
                setConfirmNewPassword(e.target.value);
                setError(null);
              }}
              placeholder="Re-enter your password"
              style={{ ...inputStyle, paddingRight: '48px' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#2D4C4C';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
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
              aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmNewPassword ? (
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
      <div style={{ ...cardStyle, marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', margin: '0 0 12px 0' }}>
          Your password must contain:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { met: resetPasswordRequirements.minLength, text: 'At least 8 characters' },
            { met: resetPasswordRequirements.hasUppercase, text: 'One uppercase letter' },
            { met: resetPasswordRequirements.hasLowercase, text: 'One lowercase letter' },
            { met: resetPasswordRequirements.hasNumber, text: 'One number' },
            { met: resetPasswordRequirements.passwordsMatch, text: 'Passwords match' },
          ].map((req, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: req.met ? '#2D4C4C' : '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {req.met && (
                  <svg
                    width="12"
                    height="12"
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
              <span style={{ fontSize: '13px', color: req.met ? '#1a1a1a' : '#999999' }}>{req.text}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={handleResetPasswordSubmit}
        disabled={!resetPasswordRequirementsMet || resetLoading}
        style={{
          ...buttonPrimaryStyle,
          opacity: resetPasswordRequirementsMet && !resetLoading ? 1 : 0.5,
          cursor: resetPasswordRequirementsMet && !resetLoading ? 'pointer' : 'not-allowed',
        }}
      >
        {resetLoading ? 'Resetting\u2026' : 'Reset Password'}
      </button>
    </div>
  );
}
