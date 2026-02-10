// Browser-compatible AWS Backend Service
// Uses API endpoints instead of direct AWS SDK calls
import {
  AuthService,
  AuthSession,
  DatabaseConfig,
  DatabaseService,
  DatabaseResult,
  RealtimeService,
  StorageService,
  QueryResult,
  InsertResult,
  UpdateResult,
  DeleteResult,
} from './DatabaseService';
import { cognitoApiClient } from '../cognito-api-client';

/** Auth-specific error with an error code. */
class AuthApiError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
  }
}

// Browser-compatible database service that uses API endpoints
export class AWSBrowserDatabaseService implements DatabaseService {
  private apiBaseUrl: string;
  constructor(_config: DatabaseConfig) {
    // Use environment variable for API base URL, fallback to relative path for production
    const envApiUrl = import.meta.env.VITE_API_BASE_URL;
    const isCapacitor =
      window.location.protocol === 'capacitor:' || !!(window as unknown as { Capacitor?: unknown }).Capacitor;

    if (envApiUrl) {
      // Use explicit API URL from environment (e.g., https://mobile.mindmeasure.app/api)
      this.apiBaseUrl = envApiUrl + '/database';
    } else if (isCapacitor) {
      // Capacitor should always use production API
      this.apiBaseUrl = 'https://mobile.mindmeasure.app/api/database';
    } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && !isCapacitor) {
      // Local development fallback (only for web browsers, not Capacitor)
      this.apiBaseUrl = 'http://localhost:3001/api/database';
    } else {
      // Production fallback (relative URL)
      this.apiBaseUrl = '/api/database';
    }
  }
  private async apiCall<T = Record<string, unknown>>(
    endpoint: string,
    method: string = 'POST',
    body?: Record<string, unknown>
  ): Promise<T> {
    try {
      // Get JWT token for authentication
      const token = await cognitoApiClient.getIdToken();

      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
      }

      const result = (await response.json()) as T;
      return result;
    } catch (error) {
      console.error('❌ API Call failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
        cause: error instanceof Error ? error.cause : undefined,
      });
      throw error;
    }
  }
  async select<T = Record<string, unknown>>(
    table: string,
    options?: {
      columns?: string | string[];
      filters?: Record<string, unknown>;
      orderBy?: Array<{ column: string; ascending?: boolean }>;
      limit?: number;
      offset?: number;
    }
  ): Promise<QueryResult<T>> {
    try {
      const result = await this.apiCall<{ data: T[]; count: number }>('/select', 'POST', {
        table,
        columns: options?.columns || '*',
        filters: options?.filters || {},
        orderBy: options?.orderBy || [],
        limit: options?.limit,
      });
      return {
        data: result.data,
        error: null,
        count: result.count,
      };
    } catch (error: unknown) {
      // For baseline assessment, fail silently to avoid blocking ElevenLabs
      console.warn('⚠️ Database select failed (failing silently for baseline):', error);
      return {
        data: [],
        error: null, // Return null error to avoid blocking UI
        count: 0,
      };
    }
  }
  async insert<T = Record<string, unknown>>(
    table: string,
    data: Partial<T> | Partial<T>[],
    options?: { onConflict?: string }
  ): Promise<InsertResult<T>> {
    try {
      const result = await this.apiCall<{ data: T }>('/insert', 'POST', { table, data, options });
      return {
        data: result.data,
        error: null,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Database insert failed';
      console.error('[AWSBrowserService] ❌ Database insert failed:', error);
      console.error('[AWSBrowserService] ❌ Error message:', message);
      return {
        data: null,
        error: message,
      };
    }
  }
  async update<T = Record<string, unknown>>(
    table: string,
    data: Partial<T>,
    filters: Record<string, unknown>,
    options?: { returning?: boolean }
  ): Promise<UpdateResult<T>> {
    try {
      const result = await this.apiCall<{ data: T }>('/update', 'POST', { table, data, filters, options });
      return {
        data: result.data,
        error: null,
      };
    } catch (error: unknown) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Database update failed',
      };
    }
  }
  async delete<T = Record<string, unknown>>(
    table: string,
    filters?: Record<string, unknown>
  ): Promise<DeleteResult<T> | DatabaseResult<void>> {
    try {
      const result = await this.apiCall<{ data: T[]; count: number }>('/delete', 'POST', { table, filters });
      return {
        data: result.data,
        error: null,
        count: result.count,
      };
    } catch (error: unknown) {
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Database delete failed',
        count: 0,
      };
    }
  }
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/health`, { method: 'GET' });
      return response.ok;
    } catch {
      return false;
    }
  }
}
// Browser-compatible Auth Service using API endpoints
export class AWSBrowserAuthService implements AuthService {
  private userPoolId: string;
  private clientId: string;
  private currentSession: AuthSession | null = null;
  private authStateCallbacks: ((event: string, session: AuthSession | null) => void)[] = [];
  private apiBaseUrl: string;
  constructor(config: DatabaseConfig) {
    // Trim any whitespace/newlines from environment variables
    const userPoolId = config.cognitoUserPoolId?.trim();
    const clientId = config.cognitoClientId?.trim();

    if (!userPoolId || !clientId) {
      // Note: This is EXPECTED in production - we use token-based auth via cognito-api-client
      // not full Amplify in-browser. Auth works via tokens restored from native storage.
      // Use fallback values to prevent crashes - actual auth uses different pathway
      this.userPoolId = userPoolId || 'fallback-pool-id';
      this.clientId = clientId || 'fallback-client-id';
    } else {
      this.userPoolId = userPoolId;
      this.clientId = clientId;
    }
    this.apiBaseUrl = '/api/auth'; // We'll create auth API endpoints
  }
  private async authApiCall<T = Record<string, unknown>>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    // Check if we have valid configuration
    // Note: In production, auth goes through cognito-api-client, not this pathway
    if (this.userPoolId === 'fallback-pool-id' || this.clientId === 'fallback-client-id') {
      // This is expected - actual auth uses token-based cognito-api-client
      return {
        success: false,
        error: 'Using token-based auth pathway instead',
        session: null,
      } as T;
    }
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new AuthApiError((result as { error?: string }).error || 'Authentication failed', 'AUTH_ERROR');
    }
    return result as T;
  }
  async signUp(
    email: string,
    password: string,
    options?: { userAttributes?: Array<{ Name: string; Value: string }> }
  ): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
    try {
      const result = await this.authApiCall('/signup', {
        email,
        password,
        userAttributes: options?.userAttributes || [],
      });
      return { data: result, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'Sign up failed' };
    }
  }
  async signIn(
    email: string,
    password: string
  ): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
    try {
      const result = await this.authApiCall<{ session: AuthSession }>('/signin', { email, password });
      this.currentSession = result.session;
      // Notify listeners
      this.authStateCallbacks.forEach((callback) => callback('SIGNED_IN', this.currentSession));
      return { data: result, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'Sign in failed' };
    }
  }
  async signOut(): Promise<{ error: string | null }> {
    try {
      await this.authApiCall('/signout', { session: this.currentSession ?? {} });
      const oldSession = this.currentSession;
      this.currentSession = null;
      // Notify listeners
      this.authStateCallbacks.forEach((callback) => callback('SIGNED_OUT', oldSession));
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Sign out failed' };
    }
  }
  async getCurrentUser(): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
    try {
      if (!this.currentSession) {
        return { data: null, error: 'No current session' };
      }
      const result = await this.authApiCall('/user', { session: this.currentSession });
      return { data: result, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get user' };
    }
  }
  async getCurrentSession(): Promise<{ data: AuthSession | null; error: string | null }> {
    return { data: this.currentSession, error: null };
  }
  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      await this.authApiCall('/reset-password', { email });
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Password reset failed' };
    }
  }
  async updatePassword(oldPassword: string, newPassword: string): Promise<{ error: string | null }> {
    try {
      await this.authApiCall('/update-password', {
        oldPassword,
        newPassword,
        session: this.currentSession ?? {},
      });
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Password update failed' };
    }
  }
  async refreshSession(): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
    try {
      if (!this.currentSession?.refreshToken) {
        return { data: null, error: 'No refresh token available' };
      }
      const result = await this.authApiCall<{ session: AuthSession }>('/refresh', {
        refreshToken: this.currentSession.refreshToken,
      });
      this.currentSession = result.session;
      return { data: result, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'Session refresh failed' };
    }
  }
  onAuthStateChange(callback: (event: string, session: AuthSession | null) => void): { unsubscribe: () => void } {
    this.authStateCallbacks.push(callback);
    return {
      unsubscribe: () => {
        const index = this.authStateCallbacks.indexOf(callback);
        if (index > -1) {
          this.authStateCallbacks.splice(index, 1);
        }
      },
    };
  }
}
// Browser-compatible Storage Service using API endpoints
export class AWSBrowserStorageService implements StorageService {
  private defaultBucket: string;
  private apiBaseUrl: string;
  constructor(config: DatabaseConfig) {
    if (!config.s3BucketName) {
      throw new Error('AWS S3 requires bucketName');
    }
    this.defaultBucket = config.s3BucketName;
    this.apiBaseUrl = '/api/storage'; // We'll create storage API endpoints
  }
  private async storageApiCall<T = Record<string, unknown>>(
    endpoint: string,
    body?: FormData | Record<string, unknown>,
    method: string = 'POST'
  ): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
      method,
      headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error((result as { error?: string }).error || 'Storage operation failed');
    }
    return result as T;
  }
  async upload(
    bucket: string,
    path: string,
    file: File | Blob,
    _options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    }
  ): Promise<{
    url?: string;
    key?: string;
    error: string | null;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filePath', path);
      formData.append('bucket', bucket);
      const result = await this.storageApiCall<{ data?: { url?: string; path?: string } }>('/upload', formData);
      return { url: result.data?.url, key: result.data?.path, error: null };
    } catch (error: unknown) {
      return { url: undefined, key: undefined, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Convenience method for FileUpload component compatibility
  async uploadFile(
    path: string,
    file: File | Blob,
    options?: { bucket?: string; contentType?: string; metadata?: Record<string, string> }
  ): Promise<{ data: { url?: string; key?: string; error: string | null } | null; error: string | null }> {
    try {
      const bucket = options?.bucket || this.defaultBucket;
      const result = await this.upload(bucket, path, file, options);
      return { data: result, error: result.error };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }
  async download(
    bucket: string,
    path: string
  ): Promise<{
    data: Blob | null;
    error: string | null;
  }> {
    try {
      const result = await this.storageApiCall<{ url: string }>('/download', {
        path,
        bucket,
      });
      // Get the actual file from the signed URL
      const fileResponse = await fetch(result.url);
      const blob = await fileResponse.blob();
      return { data: blob, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'Download failed' };
    }
  }
  async getPublicUrl(
    path: string,
    options?: { bucket?: string }
  ): Promise<{ data: string | null; error: string | null }> {
    try {
      const result = await this.storageApiCall<{ url: string }>('/public-url', {
        path,
        bucket: options?.bucket || this.defaultBucket,
      });
      return { data: result.url, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'Failed to get URL' };
    }
  }
  // Method overloads for different signatures
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn?: number
  ): Promise<{ url: string | null; error: string | null }>;
  async getSignedUrl(
    path: string,
    expiresIn?: number,
    options?: { bucket?: string }
  ): Promise<{ data: string | null; error: string | null }>;
  async getSignedUrl(
    pathOrBucket: string,
    pathOrExpiresIn?: string | number,
    optionsOrExpiresIn?: number | { bucket?: string }
  ): Promise<{ data: string | null; url: string | null; error: string | null }> {
    try {
      // Handle both signatures:
      // 1. getSignedUrl(bucket, path, expiresIn) - interface signature
      // 2. getSignedUrl(path, expiresIn, options) - FileUpload signature

      let bucket: string, path: string, expiresIn: number;

      if (typeof pathOrExpiresIn === 'string') {
        // Interface signature: getSignedUrl(bucket, path, expiresIn)
        bucket = pathOrBucket;
        path = pathOrExpiresIn;
        expiresIn = typeof optionsOrExpiresIn === 'number' ? optionsOrExpiresIn : 3600;
      } else {
        // FileUpload signature: getSignedUrl(path, expiresIn, options)
        path = pathOrBucket;
        expiresIn = (pathOrExpiresIn as number) || 3600;
        bucket = (typeof optionsOrExpiresIn === 'object' && optionsOrExpiresIn?.bucket) || this.defaultBucket;
      }

      const result = await this.storageApiCall<{ url: string }>('/signed-url', {
        path,
        expiresIn,
        bucket,
      });

      // Return both formats for compatibility
      return { data: result.url, url: result.url, error: null };
    } catch (error: unknown) {
      return { data: null, url: null, error: error instanceof Error ? error.message : 'Failed to get signed URL' };
    }
  }
  async delete(bucket: string, path: string): Promise<{ error: string | null }> {
    try {
      await this.storageApiCall('/delete', {
        paths: [path],
        bucket,
      });
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }
  async list(
    path?: string,
    options?: { bucket?: string; limit?: number; offset?: number }
  ): Promise<{ data: Array<{ name: string; size?: number }> | null; error: string | null }> {
    try {
      const result = await this.storageApiCall<{ files: Array<{ name: string; size?: number }> }>('/list', {
        path: path || '',
        bucket: options?.bucket || this.defaultBucket,
        limit: options?.limit,
        offset: options?.offset,
      });
      return { data: result.files, error: null };
    } catch (error: unknown) {
      return { data: null, error: error instanceof Error ? error.message : 'List failed' };
    }
  }
}
// Placeholder for browser-side real-time operations
class AWSBrowserRealtimeService implements RealtimeService {
  constructor(_config: DatabaseConfig) {}
  subscribe<T = Record<string, unknown>>(
    _table: string,
    _options?: { event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; schema?: string; filter?: string },
    _callback?: (payload: {
      eventType: string;
      new: T;
      old: T;
      errors: Array<{ message: string; code?: string }>;
    }) => void
  ) {
    console.warn(
      'Real-time service not implemented for browser-side AWS. Consider using WebSockets or Server-Sent Events.'
    );
    return { unsubscribe: () => {} };
  }
  removeAllSubscriptions() {
    console.warn('Real-time service not implemented for browser-side AWS.');
  }
}
// Functions service for AWS Lambda integration
export class AWSBrowserFunctionsService {
  private lambdaBaseUrl: string;

  constructor(_config: DatabaseConfig) {
    // Use environment variable if available, otherwise fallback to hardcoded dev endpoint
    const envLambdaUrl = import.meta.env.VITE_LAMBDA_BASE_URL;

    if (envLambdaUrl) {
      this.lambdaBaseUrl = envLambdaUrl.trim();
    } else {
      // No fallback — require env var to be set
      this.lambdaBaseUrl = '';
      console.warn('VITE_LAMBDA_BASE_URL not set — Lambda direct calls will be unavailable');
    }
  }

  /**
   * Get both ID token and access token for fallback auth
   * Returns { idToken, accessToken } with detailed logging
   */
  private async getTokens(): Promise<{ idToken: string | null; accessToken: string | null }> {
    try {
      const { Preferences } = await import('@capacitor/preferences');

      // Try ID token first
      let { value: idToken } = await Preferences.get({ key: 'mindmeasure_id_token' });
      if (!idToken) {
        ({ value: idToken } = await Preferences.get({ key: 'cognito_id_token' }));
      }

      // Get access token
      let { value: accessToken } = await Preferences.get({ key: 'mindmeasure_access_token' });
      if (!accessToken) {
        const result = await Preferences.get({ key: 'cognito_access_token' });
        accessToken = result.value;
      }

      // If not in storage, try to get from CognitoApiClient
      if (!idToken && !accessToken) {
        try {
          const { cognitoApiClient: cognitoClient } = await import('../cognito-api-client');
          idToken = await cognitoClient.getIdToken();
          if (idToken) {
            /* intentionally empty */
          }
        } catch (e) {
          console.warn('⚠️ Could not get ID token from CognitoApiClient:', e);
        }
      }

      // Log token details
      if (idToken) {
        this.logTokenDetails(idToken, 'ID');
      }
      if (accessToken) {
        this.logTokenDetails(accessToken, 'Access');
      }

      if (!idToken && !accessToken) {
        throw new Error('No tokens available - user not authenticated. Please sign in again.');
      }

      return { idToken: idToken || null, accessToken: accessToken || null };
    } catch (error) {
      console.error('❌ Failed to get tokens:', error);
      throw new Error('Authentication required for Lambda functions');
    }
  }

  /**
   * Log JWT token details (claims) for debugging
   */
  private logTokenDetails(token: string, tokenType: string): void {
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const base64Url = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const base64 = base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4);
        // Decode payload to validate token structure
        atob(base64);
      }
    } catch (e) {
      console.warn(`⚠️ Could not decode ${tokenType} token for details:`, e);
    }
  }

  private async getAccessToken(): Promise<string> {
    const { idToken, accessToken } = await this.getTokens();
    return idToken || accessToken || '';
  }

  async invoke<T = Record<string, unknown>>(functionName: string, data: Record<string, unknown>): Promise<T> {
    // Use proxy endpoint for finalize-session to avoid CORS issues
    const useProxy = functionName === 'finalize-session';
    const endpoint = useProxy
      ? `/api/lambda/${functionName}` // Use mobile app proxy
      : `${this.lambdaBaseUrl}/${functionName}`; // Direct Lambda call

    try {
      // For finalize-session, try ID token first, then fallback to access token on 401
      if (useProxy && functionName === 'finalize-session') {
        const { idToken, accessToken } = await this.getTokens();

        if (!idToken && !accessToken) {
          throw new Error('No tokens available for Lambda invocation');
        }

        // Try ID token first
        let token = idToken;
        let tokenType = 'ID';
        let attempt = 1;

        while (attempt <= 2) {
          if (!token) {
            // If no ID token on first attempt, skip to access token
            if (attempt === 1 && accessToken) {
              token = accessToken;
              tokenType = 'Access';
              attempt = 2;
            } else {
              throw new Error('No token available for Lambda invocation');
            }
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            const result = (await response.json()) as T;
            return result;
          }

          // If 401 and we have another token to try, retry
          if (response.status === 401 && attempt === 1 && accessToken && token === idToken) {
            console.warn(`⚠️ Lambda returned 401 with ${tokenType} token, retrying with Access token...`);
            token = accessToken;
            tokenType = 'Access';
            attempt = 2;
            continue;
          }

          // Otherwise, throw error
          const errorText = await response.text();
          throw new Error(`Lambda function ${functionName} failed with status ${response.status}: ${errorText}`);
        }
        // Unreachable – while loop always returns or throws, but satisfies TypeScript
        throw new Error(`Lambda function ${functionName} failed after all retry attempts`);
      } else {
        // For other functions, use standard token retrieval
        const token = await this.getAccessToken();

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        // Try to get response body as text first
        const rawText = await response.text();
        let parsedBody: T | null = null;

        try {
          parsedBody = rawText ? (JSON.parse(rawText) as T) : null;
        } catch {
          console.warn(`⚠️ Lambda response not valid JSON:`, rawText);
        }

        if (!response.ok) {
          console.error(`❌ Lambda HTTP error:`, {
            functionName,
            endpoint,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            bodyParsed: parsedBody,
            bodyRaw: rawText,
          });

          throw new Error(`Lambda function ${functionName} failed with status ${response.status} . Body: ${rawText}`);
        }

        return parsedBody as T;
      }
    } catch (error) {
      // Enhanced error logging for network/fetch failures
      console.error(`❌ Lambda function ${functionName} failed:`, error);
      console.error(`❌ Detailed error info:`, {
        functionName,
        endpoint,
        errorType: error?.constructor?.name,
        errorName: (error as Error)?.name,
        errorMessage: (error as Error)?.message,
        errorStack: (error as Error)?.stack,
        // Check if it's a network error
        isNetworkError: error instanceof TypeError,
        // Additional debugging info
        lambdaBaseUrl: this.lambdaBaseUrl,
      });

      // Re-throw with more context
      throw error;
    }
  }
}

// Main backendService service for browser environments
// Uses 'as unknown as BackendService' where needed – AWSBrowserFunctionsService
// has a direct-return invoke() vs the wrapped {data,error} FunctionService signature.
export class AWSBrowserBackendService {
  public database: DatabaseService;
  public auth: AuthService;
  public storage: StorageService;
  public realtime: RealtimeService;
  public functions: AWSBrowserFunctionsService;

  constructor(config: DatabaseConfig) {
    this.database = new AWSBrowserDatabaseService(config);
    this.auth = new AWSBrowserAuthService(config);
    this.functions = new AWSBrowserFunctionsService(config);

    // Make storage service optional - only create if S3 bucket is configured
    // Note: S3 is intentionally not configured - we stream to Rekognition directly
    // and don't persist raw media. This is expected behavior.
    if (config.s3BucketName) {
      this.storage = new AWSBrowserStorageService(config);
    } else {
      // Expected in production - no raw media persistence, direct API streaming instead
      const notConfigured = () => {
        throw new Error('S3 storage not configured');
      };
      this.storage = {
        upload: notConfigured,
        download: notConfigured,
        delete: notConfigured,
        getSignedUrl: notConfigured,
      } as unknown as StorageService;
    }
    this.realtime = new AWSBrowserRealtimeService(config);
  }
}
