import type { UseRegistrationFlowReturn } from '@/hooks/useRegistrationFlow';
import mindMeasureLogo from '../../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';
import { containerStyle, cardStyle, buttonPrimaryStyle } from './styles';

interface VerifyStepProps {
  flow: UseRegistrationFlowReturn;
}

export function VerifyStep({ flow }: VerifyStepProps) {
  const {
    userData,
    verificationCode,
    isResending,
    resendMessage,
    setResendMessage,
    loading,
    error,
    setError,
    isVerificationCodeComplete,
    handleVerifySubmit,
    handleResendCode,
    handleVerificationCodeChange,
    handleVerificationKeyDown,
    goToStep,
  } = flow;

  return (
    <div style={containerStyle}>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setResendMessage('');
          goToStep('password');
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
          Check your email
        </h1>
        <p style={{ fontSize: '14px', color: '#666666', margin: 0, lineHeight: 1.5 }}>
          {"We've sent a 6-digit verification code to "}
          <strong style={{ color: '#1a1a1a' }}>{userData.email}</strong>
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#FEE2E2', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#B91C1C' }}>{error}</p>
        </div>
      )}
      {resendMessage && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#D1FAE5', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#065F46' }}>{resendMessage}</p>
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
          Verification Code
        </label>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
          {verificationCode.map((digit, i) => (
            <input
              key={i}
              id={`code-input-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleVerificationCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleVerificationKeyDown(i, e)}
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
          Enter the 6-digit code from your email
        </p>
      </div>

      <button
        type="button"
        onClick={handleVerifySubmit}
        disabled={!isVerificationCodeComplete || loading}
        style={{
          ...buttonPrimaryStyle,
          opacity: isVerificationCodeComplete && !loading ? 1 : 0.5,
          cursor: isVerificationCodeComplete && !loading ? 'pointer' : 'not-allowed',
          marginBottom: '16px',
        }}
      >
        {loading ? 'Verifying\u2026' : 'Verify Email'}
      </button>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 8px 0' }}>{"Didn't receive the code?"}</p>
        <button
          type="button"
          onClick={handleResendCode}
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
          {isResending ? 'Sending\u2026' : 'Resend Code'}
        </button>
      </div>

      <div
        style={{
          background: '#FAF9F7',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#99CCCE"
          strokeWidth="2"
          style={{ flexShrink: 0, marginTop: 2 }}
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <p style={{ fontSize: '13px', color: '#2D4C4C', margin: 0, lineHeight: 1.5 }}>
          <strong>Note:</strong> The verification email may take a few minutes to arrive. Check your spam folder if you
          don't see it.
        </p>
      </div>
    </div>
  );
}
