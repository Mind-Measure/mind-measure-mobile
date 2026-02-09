import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PrivacyOverlay } from './PrivacyOverlay';

interface MobileSettingsProps {
  onNavigateBack: () => void;
}

export function MobileSettings({ onNavigateBack }: MobileSettingsProps) {
  const { signOut } = useAuth();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F5F5',
      paddingBottom: '100px'
    }}>
      {/* Header — clears dynamic island */}
      <div style={{
        backgroundColor: '#FFFFFF',
        padding: '72px 20px 24px 20px',
        borderBottom: '1px solid #F0F0F0'
      }}>
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
              color: '#666666'
            }}
          >
            &#8592;
          </button>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: 0
          }}>
            Settings
          </h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>

        {/* Legal & Privacy */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          marginBottom: '16px'
        }}>
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
              textAlign: 'left'
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
              textAlign: 'left'
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
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: '500' }}>Terms of Service</span>
            <span style={{ fontSize: '14px', color: '#999999' }}>&#8250;</span>
          </button>
        </div>

        {/* Sign Out */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
        }}>
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
              opacity: signingOut ? 0.6 : 1
            }}
          >
            <span style={{ fontSize: '15px', color: '#E53E3E', fontWeight: '500' }}>
              {signingOut ? 'Signing Out...' : 'Sign Out'}
            </span>
          </button>
        </div>
      </div>

      <PrivacyOverlay isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </div>
  );
}
