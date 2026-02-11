// Local Backend Service using Capacitor Preferences for storage
// This provides a local-first backend that doesn't require AWS or network connectivity

import { Preferences } from '@capacitor/preferences';
import {
  BackendService,
  DatabaseService,
  AuthService,
  StorageService,
  RealtimeService,
  DatabaseResult,
  InsertResult,
  DeleteResult,
  FunctionService,
  QueryOptions,
} from './DatabaseService';

// Local Database Service using Capacitor Preferences
class LocalDatabaseService implements DatabaseService {
  constructor() {}

  async select<T = Record<string, unknown>>(table: string, options?: QueryOptions): Promise<DatabaseResult<T>> {
    try {
      // Get data from Capacitor Preferences
      const { value } = await Preferences.get({ key: `table_${table}` });
      let data: T[] = value ? JSON.parse(value) : [];

      // Apply filters
      if (options?.filters) {
        data = data.filter((item) => {
          return Object.entries(options.filters!).every(([key, filterVal]) => {
            // Handle QueryFilter (could be object with operator or a primitive)
            const actualValue =
              typeof filterVal === 'object' && filterVal !== null && 'operator' in filterVal
                ? filterVal.value
                : filterVal;
            return (item as Record<string, unknown>)[key] === actualValue;
          });
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        data.sort((a, b) => {
          for (const order of options.orderBy!) {
            const aVal = (a as Record<string, unknown>)[order.column];
            const bVal = (b as Record<string, unknown>)[order.column];
            const ascending = order.ascending !== false;

            if ((aVal as string) < (bVal as string)) return ascending ? -1 : 1;
            if ((aVal as string) > (bVal as string)) return ascending ? 1 : -1;
          }
          return 0;
        });
      }

      // Apply limit and offset
      if (options?.offset) {
        data = data.slice(options.offset);
      }
      if (options?.limit) {
        data = data.slice(0, options.limit);
      }

      return { data, error: null };
    } catch (error: unknown) {
      console.error('❌ Local select error:', error);
      return { data: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async insert<T = Record<string, unknown>>(
    table: string,
    data: Partial<T> | Partial<T>[],
    _options?: Record<string, unknown>
  ): Promise<InsertResult<T> | DatabaseResult<T>> {
    try {
      // Get existing data
      const { value } = await Preferences.get({ key: `table_${table}` });
      const existingData: T[] = value ? JSON.parse(value) : [];

      // Prepare new data
      const newData = Array.isArray(data) ? data : [data];
      const insertedData: T[] = [];

      for (const item of newData) {
        // Add ID and timestamps if not present
        const newItem = {
          id: (item as Record<string, unknown>).id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: (item as Record<string, unknown>).created_at || new Date().toISOString(),
          updated_at: (item as Record<string, unknown>).updated_at || new Date().toISOString(),
          ...item,
        } as T;

        existingData.push(newItem);
        insertedData.push(newItem);
      }

      // Save back to storage
      await Preferences.set({
        key: `table_${table}`,
        value: JSON.stringify(existingData),
      });

      // Return as DatabaseResult (data is T[])
      return { data: insertedData, error: null } as DatabaseResult<T>;
    } catch (error: unknown) {
      console.error('❌ Local insert error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' } as DatabaseResult<T>;
    }
  }

  async update<T = Record<string, unknown>>(
    table: string,
    data: Partial<T>,
    filtersOrOptions?: Record<string, unknown>
  ): Promise<DatabaseResult<T>> {
    try {
      // Get existing data
      const { value } = await Preferences.get({ key: `table_${table}` });
      let existingData: T[] = value ? JSON.parse(value) : [];
      const filters = filtersOrOptions ?? {};

      // Find and update matching rows
      const updatedData: T[] = [];

      existingData = existingData.map((item) => {
        const matches = Object.entries(filters).every(([key, value]) => {
          return (item as Record<string, unknown>)[key] === value;
        });

        if (matches) {
          const updatedItem = {
            ...item,
            ...data,
            updated_at: new Date().toISOString(),
          } as T;
          updatedData.push(updatedItem);
          return updatedItem;
        }
        return item;
      });

      // Save back to storage
      await Preferences.set({
        key: `table_${table}`,
        value: JSON.stringify(existingData),
      });

      return { data: updatedData, error: null };
    } catch (error: unknown) {
      console.error('❌ Local update error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async delete<T = Record<string, unknown>>(
    table: string,
    filtersOrOptions?: Record<string, unknown>
  ): Promise<DeleteResult<T> | DatabaseResult<void>> {
    try {
      // Get existing data
      const { value } = await Preferences.get({ key: `table_${table}` });
      let existingData: Record<string, unknown>[] = value ? JSON.parse(value) : [];
      const filters = filtersOrOptions ?? {};

      // Filter out matching rows
      existingData = existingData.filter((item) => {
        return !Object.entries(filters).every(([key, value]) => {
          return item[key] === value;
        });
      });

      // Save back to storage
      await Preferences.set({
        key: `table_${table}`,
        value: JSON.stringify(existingData),
      });

      return { error: null };
    } catch (error: unknown) {
      console.error('❌ Local delete error:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test basic Preferences functionality
      await Preferences.set({ key: 'health_check', value: 'ok' });
      const { value } = await Preferences.get({ key: 'health_check' });
      await Preferences.remove({ key: 'health_check' });
      return value === 'ok';
    } catch {
      return false;
    }
  }
}

// Local Auth Service (mock implementation)
class LocalAuthService implements AuthService {
  async signUp(
    email: string | { email: string; password: string; firstName?: string; lastName?: string },
    _password?: string,
    _options?: Record<string, unknown>
  ): Promise<{ user?: null; data?: Record<string, unknown> | null; error: string | null }> {
    const userEmail = typeof email === 'string' ? email : email.email;
    // Mock successful signup
    return {
      data: {
        user: {
          id: `local_${Date.now()}`,
          email: userEmail,
          email_confirmed_at: new Date().toISOString(),
        },
      },
      error: null,
    };
  }

  async signIn(
    email: string | { email: string; password: string },
    _password?: string
  ): Promise<{ user?: null; data?: Record<string, unknown> | null; error: string | null }> {
    const userEmail = typeof email === 'string' ? email : email.email;
    // Mock successful signin
    return {
      data: {
        user: {
          id: `local_${Date.now()}`,
          email: userEmail,
          email_confirmed_at: new Date().toISOString(),
        },
      },
      error: null,
    };
  }

  async signOut(): Promise<{ error: string | null }> {
    return { error: null };
  }

  async getCurrentUser(): Promise<{ user?: null; data?: null; error: string | null }> {
    return { data: null, user: null, error: null };
  }

  async resetPassword(_email: string): Promise<{ error: string | null }> {
    return { error: null };
  }

  async resendConfirmationCode(_email: string): Promise<{ error: string | null }> {
    return { error: null };
  }
}

// Local Storage Service (mock implementation)
class LocalStorageService implements StorageService {
  async upload(
    _bucket: string,
    path: string,
    _file: File | Blob,
    _options?: { contentType?: string; metadata?: Record<string, string> }
  ): Promise<{ url?: string; key?: string; error: string | null }> {
    return { url: `local://file/${path}`, key: path, error: null };
  }

  async download(_bucket: string, _path: string): Promise<{ data: Blob | null; error: string | null }> {
    return { data: null, error: 'Local storage download not implemented' };
  }

  async delete(_bucket: string, _path: string): Promise<{ error: string | null }> {
    return { error: null };
  }

  async getSignedUrl(
    _bucket: string,
    path: string,
    _expiresIn?: number
  ): Promise<{ url: string | null; error: string | null }> {
    return { url: `local://file/${path}`, error: null };
  }
}

// Local Realtime Service (mock implementation)
class LocalRealtimeService implements RealtimeService {
  subscribe<T = Record<string, unknown>>(
    _table: string,
    _options?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      schema?: string;
      filter?: string;
    },
    _callback?: (payload: {
      eventType: string;
      new: T;
      old: T;
      errors: Array<{ message: string; code?: string }>;
    }) => void
  ): { unsubscribe: () => void } {
    return { unsubscribe: () => {} };
  }

  removeAllSubscriptions(): void {}
}

// Local Functions Service (mock implementation)
class LocalFunctionsService implements FunctionService {
  async invoke<T = Record<string, unknown>>(
    functionName: string,
    _payload?: Record<string, unknown>
  ): Promise<{ data: T | null; error: string | null }> {
    // Mock some common function responses
    if (functionName === 'analyze-baseline') {
      return {
        data: {
          score: Math.floor(Math.random() * 30) + 70, // Random score 70-100
          analysis: 'Local mock analysis completed',
          timestamp: new Date().toISOString(),
        } as T,
        error: null,
      };
    }

    return {
      data: { message: 'Local function executed successfully' } as T,
      error: null,
    };
  }
}

// Main Local Backend Service
export class LocalBackendService implements BackendService {
  public database: DatabaseService;
  public auth: AuthService;
  public storage: StorageService;
  public realtime: RealtimeService;
  public functions: FunctionService;

  constructor() {
    this.database = new LocalDatabaseService();
    this.auth = new LocalAuthService();
    this.storage = new LocalStorageService();
    this.realtime = new LocalRealtimeService();
    this.functions = new LocalFunctionsService();
  }
}
