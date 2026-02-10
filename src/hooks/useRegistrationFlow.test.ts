import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRegistrationFlow } from './useRegistrationFlow';

// ── Mock useAuth ────────────────────────────────────────────────────────────
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockConfirmEmail = vi.fn();
const mockResendConfirmation = vi.fn();
const mockForgotPassword = vi.fn();
const mockConfirmForgotPassword = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    signUp: mockSignUp,
    confirmEmail: mockConfirmEmail,
    resendConfirmation: mockResendConfirmation,
    forgotPassword: mockForgotPassword,
    confirmForgotPassword: mockConfirmForgotPassword,
  }),
}));

// ── Mock global fetch ───────────────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockReset();
});

// ============================================================================
// Initial State
// ============================================================================

describe('useRegistrationFlow – initial state', () => {
  it('starts on the signin step', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    expect(result.current.currentStep).toBe('signin');
  });

  it('initialises userData with empty strings', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    expect(result.current.userData).toEqual({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    });
  });

  it('has no loading or error state initially', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('has verification code as six empty strings', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    expect(result.current.verificationCode).toEqual(['', '', '', '', '', '']);
  });
});

// ============================================================================
// Password Requirements (derived values)
// ============================================================================

describe('useRegistrationFlow – password requirements', () => {
  it('minLength is false for short passwords', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.updateUserData('password', 'Ab1'));
    expect(result.current.passwordRequirements.minLength).toBe(false);
  });

  it('minLength is true for 8+ character passwords', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.updateUserData('password', 'Abcdefg1'));
    expect(result.current.passwordRequirements.minLength).toBe(true);
  });

  it('detects uppercase requirement', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.updateUserData('password', 'abcdefg1'));
    expect(result.current.passwordRequirements.hasUppercase).toBe(false);

    act(() => result.current.updateUserData('password', 'Abcdefg1'));
    expect(result.current.passwordRequirements.hasUppercase).toBe(true);
  });

  it('detects lowercase requirement', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.updateUserData('password', 'ABCDEFG1'));
    expect(result.current.passwordRequirements.hasLowercase).toBe(false);

    act(() => result.current.updateUserData('password', 'ABCDEFg1'));
    expect(result.current.passwordRequirements.hasLowercase).toBe(true);
  });

  it('detects number requirement', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.updateUserData('password', 'Abcdefgh'));
    expect(result.current.passwordRequirements.hasNumber).toBe(false);

    act(() => result.current.updateUserData('password', 'Abcdefg1'));
    expect(result.current.passwordRequirements.hasNumber).toBe(true);
  });

  it('passwordsMatch is true only when passwords match and confirmPassword is non-empty', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => {
      result.current.updateUserData('password', 'Password1');
      result.current.setConfirmPassword('Password1');
    });
    expect(result.current.passwordRequirements.passwordsMatch).toBe(true);
  });

  it('passwordsMatch is false when confirm is empty', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => {
      result.current.updateUserData('password', 'Password1');
      result.current.setConfirmPassword('');
    });
    expect(result.current.passwordRequirements.passwordsMatch).toBe(false);
  });

  it('allRequirementsMet is true only when all requirements pass', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => {
      result.current.updateUserData('password', 'StrongP1');
      result.current.setConfirmPassword('StrongP1');
    });
    expect(result.current.allRequirementsMet).toBe(true);
  });

  it('allRequirementsMet is false when any requirement fails', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    // No uppercase
    act(() => {
      result.current.updateUserData('password', 'strongp1');
      result.current.setConfirmPassword('strongp1');
    });
    expect(result.current.allRequirementsMet).toBe(false);
  });
});

// ============================================================================
// Step Navigation
// ============================================================================

describe('useRegistrationFlow – step navigation', () => {
  it('goToStep changes the current step', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.goToStep('welcome'));
    expect(result.current.currentStep).toBe('welcome');
  });

  it('goToStep clears any existing error', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.setError('some error'));
    expect(result.current.error).toBe('some error');

    act(() => result.current.goToStep('password'));
    expect(result.current.error).toBeNull();
  });

  it('goToForgotPassword transitions to forgot-password step', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    act(() => result.current.goToForgotPassword());
    expect(result.current.currentStep).toBe('forgot-password');
  });
});

// ============================================================================
// Verification Code
// ============================================================================

describe('useRegistrationFlow – verification code', () => {
  it('isVerificationCodeComplete is false when digits are missing', () => {
    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));
    expect(result.current.isVerificationCodeComplete).toBe(false);
  });
});

// ============================================================================
// handleSignIn
// ============================================================================

describe('useRegistrationFlow – handleSignIn', () => {
  it('calls signIn and invokes onSignInSuccess on success', async () => {
    const onSignInSuccess = vi.fn();
    mockSignIn.mockResolvedValue({ error: null, user: { id: 'user-123' } });

    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess }));

    act(() => {
      result.current.setSignInEmail('test@example.com');
      result.current.setSignInPassword('password123');
    });

    await act(async () => {
      await result.current.handleSignIn();
    });

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(onSignInSuccess).toHaveBeenCalledWith('user-123');
    expect(result.current.error).toBeNull();
  });

  it('sets error when signIn returns an error', async () => {
    mockSignIn.mockResolvedValue({ error: 'Invalid credentials' });

    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));

    act(() => {
      result.current.setSignInEmail('test@example.com');
      result.current.setSignInPassword('wrong');
    });

    await act(async () => {
      await result.current.handleSignIn();
    });

    expect(result.current.error).toBe('Invalid credentials');
  });

  it('transitions to verify step when needsVerification is true', async () => {
    mockSignIn.mockResolvedValue({ error: null, needsVerification: true });

    const { result } = renderHook(() => useRegistrationFlow({ onSignInSuccess: vi.fn() }));

    act(() => {
      result.current.setSignInEmail('test@example.com');
      result.current.setSignInPassword('password123');
    });

    await act(async () => {
      await result.current.handleSignIn();
    });

    expect(result.current.currentStep).toBe('verify');
  });
});
