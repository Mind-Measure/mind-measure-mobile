/**
 * Unified auth flow (sign-in, welcome, password, verify) using the designed UI.
 * Wired to AuthContext, check-email API, and confirm/resend.
 *
 * This is a thin orchestrator – all state lives in useRegistrationFlow
 * and each step has its own component under ./registration/.
 */
import { useRegistrationFlow } from '@/hooks/useRegistrationFlow';
import { SignInStep } from './registration/SignInStep';
import { WelcomeStep } from './registration/WelcomeStep';
import { PasswordStep } from './registration/PasswordStep';
import { VerifyStep } from './registration/VerifyStep';
import { ForgotPasswordStep } from './registration/ForgotPasswordStep';

// Re-export types so existing imports from this file still work.
export type { UserRegistrationData, RegistrationStep, RegistrationFlowProps } from './registration/types';

import type { RegistrationFlowProps } from './registration/types';

export function RegistrationFlow({
  onSignInSuccess,
  onRegistrationComplete,
  onBack,
  prefilledEmail = '',
}: RegistrationFlowProps) {
  const flow = useRegistrationFlow({
    prefilledEmail,
    onSignInSuccess,
    onRegistrationComplete,
  });

  switch (flow.currentStep) {
    case 'signin':
      return <SignInStep flow={flow} onBack={onBack} />;
    case 'welcome':
      return <WelcomeStep flow={flow} />;
    case 'password':
      return <PasswordStep flow={flow} />;
    case 'verify':
      return <VerifyStep flow={flow} />;
    case 'forgot-password':
    case 'reset-verify':
    case 'reset-new-password':
      return <ForgotPasswordStep flow={flow} step={flow.currentStep} />;
  }
}
