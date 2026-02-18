import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { Preferences } from '@capacitor/preferences';
import {
  getUniversitiesForPicker,
  resolveUniversityByAuthorisedEmail,
  resolveUniversityByAllowedEmailDomain,
  setProfileUniversity,
} from '@/features/cms/data';
import { Keyboard } from '@capacitor/keyboard';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, ChevronRight } from 'lucide-react';

interface SignInScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onError: () => void;
  onForgotPassword: () => void;
  onCreateAccount?: () => void;
  prefilledEmail?: string;
  onUnverifiedEmail?: (email: string) => void;
}

interface FormData {
  email: string;
  password: string;
}

// Palette
const spectra = '#2D4C4C';
const pampas = '#FAF9F7';
const sinbad = '#99CCCE';
const buttercup = '#F59E0B';

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '54px',
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

export function SignInScreen({
  onBack,
  onSuccess,
  onError,
  onForgotPassword,
  onCreateAccount,
  prefilledEmail,
  onUnverifiedEmail,
}: SignInScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: prefilledEmail || '',
    password: '',
  });
  const [mmUniversityPicker, setMmUniversityPicker] = useState<{ userId: string } | null>(null);
  const [universitiesForPicker, setUniversitiesForPicker] = useState<{ id: string; name: string; slug: string }[]>([]);

  const { signIn } = useAuth();

  useEffect(() => {
    if (prefilledEmail) {
      setFormData((prev) => ({ ...prev, email: prefilledEmail }));
    }
  }, [prefilledEmail]);

  useEffect(() => {
    if (mmUniversityPicker) {
      getUniversitiesForPicker().then(setUniversitiesForPicker);
    } else {
      setUniversitiesForPicker([]);
    }
  }, [mmUniversityPicker]);

  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardOpen(true));
    const hideListener = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardOpen(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    const originalContent = viewport?.getAttribute('content') || '';

    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    const style = document.createElement('style');
    style.textContent = `
      input, textarea, select {
        font-size: 16px !important;
        transform: translateZ(0);
      }
      * {
        -webkit-text-size-adjust: 100%;
        -moz-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        text-size-adjust: 100%;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (viewport && originalContent) {
        viewport.setAttribute('content', originalContent);
      } else if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
      }
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
      window.setTimeout(() => {
        if (window.visualViewport) {
          window.scrollTo(0, 0);
        }
      }, 100);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);

      if (result.needsVerification && result.email) {
        onUnverifiedEmail?.(result.email);
        return;
      }

      if (result.error) {
        console.error('Sign-in error:', result.error);
        try {
          await Preferences.set({ key: 'mindmeasure_device_used', value: 'true' });
        } catch (deviceError) {
          console.error('Error tracking device:', deviceError);
        }
        setError(result.error);
        onError();
        return;
      }

      let resolved: { universityId: string; slug: string } | null = null;
      if (result.user?.id) {
        try {
          resolved = await resolveUniversityByAuthorisedEmail(formData.email);
          if (!resolved) resolved = await resolveUniversityByAllowedEmailDomain(formData.email);
          if (resolved) {
            await setProfileUniversity(result.user.id, resolved.universityId);
          }
        } catch (scopeErr) {
          console.warn('Could not scope user to university:', scopeErr);
        }
      }

      if (result.user?.id && formData.email.endsWith('@mindmeasure.co.uk')) {
        setMmUniversityPicker({ userId: result.user.id });
        return;
      }

      onSuccess();
    } catch (err) {
      console.error('Unexpected sign-in error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── University picker for MM staff ──────────────────────
  if (mmUniversityPicker) {
    const handleSelectUniversity = async (universityId: string) => {
      try {
        await setProfileUniversity(mmUniversityPicker!.userId, universityId);
        setMmUniversityPicker(null);
        onSuccess();
      } catch (e) {
        console.warn('Could not set university:', e);
      }
    };
    const handleSkip = () => {
      setMmUniversityPicker(null);
      onSuccess();
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
        <div style={{ paddingTop: '68px', paddingBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 300, color: pampas, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Select university
          </h2>
          <p style={{ fontSize: '15px', fontWeight: 300, color: sinbad, margin: 0, opacity: 0.7 }}>
            Choose which university to view as in the app
          </p>
        </div>
        {universitiesForPicker.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                border: `2px solid rgba(153,204,206,0.3)`,
                borderTopColor: sinbad,
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {universitiesForPicker.map((uni) => (
              <button
                key={uni.id}
                type="button"
                onClick={() => handleSelectUniversity(uni.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(153, 204, 206, 0.08)',
                  border: '1.5px solid rgba(153, 204, 206, 0.15)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                <span style={{ fontSize: '15px', fontWeight: 500, color: pampas }}>{uni.name}</span>
                <ChevronRight size={18} style={{ color: sinbad, opacity: 0.4 }} />
              </button>
            ))}
          </div>
        )}
        <div style={{ paddingTop: '16px', paddingBottom: '40px' }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              width: '100%',
              padding: '14px',
              background: 'none',
              border: `1.5px solid rgba(153, 204, 206, 0.2)`,
              borderRadius: '12px',
              color: sinbad,
              fontSize: '14px',
              fontWeight: 400,
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              opacity: 0.6,
            }}
          >
            Skip — use app without selecting a university
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Main sign-in screen ──────────────────────
  const canSubmit = formData.email && formData.password && !isLoading;

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

        {/* Title */}
        <h1
          style={{
            fontSize: '36px',
            fontWeight: 300,
            color: pampas,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Welcome back
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
          Sign in to continue
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: sinbad,
                opacity: 0.5,
                marginBottom: '8px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: sinbad,
                  opacity: 0.4,
                }}
              />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@university.ac.uk"
                required
                disabled={isLoading}
                style={{ ...inputStyle, paddingLeft: '48px' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 500,
                color: sinbad,
                opacity: 0.5,
                marginBottom: '8px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase' as const,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: sinbad,
                  opacity: 0.4,
                }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                required
                disabled={isLoading}
                style={{ ...inputStyle, paddingLeft: '48px', paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: sinbad,
                  opacity: 0.4,
                  padding: '4px',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
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

          {/* Forgot password */}
          <button
            type="button"
            onClick={onForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: sinbad,
              opacity: 0.5,
              fontSize: '14px',
              fontWeight: 400,
              fontFamily: 'Inter, system-ui, sans-serif',
              textAlign: 'left',
              padding: 0,
            }}
          >
            Forgot your password?
          </button>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              height: '54px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: canSubmit ? buttercup : 'rgba(245, 158, 11, 0.3)',
              color: spectra,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '0.01em',
              transition: 'background-color 200ms ease',
              marginTop: '4px',
            }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(45, 76, 76, 0.3)',
                    borderTopColor: spectra,
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }}
                />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Create account link */}
          {onCreateAccount && (
            <button
              type="button"
              onClick={onCreateAccount}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: sinbad,
                opacity: 0.5,
                fontSize: '14px',
                fontWeight: 400,
                fontFamily: 'Inter, system-ui, sans-serif',
                textAlign: 'left',
                padding: 0,
              }}
            >
              Don't have an account? Create one
            </button>
          )}
        </form>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(153, 204, 206, 0.35); }
        input:focus { border-color: rgba(153, 204, 206, 0.5) !important; }
      `}</style>
    </div>
  );
}
