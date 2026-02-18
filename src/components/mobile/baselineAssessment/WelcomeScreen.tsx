import mindMeasureLogo from '../../../assets/66710e04a85d98ebe33850197f8ef41bd28d8b84.png';

interface WelcomeScreenProps {
  requestingPermissions: boolean;
  onStart: () => void;
}

const BULLET_POINTS = [
  'Five questions',
  '3-5 minutes max',
  'We use your camera so make sure you are looking at the screen',
  'We analyse your voice to understand your mood',
  'We delete any voice and images we collect as soon as we have analysed them',
];

export function WelcomeScreen({ requestingPermissions, onStart }: WelcomeScreenProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F5F5',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '20px',
          paddingTop: '80px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {/* Logo */}
        <img
          src={mindMeasureLogo}
          alt="Mind Measure"
          style={{
            width: '80px',
            height: '80px',
            marginBottom: '20px',
          }}
        />

        <h1
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 32px 0',
            textAlign: 'center',
          }}
        >
          Start your wellness journey
        </h1>

        {/* What to Expect Card */}
        <div
          style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
            marginBottom: '24px',
            width: '100%',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: '0 0 24px 0',
              textAlign: 'center',
            }}
          >
            What to expect
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {BULLET_POINTS.map((text) => (
              <div
                key={text}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#1a1a1a',
                    marginTop: '8px',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: '15px',
                    color: '#1a1a1a',
                    lineHeight: '1.6',
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Assessment Button */}
        <button
          onClick={onStart}
          disabled={requestingPermissions}
          style={{
            width: '100%',
            padding: '16px',
            background: requestingPermissions ? '#cccccc' : '#2D4C4C',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: requestingPermissions ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 12px rgba(45, 76, 76, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            opacity: requestingPermissions ? 0.5 : 1,
          }}
          onMouseOver={(e) => {
            if (!requestingPermissions) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(45, 76, 76, 0.4)';
            }
          }}
          onMouseOut={(e) => {
            if (!requestingPermissions) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 76, 76, 0.3)';
            }
          }}
        >
          {requestingPermissions ? (
            <>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Requesting Permissions...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Let&apos;s Get Started
            </>
          )}
        </button>
      </div>
    </div>
  );
}
