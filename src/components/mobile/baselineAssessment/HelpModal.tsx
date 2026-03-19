const navy = '#1B3A3A';
const teal = '#99CCCE';

interface HelpModalProps {
  onBack: () => void;
}

export function HelpModal({ onBack }: HelpModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '1.25rem',
          maxWidth: '26rem',
          width: '100%',
          boxShadow: '0 24px 40px rgba(0, 0, 0, 0.18)',
          overflow: 'hidden',
          fontFamily: 'Lato, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
          <h3
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: navy,
              margin: '0 0 4px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Just two minutes with Jodie
          </h3>
          <p
            style={{
              fontSize: '0.8125rem',
              color: navy,
              opacity: 0.4,
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
            }}
          >
            Five questions — that's all
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <p
            style={{
              fontSize: '0.9375rem',
              color: navy,
              opacity: 0.65,
              lineHeight: 1.65,
              margin: '0 0 1.25rem',
            }}
          >
            No worries — Jodie just needs a couple of minutes with you. She'll ask five short questions about how you've
            been feeling lately.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              'Answer each question out loud',
              'Wait for Jodie to finish speaking before you reply',
              "Press Finish once she's asked all five",
            ].map((tip, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: teal,
                    opacity: 0.7,
                    marginTop: 7,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    fontSize: '0.9rem',
                    color: navy,
                    opacity: 0.6,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {tip}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <button
            onClick={onBack}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              fontWeight: 600,
              color: navy,
              backgroundColor: teal,
              border: 'none',
              borderRadius: '0.75rem',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: '0 4px 16px rgba(153,204,206,0.35)',
            }}
          >
            Let's try again
          </button>
        </div>
      </div>
    </div>
  );
}
