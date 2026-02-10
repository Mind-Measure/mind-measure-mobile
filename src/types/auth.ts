/**
 * Authentication type definitions.
 *
 * Covers Cognito JWT payloads, API request/response shapes,
 * and the auth session lifecycle.
 */

// ----------------------------------------------------------------
// JWT Payloads
// ----------------------------------------------------------------

/** Claims present in a decoded Cognito ID token. */
export interface CognitoIdTokenPayload {
  sub: string;
  'cognito:username'?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  /** Token use — should be "id" for ID tokens */
  token_use?: 'id' | 'access';
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  /** Custom attributes added in Cognito user pool */
  'custom:roles'?: string;
  'cognito:groups'?: string[];
}

/** Claims present in a decoded Cognito access token. */
export interface CognitoAccessTokenPayload {
  sub: string;
  client_id: string;
  token_use: 'access';
  scope: string;
  iss: string;
  iat: number;
  exp: number;
  'cognito:groups'?: string[];
}

// ----------------------------------------------------------------
// Auth API Request / Response shapes
// ----------------------------------------------------------------

export interface SignUpRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignUpResponse {
  userSub: string;
  userConfirmed: boolean;
  codeDeliveryDetails?: CodeDeliveryDetails;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  needsVerification?: boolean;
  needsNewPassword?: boolean;
  challengeName?: string;
  session?: string;
  error?: string | null;
}

export interface TokenRefreshResponse {
  session: {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface GetUserResponse {
  username: string;
  attributes: {
    email?: string;
    given_name?: string;
    family_name?: string;
    email_verified?: string;
    sub?: string;
  };
}

export interface CodeDeliveryDetails {
  DeliveryMedium?: string;
  Destination?: string;
  AttributeName?: string;
}

export interface ForgotPasswordResponse {
  codeDeliveryDetails?: CodeDeliveryDetails;
  CodeDeliveryDetails?: CodeDeliveryDetails;
  needsVerification?: boolean;
}

// ----------------------------------------------------------------
// Generic auth result wrappers
// ----------------------------------------------------------------

export interface AuthResult<T = unknown> {
  data: T;
  error: string | null;
}

export interface AuthErrorResult {
  error: string | null;
}
