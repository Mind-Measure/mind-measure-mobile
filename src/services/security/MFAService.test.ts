import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MFAService, createMFAService } from './MFAService';

// ── Mock @aws-sdk/client-cognito-identity-provider ──────────────────────────
const mockSend = vi.fn();

vi.mock('@aws-sdk/client-cognito-identity-provider', () => {
  class MockCognitoClient {
    send = mockSend;
  }
  class MockCommand {
    constructor(public params?: any) {}
  }
  return {
    CognitoIdentityProviderClient: MockCognitoClient,
    InitiateAuthCommand: MockCommand,
    RespondToAuthChallengeCommand: MockCommand,
    SetUserMFAPreferenceCommand: MockCommand,
    AssociateSoftwareTokenCommand: MockCommand,
    VerifySoftwareTokenCommand: MockCommand,
    ConfirmSignUpCommand: MockCommand,
    SignUpCommand: MockCommand,
    GetUserCommand: MockCommand,
  };
});

// ── Silence console.error in tests ──────────────────────────────────────────
vi.spyOn(console, 'error').mockImplementation(() => {});

const baseConfig = {
  region: 'eu-west-2',
  accessKeyId: 'test-key',
  secretAccessKey: 'test-secret',
  userPoolId: 'eu-west-2_test',
  clientId: 'test-client-id',
};

let service: MFAService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new MFAService(baseConfig);
});

// ============================================================================
// signUpWithMFA
// ============================================================================

describe('MFAService – signUpWithMFA', () => {
  it('returns success on successful sign up', async () => {
    mockSend.mockResolvedValue({ Session: 'session-token-123' });

    const result = await service.signUpWithMFA('test@example.com', 'Password1!');

    expect(result.success).toBe(true);
    expect(result.session).toBe('session-token-123');
  });

  it('returns error on sign up failure', async () => {
    mockSend.mockRejectedValue(new Error('UsernameExistsException'));

    const result = await service.signUpWithMFA('test@example.com', 'Password1!');

    expect(result.success).toBe(false);
    expect(result.error).toBe('UsernameExistsException');
  });
});

// ============================================================================
// confirmSignUp
// ============================================================================

describe('MFAService – confirmSignUp', () => {
  it('returns success on valid confirmation', async () => {
    mockSend.mockResolvedValue({});

    const result = await service.confirmSignUp('test@example.com', '123456');

    expect(result.success).toBe(true);
  });

  it('returns error when confirmation fails', async () => {
    mockSend.mockRejectedValue(new Error('CodeMismatchException'));

    const result = await service.confirmSignUp('test@example.com', '999999');

    expect(result.success).toBe(false);
    expect(result.error).toBe('CodeMismatchException');
  });
});

// ============================================================================
// initiateAuth
// ============================================================================

describe('MFAService – initiateAuth', () => {
  it('returns tokens when authentication succeeds without MFA challenge', async () => {
    mockSend.mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'access-token',
        IdToken: 'id-token',
        RefreshToken: 'refresh-token',
      },
    });

    const result = await service.initiateAuth('test@example.com', 'Password1!');

    expect(result.success).toBe(true);
    expect(result.accessToken).toBe('access-token');
    expect(result.idToken).toBe('id-token');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('returns challenge when MFA is required', async () => {
    mockSend.mockResolvedValue({
      ChallengeName: 'SMS_MFA',
      Session: 'mfa-session',
    });

    const result = await service.initiateAuth('test@example.com', 'Password1!');

    expect(result.success).toBe(true);
    expect(result.challengeName).toBe('SMS_MFA');
    expect(result.session).toBe('mfa-session');
  });

  it('returns error on auth failure', async () => {
    mockSend.mockRejectedValue(new Error('NotAuthorizedException'));

    const result = await service.initiateAuth('test@example.com', 'wrong-password');

    expect(result.success).toBe(false);
    expect(result.error).toBe('NotAuthorizedException');
  });
});

// ============================================================================
// respondToMFAChallenge
// ============================================================================

