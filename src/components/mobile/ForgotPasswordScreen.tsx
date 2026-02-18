import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Keyboard } from '@capacitor/keyboard';

interface ForgotPasswordScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onUnverifiedEmail?: (email: string) => void;
  prefilledEmail?: string;
}

const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '54px',
  paddingLeft: '16px',
  paddingRight: '16px',
  fontSize: '16px',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontWeight: 400,
  color: pampas,
  backgroundColor: 'rgba(153, 204, 206, 0.08)',
  border: '1.5px solid rgba(153, 204, 206, 0.2)',
  borderRadius: '12px',
  outline: 'none',
  boxSizing: 'border-box' as const,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: sinbad,
  opacity: 0.5,
  marginBottom: '8px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  fontFamily: 'Inter, system-ui, sans-serif',
};

export function ForgotPasswordScreen({
  onBack,
  onSuccess,
  onUnverifiedEmail,
  prefilledEmail = '',
}: ForgotPasswordScreenProps) {
  const { forgotPassword, confirmForgotPassword, loading } = useAuth();
  const [email, setEmail] = useState(prefilledEmail);
  const [error, setError] = useState<string | null>(null);
  const [_isCodeSent, setIsCodeSent] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [_isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (prefilledEmail.trim()) setEmail(prefilledEmail.trim());
  }, [prefilledEmail]);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardOpen(true));
    const hideListener = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardOpen(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setError(null);
    const result = await forgotPassword(email);
    if (result.needsVerification && result.email) {
      onUnverifiedEmail?.(result.email);
      return;
    }
    if (result.error) {
      setError(result.error);
    } else {
      setIsCodeSent(true);
      setStep('reset');
    }
  };

  const handleResetPassword = async () => {
    if (!confirmationCode.trim()) {
      setError('Please enter the confirmation code');
      return;
    }
    if (!newPassword.trim()) {
      setError('Please enter your new password');
      return;
    }
    const hasMinLength = newPassword.length >= 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      setError('Password must be at least 8 characters with uppercase, lowercase, and numbers');
      return;
    }
    setError(null);
    const { error: resetError } = await confirmForgotPassword(email, confirmationCode, newPassword);
    if (resetError) {
      setError(resetError);
    } else {
      onSuccess();
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: spectra,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 28px',
        fontFamily: 'Lato, system-ui, sans-serif',
      }}
    >
      <motion.div
        style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '430px', width: '100%' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: sinbad,
            opacity: 0.5,
            paddingTop: '56px',
            marginBottom: '48px',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {step === 'email' ? (
          <>
            {/* Title */}
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 300,
                color: pampas,
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Reset password
            </h1>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 300,
                color: sinbad,
                margin: '0 0 40px',
                lineHeight: 1.5,
                opacity: 0.7,
              }}
            >
              Enter your email and we'll send you a code to reset your password.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="reset-email" style={labelStyle}>
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: '14px',
                    color: buttercup,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    lineHeight: 1.5,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading || !email.trim()}
                style={{
                  width: '100%',
                  height: '54px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: loading || !email.trim() ? 'rgba(245, 158, 11, 0.3)' : buttercup,
                  color: spectra,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading || !email.trim() ? 'default' : 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'background-color 200ms ease',
                }}
              >
                {loading ? 'Sending...' : 'Send reset code'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Reset step */}
            <h1
              style={{
                fontSize: '36px',
                fontWeight: 300,
                color: pampas,
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              Check your email
            </h1>
            <p
              style={{
                fontSize: '16px',
                fontWeight: 300,
                color: sinbad,
                margin: '0 0 36px',
                lineHeight: 1.5,
                opacity: 0.7,
              }}
            >
              We've sent a code to <span style={{ color: pampas, fontWeight: 400 }}>{email}</span>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label htmlFor="reset-code" style={labelStyle}>
                  Reset code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  maxLength={6}
                  style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label htmlFor="new-password" style={labelStyle}>
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={inputStyle}
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: '14px',
                    color: buttercup,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    lineHeight: 1.5,
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {error}
                </motion.div>
              )}

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !confirmationCode.trim() || !newPassword.trim()}
                style={{
                  width: '100%',
                  height: '54px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor:
                    loading || !confirmationCode.trim() || !newPassword.trim() ? 'rgba(245, 158, 11, 0.3)' : buttercup,
                  color: spectra,
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: loading || !confirmationCode.trim() || !newPassword.trim() ? 'default' : 'pointer',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  transition: 'background-color 200ms ease',
                }}
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </div>
          </>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(153, 204, 206, 0.35); }
        input:focus { border-color: rgba(153, 204, 206, 0.5) !important; }
      `}</style>
    </div>
  );
}
