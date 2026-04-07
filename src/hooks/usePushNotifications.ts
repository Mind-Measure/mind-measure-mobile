/**
 * usePushNotifications
 *
 * Requests push notification permission and registers the FCM/APNs
 * device token with the Mind Measure backend once the user is signed in.
 *
 * Runs on mount when userId is provided. Safe to call multiple times —
 * the backend upserts the token so re-registration is idempotent.
 */

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { cognitoApiClient } from '@/services/cognito-api-client';

function getApiBase(): string {
  const isCapacitor = Capacitor.isNativePlatform();
  return import.meta.env.VITE_API_BASE_URL || (isCapacitor ? 'https://admin.mindmeasure.co.uk/api' : '/api');
}

async function registerTokenWithBackend(token: string, platform: 'ios' | 'android'): Promise<void> {
  const authToken = await cognitoApiClient.getIdToken();
  if (!authToken) return;

  try {
    await fetch(`${getApiBase()}/push/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token, platform }),
    });
  } catch (err) {
    console.error('[usePushNotifications] Failed to register token:', err);
  }
}

export function usePushNotifications(userId: string | undefined): void {
  useEffect(() => {
    if (!userId) return;
    if (!Capacitor.isNativePlatform()) return;

    const platform = Capacitor.getPlatform() as 'ios' | 'android';

    const setup = async () => {
      try {
        // Check current permission state before requesting
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[usePushNotifications] Permission not granted');
          return;
        }

        await PushNotifications.register();
      } catch (err) {
        console.error('[usePushNotifications] Registration error:', err);
      }
    };

    // Listen for successful token registration
    const registrationListener = PushNotifications.addListener('registration', (token) => {
      registerTokenWithBackend(token.value, platform).catch(() => {});
    });

    const errorListener = PushNotifications.addListener('registrationError', (err) => {
      console.error('[usePushNotifications] FCM registration error:', err.error);
    });

    setup();

    return () => {
      registrationListener.then((l) => l.remove());
      errorListener.then((l) => l.remove());
    };
  }, [userId]);
}