describe('MFAService – respondToMFAChallenge', () => {
  it('returns tokens after successful SMS MFA response', async () => {
    mockSend.mockResolvedValue({
      AuthenticationResult: {
        AccessToken: 'access-after-mfa',
        IdToken: 'id-after-mfa',
        RefreshToken: 'refresh-after-mfa',
      },
    });

    const result = await service.respondToMFAChallenge('SMS_MFA', 'session-token', '123456', 'test@example.com');

    expect(result.success).toBe(true);
    expect(result.accessToken).toBe('access-after-mfa');
  });

  it('handles chained challenges (e.g. another challenge after first)', async () => {
    mockSend.mockResolvedValue({
      ChallengeName: 'SOFTWARE_TOKEN_MFA',
      Session: 'next-session',
    });

    const result = await service.respondToMFAChallenge('SMS_MFA', 'session-token', '123456', 'test@example.com');

    expect(result.success).toBe(true);
    expect(result.challengeName).toBe('SOFTWARE_TOKEN_MFA');
    expect(result.session).toBe('next-session');
  });

  it('returns error on challenge failure', async () => {
    mockSend.mockRejectedValue(new Error('CodeMismatchException'));

    const result = await service.respondToMFAChallenge('SMS_MFA', 'session-token', 'wrong', 'test@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toBe('CodeMismatchException');
  });
});

// ============================================================================
// setupTOTP
// ============================================================================

describe('MFAService – setupTOTP', () => {
  it('returns secret code and QR URL on success', async () => {
    mockSend.mockResolvedValue({ SecretCode: 'JBSWY3DPEHPK3PXP' });

    const result = await service.setupTOTP('access-token');

    expect(result.success).toBe(true);
    expect(result.secretCode).toBe('JBSWY3DPEHPK3PXP');
    expect(result.qrCodeUrl).toContain('otpauth');
    expect(result.qrCodeUrl).toContain('Mind');
  });

  it('returns error when no secret code is returned', async () => {
    mockSend.mockResolvedValue({});

    const result = await service.setupTOTP('access-token');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to generate TOTP secret');
  });

  it('returns error on SDK failure', async () => {
    mockSend.mockRejectedValue(new Error('InternalErrorException'));

    const result = await service.setupTOTP('access-token');

    expect(result.success).toBe(false);
    expect(result.error).toBe('InternalErrorException');
  });
});

// ============================================================================
// verifyTOTP
// ============================================================================

describe('MFAService – verifyTOTP', () => {
  it('returns success when verification succeeds', async () => {
    mockSend.mockResolvedValue({ Status: 'SUCCESS', Session: 'verified-session' });

    const result = await service.verifyTOTP('access-token', '123456');

    expect(result.success).toBe(true);
    expect(result.session).toBe('verified-session');
  });

  it('returns failure when status is not SUCCESS', async () => {
    mockSend.mockResolvedValue({ Status: 'FAILED' });

    const result = await service.verifyTOTP('access-token', 'wrong');

    expect(result.success).toBe(false);
  });

  it('returns error on verification exception', async () => {
    mockSend.mockRejectedValue(new Error('EnableSoftwareTokenMFAException'));

    const result = await service.verifyTOTP('access-token', '123456');

    expect(result.success).toBe(false);
    expect(result.error).toBe('EnableSoftwareTokenMFAException');
  });
});

// ============================================================================
// setMFAPreference
// ============================================================================

describe('MFAService – setMFAPreference', () => {
  it('returns success when preferences are set', async () => {
    mockSend.mockResolvedValue({});

    const result = await service.setMFAPreference('access-token', {
      smsEnabled: true,
      totpEnabled: false,
      preferredMFA: 'SMS',
    });

    expect(result.success).toBe(true);
  });

  it('returns error when setting preferences fails', async () => {
    mockSend.mockRejectedValue(new Error('InvalidParameterException'));

    const result = await service.setMFAPreference('access-token', {
      smsEnabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('InvalidParameterException');
  });
});

// ============================================================================
// getUserMFAStatus
// ============================================================================

describe('MFAService – getUserMFAStatus', () => {
  it('returns MFA status when user has MFA enabled', async () => {
    mockSend.mockResolvedValue({
      MFAOptions: [{ DeliveryMedium: 'SMS' }],
      UserMFASettingList: ['SOFTWARE_TOKEN_MFA'],
      PreferredMfaSetting: 'SOFTWARE_TOKEN_MFA',
    });

    const result = await service.getUserMFAStatus('access-token');

    expect(result.mfaEnabled).toBe(true);
    expect(result.mfaMethods).toContain('SMS');
    expect(result.mfaMethods).toContain('SOFTWARE_TOKEN_MFA');
    expect(result.preferredMFA).toBe('SOFTWARE_TOKEN_MFA');
  });

  it('returns mfaEnabled false when no MFA is configured', async () => {
    mockSend.mockResolvedValue({
      MFAOptions: [],
      UserMFASettingList: [],
    });

    const result = await service.getUserMFAStatus('access-token');

    expect(result.mfaEnabled).toBe(false);
    expect(result.mfaMethods).toEqual([]);
  });

  it('returns defaults on error', async () => {
    mockSend.mockRejectedValue(new Error('AccessDeniedException'));

    const result = await service.getUserMFAStatus('access-token');

    expect(result.mfaEnabled).toBe(false);
    expect(result.mfaMethods).toEqual([]);
  });
});

// ============================================================================
// createMFAService factory
// ============================================================================

describe('createMFAService', () => {
  it('creates an MFAService instance', () => {
    const svc = createMFAService();
    expect(svc).toBeInstanceOf(MFAService);
  });
});
