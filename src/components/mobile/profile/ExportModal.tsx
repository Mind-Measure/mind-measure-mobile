interface ExportModalProps {
  userEmail: string;
  exportPeriod: 14 | 30 | 90;
  setExportPeriod: (period: 14 | 30 | 90) => void;
  isExporting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ExportModal({
  userEmail,
  exportPeriod,
  setExportPeriod,
  isExporting,
  onCancel,
  onConfirm,
}: ExportModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
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
      >
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 16px 0',
          }}
        >
          Email Wellbeing Report
        </h3>

        <p
          style={{
            fontSize: '14px',
            color: '#666666',
            margin: '0 0 20px 0',
            lineHeight: '1.6',
          }}
        >
          We'll email a detailed wellbeing report to <strong>{userEmail}</strong> including your check-in history,
          scores, themes, and AI-generated summary.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#1a1a1a',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            Time Period
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {([14, 30, 90] as const).map((period) => (
              <label
                key={period}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: `2px solid ${exportPeriod === period ? '#2D4C4C' : '#E0E0E0'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: exportPeriod === period ? '#F0F7FF' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="period"
                  value={String(period)}
                  checked={exportPeriod === period}
                  onChange={() => setExportPeriod(period)}
                  style={{ marginRight: '12px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                  {period === 14 ? 'Last 14 Days' : period === 30 ? 'Last Month (30 Days)' : 'Last 3 Months (90 Days)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            disabled={isExporting}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              background: 'white',
              color: '#666666',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isExporting ? 'default' : 'pointer',
              opacity: isExporting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isExporting}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '8px',
              background: '#2D4C4C',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isExporting ? 'default' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
            }}
          >
            {isExporting ? 'Sending...' : 'Email Report to Me'}
          </button>
        </div>
      </div>
    </div>
  );
}
