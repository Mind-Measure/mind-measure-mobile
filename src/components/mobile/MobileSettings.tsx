import { useState, useEffect } from 'react';
import { Preferences } from '@capacitor/preferences';
import { useAuth } from '@/contexts/AuthContext';
import { cognitoApiClient } from '@/services/cognito-api-client';
import { PrivacyOverlay } from './PrivacyOverlay';

interface MobileSettingsProps {
  onNavigateBack: () => void;
}

function getApiBase(): string {
  const isCapacitor =
    window.location.protocol === 'capacitor:' || !!(window as unknown as { Capacitor?: unknown }).Capacitor;
  return import.meta.env.VITE_API_BASE_URL || (isCapacitor ? 'https://mobile.mindmeasure.app/api' : '/api');
}

export function MobileSettings({ onNavigateBack }: MobileSettingsProps) {
  const { signOut } = useAuth();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Weekly reflection opt-out
  const [reflectionOptedOut, setReflectionOptedOut] = useState(false);
  const [reflectionLoading, setReflectionLoading] = useState(true);
  const [reflectionSaving, setReflectionSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const token = await cognitoApiClient.getIdToken();
        if (!token) return;
        const res = await fetch(`${getApiBase()}/profile/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { weekly_reflection_opted_out: boolean };
          setReflectionOptedOut(data.weekly_reflection_opted_out);
        }
      } catch {
        // Non-critical — leave default false
      } finally {
        setReflectionLoading(false);
      }
    }
    void loadSettings();
  }, []);

  const handleToggleReflection = async () => {
    const newValue = !reflectionOptedOut;
    setReflectionOptedOut(newValue);
    setReflectionSaving(true);
    try {
      const token = await cognitoApiClient.getIdToken();
      if (!token) return;
      await fetch(`${getApiBase()}/profile/settings`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ weekly_reflection_opted_out: newValue }),
      });
    } catch {
      // Revert on failure
      setReflectionOptedOut(!newValue);
    } finally {
      setReflectionSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const token = await cognitoApiClient.getIdToken();
      if (!token) {
        setDeleteError('Not authenticated. Please sign in and try again.');
        setIsDeleting(false);
        return;
      }

      const isCapacitor =
        window.location.protocol === 'capacitor:' || !!(window as unknown as { Capacitor?: unknown }).Capacitor;
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || (isCapacitor ? 'https://mobile.mindmeasure.app/api' : '/api');

      const response = await fetch(`${apiBase}/user/delete-account`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || `Request failed (${response.status})`);
      }

      // Clear all local data
      await Preferences.clear();

      // Sign out (clears tokens)
      await signOut();
    } catch (error: unknown) {
      console.error('Delete account error:', error);
      setDeleteError((error as Error).message || 'Something went wrong. Please try again or contact support.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
        paddingBottom: '100px',
      }}
    >
      {/* Header — clears dynamic island */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '72px 20px 24px 20px',
          borderBottom: '1px solid #F0F0F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onNavigateBack}
            style={{
              background: '#F5F5F5',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#666666',
            }}
          >
            &#8592;
          </button>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Settings
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {/* Legal & Privacy */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={() => setShowPrivacy(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '16px 20px',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #F0F0F0',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '500' }}>Your Privacy</span>
            <span style={{ fontSize: '14px', color: '#999999' }}>&#8250;</span>
          </button>

          <button
            onClick={() => window.open('https://mindmeasure.co.uk/privacy', '_blank')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '16px 20px',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid #F0F0F0',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '500' }}>Privacy Policy</span>
            <span style={{ fontSize: '14px', color: '#999999' }}>&#8250;</span>
          </button>

          <button
            onClick={() => window.open('https://mindmeasure.co.uk/terms', '_blank')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '16px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '500' }}>Terms of Service</span>
            <span style={{ fontSize: '14px', color: '#999999' }}>&#8250;</span>
          </button>
        </div>

        {/* Emails & Notifications */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            marginBottom: '16px',
          }}
        >
          <div style={{ padding: '12px 20px 4px', borderBottom: '1px solid #F0F0F0' }}>
            <p
              style={{
                margin: 0,
                fontSize: '11px',
                fontWeight: '600',
                color: '#999',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
              }}
            >
              Emails
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              opacity: reflectionLoading ? 0.5 : 1,
            }}
          >
            <div style={{ flex: 1, paddingRight: '12px' }}>
              <p style={{ margin: '0 0 2px', fontSize: '15px', color: '#1a1a1a', fontWeight: '500' }}>
                Weekly Reflection
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#999', lineHeight: '1.5' }}>
                A personalised summary of your week, every Sunday
              </p>
            </div>
            {/* Toggle switch */}
            <button
              onClick={handleToggleReflection}
              disabled={reflectionLoading || reflectionSaving}
              aria-checked={!reflectionOptedOut}
              role="switch"
              style={{
                width: '44px',
                height: '26px',
                borderRadius: '13px',
                border: 'none',
                cursor: reflectionLoading || reflectionSaving ? 'default' : 'pointer',
                background: reflectionOptedOut ? '#E5E7EB' : '#2D4A4A',
                position: 'relative',
                flexShrink: 0,
                transition: 'background 0.2s',
                padding: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: reflectionOptedOut ? '3px' : '21px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            marginBottom: '16px',
          }}
        >
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '16px 20px',
              background: 'none',
              border: 'none',
              cursor: signingOut ? 'default' : 'pointer',
              textAlign: 'center',
              opacity: signingOut ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: '15px', color: '#E53E3E', fontWeight: '500' }}>
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </span>
          </button>
        </div>

        {/* Delete Account */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <button
            onClick={() => {
              setShowDeleteConfirm(true);
              setDeleteStep(1);
              setDeleteError(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '16px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '15px', color: '#E53E3E', fontWeight: '500' }}>Delete My Account</span>
          </button>
        </div>
      </div>

      <PrivacyOverlay isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => {
            if (!isDeleting) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {deleteStep === 1 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px 0' }}>
                  Delete your account?
                </h3>
                <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 16px 0', lineHeight: '1.6' }}>
                  This will permanently delete:
                </p>
                <ul
                  style={{
                    margin: '0 0 20px 0',
                    padding: '0 0 0 18px',
                    fontSize: '14px',
                    color: '#666666',
                    lineHeight: '1.8',
                  }}
                >
                  <li>All your check-in conversations and scores</li>
                  <li>Your mood ratings and insights</li>
                  <li>Your wellbeing reports</li>
                  <li>Your buddy connections</li>
                  <li>Your profile and account</li>
                </ul>
                <p style={{ fontSize: '13px', color: '#E53E3E', fontWeight: '500', margin: '0 0 20px 0' }}>
                  This cannot be undone.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={() => setDeleteStep(2)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: '1.5px solid #E53E3E',
                      borderRadius: '10px',
                      background: 'white',
                      color: '#E53E3E',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    I understand, continue
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '10px',
                      background: '#F5F5F5',
                      color: '#666666',
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#E53E3E', margin: '0 0 12px 0' }}>
                  Are you absolutely sure?
                </h3>
                <p style={{ fontSize: '14px', color: '#666666', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  All your data will be permanently removed from our servers. You will not be able to recover your
                  account, scores, or conversation history.
                </p>

                {deleteError && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      fontSize: '13px',
                      color: '#991B1B',
                      lineHeight: '1.5',
                    }}
                  >
                    {deleteError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '10px',
                      background: '#E53E3E',
                      color: 'white',
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: isDeleting ? 'default' : 'pointer',
                      opacity: isDeleting ? 0.7 : 1,
                    }}
                  >
                    {isDeleting ? 'Deleting everything...' : 'Delete everything permanently'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteStep(1);
                    }}
                    disabled={isDeleting}
                    style={{
                      width: '100%',
                      padding: '14px',
                      border: 'none',
                      borderRadius: '10px',
                      background: '#F5F5F5',
                      color: '#666666',
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: isDeleting ? 'default' : 'pointer',
                      opacity: isDeleting ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
