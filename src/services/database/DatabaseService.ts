/**
 * Database Service Interface Definitions
 *
 * Defines the contracts for database operations, authentication,
 * storage, and real-time functionality across different providers.
 */

// Query and filter types

/** A filter can be a full operator/value pair or a bare value (treated as equality). */
export type QueryFilter =
  | {
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';
      value: string | number | boolean | string[] | number[] | null;
    }
  | string
  | number
  | boolean;

export interface QueryOptions {
  filters?: Record<string, QueryFilter>;
  columns?: string | string[];
  orderBy?: Array<{
    column: string;
    ascending: boolean;
  }>;
  limit?: number;
  offset?: number;
}

export interface DatabaseResult<T = Record<string, unknown>> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

// Database service interface
export interface DatabaseService {
  select<T = Record<string, unknown>>(table: string, options?: QueryOptions): Promise<DatabaseResult<T>>;
  insert<T = Record<string, unknown>>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options?: Record<string, unknown>
  ): Promise<InsertResult<T> | DatabaseResult<T>>;
  update<T = Record<string, unknown>>(
    table: string,
    data: Partial<T>,
    filtersOrOptions?: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<UpdateResult<T> | DatabaseResult<T>>;
  delete<T = Record<string, unknown>>(
    table: string,
    filtersOrOptions?: Record<string, unknown>
  ): Promise<DeleteResult<T> | DatabaseResult<void>>;
  upsert?<T = Record<string, unknown>>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options?: { onConflict?: string }
  ): Promise<DatabaseResult<T>>;
  healthCheck?(): Promise<boolean>;
}

import type { AuthUser } from '../cognito-api-client';

/** Session object returned by the auth service. */
export interface AuthSession {
  accessToken: string;
  idToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Authentication service interface.
 *
 * Three implementations exist with slightly different signatures
 * (AWSService, AWSBrowserService, LocalBackendService).
 * The interface uses flexible types to accommodate all of them
 * without requiring runtime changes.
 */
export interface AuthService {
  signUp(
    emailOrCredentials: string | { email: string; password: string; firstName?: string; lastName?: string },
    password?: string,
    options?: Record<string, unknown>
  ): Promise<{ user?: AuthUser | null; data?: Record<string, unknown> | null; error: string | null }>;

  signIn(
    emailOrCredentials: string | { email: string; password: string },
    password?: string
  ): Promise<{ user?: AuthUser | null; data?: Record<string, unknown> | null; error: string | null }>;

  signOut(): Promise<{ error: string | null }>;

  getCurrentUser(): Promise<{
    user?: AuthUser | null;
    data?: Record<string, unknown> | null;
    error: string | null;
  }>;

  /** AWSBrowserService calls this getCurrentSession, AWSService calls it getSession. */
  getSession?(): Promise<{ data: AuthSession | null; error: string | null }>;

  /** AWSBrowserService calls this refreshSession, AWSService calls it refreshToken. */
  refreshToken?(): Promise<{ user?: AuthUser | null; data?: Record<string, unknown> | null; error: string | null }>;

  resetPassword(email: string): Promise<{ error: string | null }>;

  resendConfirmationCode?(email: string): Promise<{ error: string | null }>;
}

// Storage service interface
export interface StorageService {
  upload(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<{
    url?: string;
    key?: string;
    error: string | null;
  }>;

  download(
    bucket: string,
    path: string
  ): Promise<{
    data: Blob | null;
    error: string | null;
  }>;

  delete(bucket: string, path: string): Promise<{ error: string | null }>;

  getSignedUrl(
    bucket: string,
    path: string,
    expiresIn?: number
  ): Promise<{
    url: string | null;
    error: string | null;
  }>;
}

// Functions service interface
export interface FunctionService {
  invoke<T = Record<string, unknown>>(
    functionName: string,
    payload?: Record<string, unknown>,
    options?: {
      headers?: Record<string, string>;
    }
  ): Promise<{
    data: T | null;
    error: string | null;
  }>;
}

// Real-time service interface
export interface RealtimeService {
  subscribe<T = Record<string, unknown>>(
    table: string,
    options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
      filter?: string;
    },
    callback?: (payload: {
      eventType: string;
      new: T;
      old: T;
      errors: Array<{ message: string; code?: string }>;
    }) => void
  ): {
    unsubscribe: () => void;
  };
  removeAllSubscriptions(): void;
}

// Main service provider interface
export interface BackendService {
  database: DatabaseService;
  auth: AuthService;
  storage: StorageService;
  realtime: RealtimeService;
  functions: FunctionService;
}

// Error types
export interface DatabaseError {
  message: string;
  code?: string;
  details?: string;
}

export interface AuthError {
  message: string;
  code?: string;
  details?: string;
}

export interface StorageError {
  message: string;
  code?: string;
  details?: string;
}

// Result types
export interface QueryResult<T = Record<string, unknown>> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

export interface SelectResult<T = Record<string, unknown>> {
  data: T[] | null;
  error: string | null;
  count?: number;
}

export interface InsertResult<T = Record<string, unknown>> {
  data: T | null;
  error: string | null;
}

export interface UpdateResult<T = Record<string, unknown>> {
  data: T | null;
  error: string | null;
}

export interface DeleteResult<T = Record<string, unknown>> {
  data?: T[] | null;
  error: string | null;
  count?: number;
}

// Configuration interface
export interface DatabaseConfig {
  provider: 'aws' | 'aurora-serverless' | 'postgresql' | 'local';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;

  // AWS specific
  baseUrl?: string;
  anonKey?: string;
  serviceKey?: string;
  region?: string;
  awsRegion?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  userPoolId?: string;
  clientId?: string;
  identityPoolId?: string;
  bucketName?: string;
  lambdaEndpoint?: string;

  // Cognito specific
  cognitoUserPoolId?: string;
  cognitoClientId?: string;

  // S3 specific
  s3BucketName?: string;
  s3Region?: string;

  // AWS credentials (for BackendServiceFactory)
  awsCredentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };

  // API base URL (for browser-based backend services)
  apiBaseUrl?: string;
}
