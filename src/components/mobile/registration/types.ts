export interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export type RegistrationStep =
  | 'signin'
  | 'welcome'
  | 'password'
  | 'verify'
  | 'forgot-password'
  | 'reset-verify'
  | 'reset-new-password';

export interface RegistrationFlowProps {
  /** Called after successful sign-in. Optional userId for saving to device. */
  onSignInSuccess?: (userId?: string) => void;
  onRegistrationComplete?: () => void;
  onBack?: () => void;
  /** Prefill sign-in email (e.g. from check-email intercept). */
  prefilledEmail?: string;
}
