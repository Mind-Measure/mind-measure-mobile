const navy = '#1B3A3A';
const teal = '#99CCCE';

interface ErrorModalProps {
  errorMessage: string;
  onRetry: () => void;
}

export function ErrorModal({ errorMessage, onRetry }: ErrorModalProps) {
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
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            Unable to Complete Baseline
          </h3>
        </div>

        {/* Body */}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <p
            style={{
              fontSize: '0.9375rem',
              color: navy,
              opacity: 0.6,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {errorMessage}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem 1.5rem',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onRetry}
            style={{
              padding: '0.625rem 1.5rem',
              fontSize: '0.875rem',
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
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
