import React, { useState } from 'react';
import { X } from 'lucide-react';

const pampas = '#FAF9F7';
const spectra = '#2D4C4C';
const sinbad = '#99CCCE';

interface PrivacyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyTerms: React.FC<PrivacyOverlayProps> = ({ isOpen, onClose }) => {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const handleClose = () => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onClose();
      setIsAnimatingOut(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(45, 76, 76, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        opacity: isAnimatingOut ? 0 : 1,
        transition: 'opacity 300ms ease-out',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: pampas,
          borderRadius: '24px',
          maxWidth: '440px',
          width: '100%',
          maxHeight: '85vh',
          overflow: 'hidden',
          position: 'relative',
          transform: isAnimatingOut ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 300ms ease-out',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: sinbad,
            padding: '32px 24px 24px',
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
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
            <X size={18} color={spectra} />
          </button>

          {/* Shield icon */}
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={spectra}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: 400,
              color: spectra,
              textAlign: 'center',
              margin: '0 0 6px 0',
              fontFamily: 'Lato, system-ui, sans-serif',
            }}
          >
            Your privacy, clearly explained
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: spectra,
              textAlign: 'center',
              margin: 0,
              opacity: 0.7,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Mind Measure is designed so you can reflect on your wellbeing without being monitored.
          </p>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            fontFamily: 'Lato, system-ui, sans-serif',
          }}
        >
          {/* What we collect */}
          <Section title="What we collect">
            <BulletList
              items={[
                'Voluntary check-ins you choose to complete',
                'This may include text, audio, or video, depending on the check-in',
                'These inputs are used only for automated analysis within the app',
              ]}
            />
          </Section>

          {/* What your university can see */}
          <Section title="What your university can see">
            <BulletList
              items={[
                'Aggregated trends only, across groups of students',
                'No individual data',
                'No recordings, responses, or scores',
              ]}
            />
            <p style={{ fontSize: '14px', color: spectra, lineHeight: 1.6, margin: '12px 0 0 0', fontWeight: 600 }}>
              There is no way for your university to see your personal check-ins.
            </p>
          </Section>

          {/* What we don't do */}
          <Section title="What we don't do">
            <BulletList
              items={[
                "We don't diagnose or provide medical advice",
                "We don't monitor individuals",
                "We don't sell or share your data for advertising",
              ]}
            />
            <p
              style={{
                fontSize: '13px',
                color: spectra,
                lineHeight: 1.6,
                margin: '12px 0 0 0',
                fontStyle: 'italic',
                opacity: 0.5,
              }}
            >
              Mind Measure is not a clinical or surveillance tool.
            </p>
          </Section>

          {/* Your control */}
          <Section title="Your control" last>
            <BulletList
              items={[
                'Participation is voluntary',
                'You can stop using the app at any time',
                'You can request deletion of your data',
              ]}
            />
          </Section>

          {/* Learn more links */}
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginTop: '20px',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                fontWeight: 500,
                color: spectra,
                margin: '0 0 8px 0',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Learn more
            </p>
            <p style={{ fontSize: '13px', color: spectra, margin: '0 0 12px 0', opacity: 0.45 }}>Read our full:</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="https://mindmeasure.co.uk/privacy"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '13px',
                  color: sinbad,
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Privacy Policy
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              <span style={{ color: '#D1D5DB' }}>|</span>
              <a
                href="https://mindmeasure.co.uk/terms"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '13px',
                  color: sinbad,
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Terms of Service
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Got it button */}
          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: sinbad,
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              color: spectra,
              cursor: 'pointer',
              marginTop: '20px',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 4px 12px rgba(153, 204, 206, 0.3)',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ────────────────────────────────────── */

const spectraColor = '#2D4C4C';

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : '24px' }}>
      <h3
        style={{
          fontSize: '16px',
          fontWeight: 500,
          color: spectraColor,
          margin: '0 0 8px 0',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: '20px' }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: spectraColor,
            opacity: 0.6,
            marginBottom: i < items.length - 1 ? '6px' : 0,
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
