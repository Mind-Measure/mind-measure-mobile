/**
 * One-time welcome modal for open-access (non-university) users.
 * Explains they have the full Mind Measure experience minus institution-specific content.
 */

import { useState } from 'react';

const C = {
  spectra: '#2D4C4C',
  sinbad: '#99CCCE',
  pampas: '#FAF9F7',
  white: '#FFFFFF',
};

export interface OpenAccessWelcomeModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function OpenAccessWelcomeModal({ isOpen, onDismiss }: OpenAccessWelcomeModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen && !isClosing) return null;

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onDismiss();
    }, 280);
  };

  const features = [
    { label: 'Daily check-ins', desc: 'Talk to Jodie about how you\u2019re feeling' },
    { label: 'Wellbeing tracking', desc: 'See your mood trends and streaks' },
    { label: 'Articles & support', desc: 'Browse wellbeing content and resources' },
    { label: 'Buddy system', desc: 'Share your journey with friends' },
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
      onClick={handleDismiss}
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
            onClick={handleDismiss}
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke={C.spectra}
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div
            style={{
              fontSize: '44px',
              fontWeight: 900,
              color: C.spectra,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              marginBottom: '8px',
            }}
          >
            Welcome.
          </div>
          <p style={{ fontSize: '16px', fontWeight: 400, color: C.spectra, opacity: 0.7, margin: 0, lineHeight: 1.4 }}>
            Mind Measure is designed for universities, but the core experience is open to everyone.
          </p>
        </div>

        {/* Features */}
        <div style={{ padding: '24px 28px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: C.sinbad,
                    flexShrink: 0,
                    marginTop: '6px',
                  }}
                />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: C.spectra, lineHeight: 1.3 }}>{f.label}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(45,76,76,0.55)', lineHeight: 1.4, marginTop: '2px' }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership note */}
        <div style={{ padding: '20px 28px 0' }}>
          <div
            style={{
              backgroundColor: `${C.sinbad}20`,
              borderRadius: '16px',
              padding: '16px 18px',
            }}
          >
            <p style={{ fontSize: '13px', color: 'rgba(45,76,76,0.6)', margin: 0, lineHeight: 1.5 }}>
              University-specific support services and targeted content become available when your institution partners
              with Mind Measure.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '24px 28px 28px' }}>
          <button
            type="button"
            onClick={handleDismiss}
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
              letterSpacing: '-0.01em',
            }}
          >
            Let's go
          </button>
        </div>
      </div>
    </div>
  );
}
