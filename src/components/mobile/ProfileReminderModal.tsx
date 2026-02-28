/**
 * Post-baseline modal: encourages user to complete profile and add buddies.
 */

import { useState } from 'react';

const C = {
  spectra: '#2D4C4C',
  sinbad: '#99CCCE',
  pampas: '#FAF9F7',
  buttercup: '#F59E0B',
  white: '#FFFFFF',
};

export interface ProfileReminderModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function ProfileReminderModal({ isOpen, onComplete, onSkip }: ProfileReminderModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleSkip = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onSkip();
    }, 280);
  };

  const handleComplete = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onComplete();
    }, 280);
  };

  const benefits = [
    { label: 'Personalised insights', desc: 'Tailored to your course and year' },
    { label: 'Accurate tracking', desc: 'Better context for your check-ins' },
    { label: 'Buddy support', desc: 'Share your journey with friends' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
        opacity: isClosing ? 0 : 1,
        transition: 'opacity 0.28s ease',
      }}
      onClick={handleSkip}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: C.pampas,
          borderRadius: '28px',
          maxWidth: '380px',
          width: '100%',
          overflow: 'hidden',
          transform: isClosing ? 'translateY(20px) scale(0.97)' : 'translateY(0) scale(1)',
          opacity: isClosing ? 0 : 1,
          transition: 'transform 0.28s ease, opacity 0.28s ease',
        }}
      >
        {/* Header */}
        <div style={{ backgroundColor: C.sinbad, padding: '36px 28px 28px', position: 'relative' }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(45, 76, 76, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.spectra} strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div style={{ fontSize: '48px', fontWeight: 900, color: C.spectra, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}>
            You're in.
          </div>
          <p style={{ fontSize: '16px', fontWeight: 400, color: C.spectra, opacity: 0.7, margin: 0, lineHeight: 1.4 }}>
            Baseline complete. Two quick things to get the most from Mind Measure.
          </p>
        </div>

        {/* Steps */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: C.spectra, color: C.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, flexShrink: 0, marginTop: '2px',
              }}>1</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: C.spectra, lineHeight: 1.3 }}>
                  Fill in your profile
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(45,76,76,0.55)', lineHeight: 1.4, marginTop: '2px' }}>
                  Year of study and course — takes 30 seconds
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: C.spectra, color: C.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, flexShrink: 0, marginTop: '2px',
              }}>2</div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: C.spectra, lineHeight: 1.3 }}>
                  Add a buddy
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(45,76,76,0.55)', lineHeight: 1.4, marginTop: '2px' }}>
                  Invite a friend to share your wellbeing journey
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ padding: '20px 28px 0' }}>
          <div style={{
            backgroundColor: `${C.sinbad}20`,
            borderRadius: '16px',
            padding: '16px 18px',
          }}>
            {benefits.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '8px 0',
                borderBottom: i < benefits.length - 1 ? '1px solid rgba(45,76,76,0.06)' : 'none',
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: C.sinbad, flexShrink: 0,
                }} />
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: C.spectra }}>{b.label}</span>
                  <span style={{ fontSize: '13px', color: 'rgba(45,76,76,0.5)', marginLeft: '6px' }}>{b.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '24px 28px 28px' }}>
          <button
            type="button"
            onClick={handleComplete}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: C.spectra,
              border: 'none',
              borderRadius: '16px',
              color: C.white,
              fontSize: '17px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '8px',
              letterSpacing: '-0.01em',
            }}
          >
            Go to Profile
          </button>

          <button
            type="button"
            onClick={handleSkip}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              color: 'rgba(45,76,76,0.45)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
}
