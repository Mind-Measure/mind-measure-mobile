interface ErrorModalProps {
  errorMessage: string;
  onCancel: () => void;
  onRetry: () => void;
}

export function ErrorModal({ errorMessage, onCancel, onRetry }: ErrorModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          maxWidth: '28rem',
          width: '100%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#111827',
              margin: 0,
            }}
          >
            Unable to Complete Baseline
          </h3>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '1.5rem',
          }}
        >
          <p
            style={{
              color: '#6b7280',
              lineHeight: '1.6',
              margin: 0,
            }}
          >
            {errorMessage}
          </p>
        </div>

        {/* Footer - Buttons */}
        <div
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#f9fafb',
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#6b7280',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Cancel
          </button>

          <button
            onClick={onRetry}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'white',
              background: 'linear-gradient(to right, #a855f7, #3b82f6)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
