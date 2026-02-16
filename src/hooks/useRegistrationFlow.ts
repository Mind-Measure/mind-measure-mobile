import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { RegistrationStep, UserRegistrationData } from '@/components/mobile/registration/types';

function getCheckEmailUrl(): string {
  const base = (
    import.meta.env.VITE_API_BASE_URL ?? (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api')
  ).replace(/\/database\/?$/, '');
  return `${base}/auth/check-email`;
}

export interface UseRegistrationFlowOptions {
  prefilledEmail?: string;
  onSignInSuccess?: (userId?: string) => void;
  onRegistrationComplete?: () => void;
}

export function useRegistrationFlow({
  prefilledEmail = '',
  onSignInSuccess,
  onRegistrationComplete,
}: UseRegistrationFlowOptions) {
  // ── Step state ──────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('signin');

  // ── Registration state ──────────────────────────────────────────────
  const [userData, setUserData] = useState<UserRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // ── Sign-in state ───────────────────────────────────────────────────
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // ── Shared loading / error ──────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Reset-password state ────────────────────────────────────────────
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResendMessage, setResetResendMessage] = useState('');
  const [resetCodeDelivery, setResetCodeDelivery] = useState<{
    DeliveryMedium?: string;
    Destination?: string;
  } | null>(null);

  // ── Auth context ────────────────────────────────────────────────────
  const { signIn, signUp, confirmEmail, resendConfirmation, forgotPassword, confirmForgotPassword } = useAuth();

  // ── Effects ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefilledEmail.trim()) {
      setSignInEmail(prefilledEmail.trim());
    }
  }, [prefilledEmail]);

  // ── Derived values ──────────────────────────────────────────────────
  const updateUserData = (field: keyof UserRegistrationData, value: string) => {
    setUserData((prev) => ({ ...prev, [field]: value }));
  };

  const passwordRequirements = {
    minLength: userData.password.length >= 8,
    hasUppercase: /[A-Z]/.test(userData.password),
    hasLowercase: /[a-z]/.test(userData.password),
    hasNumber: /[0-9]/.test(userData.password),
    passwordsMatch: userData.password === confirmPassword && confirmPassword !== '',
  };

  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);

  const isVerificationCodeComplete = verificationCode.every((d) => d !== '');

  const isResetCodeComplete = resetCode.every((d) => d !== '');

  const resetPasswordRequirements = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    passwordsMatch: newPassword === confirmNewPassword && confirmNewPassword !== '',
  };

  const resetPasswordRequirementsMet = Object.values(resetPasswordRequirements).every(Boolean);

  const normalizeEmail = (raw: string) => raw.trim().toLowerCase().replace(/\s/g, '');

  // ── Handlers ────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!signIn || !signInEmail.trim() || !signInPassword) return;
    setError(null);
    setLoading(true);
    try {
      const result = await signIn(signInEmail.trim(), signInPassword);
      if (result.error) {
        setError(result.error);
        return;
      }
      if ((result as { needsVerification?: boolean }).needsVerification) {
        setUserData((prev) => ({ ...prev, email: signInEmail.trim() }));
        setVerificationCode(['', '', '', '', '', '']);
        setCurrentStep('verify');
        setError("Please verify your email first. We've sent you a code.");
        return;
      }
      const userId = (result as { user?: { id?: string } }).user?.id;
      onSignInSuccess?.(userId);
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeContinue = async () => {
    const email = userData.email.trim().toLowerCase();
    if (!userData.firstName.trim() || !userData.lastName.trim() || !email || !email.includes('@')) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(getCheckEmailUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      const exists = res.ok && data.exists === true;
      if (exists) {
        setSignInEmail(email);
        setSignInPassword('');
        setCurrentStep('signin');
        setError('We have an account for this email. Please sign in.');
      } else {
        setError(null);
        setCurrentStep('password');
      }
    } catch {
      setError("We couldn't check that email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordContinue = async () => {
    if (!allRequirementsMet || !signUp) return;
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signUp({
        firstName: userData.firstName.trim(),
        lastName: userData.lastName.trim(),
        email: userData.email.trim(),
        password: userData.password,
      });
      if (err) {
        const msg = (err && String(err)).toLowerCase();
        const isAlreadyExists = msg.includes('already exists') || msg.includes('usernamesexistsexception');
        if (isAlreadyExists) {
          setSignInEmail(userData.email.trim());
          setSignInPassword('');
          setCurrentStep('signin');
          setError('We have an account for this email. Please sign in.');
          return;
        }
        setError(err);
        return;
      }
      setVerificationCode(['', '', '', '', '', '']);
      setCurrentStep('verify');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async () => {
    const code = verificationCode.join('');
    if (code.length !== 6 || !confirmEmail) return;
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await confirmEmail(userData.email.trim(), code);
      if (err) {
        setError(err);
        return;
      }

      // Auto-sign-in after successful email verification so API tokens are available
      if (signIn && userData.email && userData.password) {
        const signInResult = await signIn(userData.email.trim(), userData.password);
        if (signInResult.error) {
          console.warn('[Registration] Auto sign-in after verification failed:', signInResult.error);
        }
      }

      onRegistrationComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!resendConfirmation || isResending) return;
    setIsResending(true);
    setResendMessage('');
    setError(null);
    try {
      const { error: err } = await resendConfirmation(userData.email.trim());
      if (err) {
        setError(err);
      } else {
        setResendMessage('New code sent! Check your email.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    if (value && index < 5) {
      const next = document.getElementById(`code-input-${index + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };

  const handleVerificationKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prev = document.getElementById(`code-input-${index - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  };

  const handleResetCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;
    const next = [...resetCode];
    next[index] = value;
    setResetCode(next);
    if (value && index < 5) {
      const el = document.getElementById(`reset-code-input-${index + 1}`);
      if (el) (el as HTMLInputElement).focus();
    }
  };

  const handleResetCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !resetCode[index] && index > 0) {
      const prev = document.getElementById(`reset-code-input-${index - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  };

  const handleSendResetCode = async () => {
    const email = normalizeEmail(resetEmail);
    if (!email || !email.includes('@') || !forgotPassword) return;
    setError(null);
    setResetCodeDelivery(null);
    setResetLoading(true);
    try {
      const { error: err, codeDeliveryDetails } = await forgotPassword(email);
      if (err) {
        const msg =
          err === 'UNVERIFIED_EMAIL_RESET'
            ? 'This account has no verified email. Please sign in or use an account that has verified its email.'
            : err;
        setError(msg);
        return;
      }
      setResetEmail(email);
      setResetCode(['', '', '', '', '', '']);
      setResetCodeDelivery(codeDeliveryDetails ?? null);
      setCurrentStep('reset-verify');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetResendCode = async () => {
    const email = normalizeEmail(resetEmail);
    if (!email || !forgotPassword || isResending) return;
    setIsResending(true);
    setResetResendMessage('');
    setError(null);
    try {
      const { error: err, codeDeliveryDetails } = await forgotPassword(email);
      if (err) {
        setError(err);
        return;
      }
      setResetCodeDelivery(codeDeliveryDetails ?? null);
      const medium = codeDeliveryDetails?.DeliveryMedium?.toLowerCase();
      const where = medium === 'sms' ? 'phone' : 'email';
      setResetResendMessage(`New code sent by ${where}! Check your ${medium === 'sms' ? 'messages' : 'inbox'}.`);
    } finally {
      setIsResending(false);
    }
  };

  const handleResetVerifyContinue = () => {
    if (!isResetCodeComplete) return;
    setError(null);
    setCurrentStep('reset-new-password');
  };

  const handleResetPasswordSubmit = async () => {
    if (!resetPasswordRequirementsMet || !confirmForgotPassword) return;
    const email = normalizeEmail(resetEmail);
    const code = resetCode.join('');
    setError(null);
    setResetLoading(true);
    try {
      const { error: err } = await confirmForgotPassword(email, code, newPassword);
      if (err) {
        setError(err);
        return;
      }
      setResetEmail('');
      setResetCode(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmNewPassword('');
      setResetCodeDelivery(null);
      setCurrentStep('signin');
    } finally {
      setResetLoading(false);
    }
  };

  const goToForgotPassword = () => {
    setError(null);
    setResetEmail(signInEmail.trim() || '');
    setResetCode(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmNewPassword('');
    setResetResendMessage('');
    setResetCodeDelivery(null);
    setCurrentStep('forgot-password');
  };

  const goToStep = (step: RegistrationStep) => {
    setError(null);
    setCurrentStep(step);
  };

  return {
    // Step
    currentStep,
    setCurrentStep,
    goToStep,

    // Registration data
    userData,
    updateUserData,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    verificationCode,
    isResending,
    resendMessage,
    setResendMessage,

    // Sign-in data
    signInEmail,
    setSignInEmail,
    signInPassword,
    setSignInPassword,
    showSignInPassword,
    setShowSignInPassword,

    // Shared
    loading,
    error,
    setError,

    // Reset-password data
    resetEmail,
    setResetEmail,
    resetCode,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,
    resetLoading,
    resetResendMessage,
    resetCodeDelivery,

    // Derived
    passwordRequirements,
    allRequirementsMet,
    isVerificationCodeComplete,
    isResetCodeComplete,
    resetPasswordRequirements,
    resetPasswordRequirementsMet,

    // Handlers
    handleSignIn,
    handleWelcomeContinue,
    handlePasswordContinue,
    handleVerifySubmit,
    handleResendCode,
    handleVerificationCodeChange,
    handleVerificationKeyDown,
    handleResetCodeChange,
    handleResetCodeKeyDown,
    handleSendResetCode,
    handleResetResendCode,
    handleResetVerifyContinue,
    handleResetPasswordSubmit,
    goToForgotPassword,
  };
}

export type UseRegistrationFlowReturn = ReturnType<typeof useRegistrationFlow>;
