interface BottomNavProps {
  activeView: 'home' | 'content' | 'buddies' | 'profile';
  onViewChange: (view: 'home' | 'content' | 'buddies' | 'profile') => void;
}

export function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const navItems = [
    {
      id: 'home' as const,
      label: 'Home',
      pathData: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
    },
    {
      id: 'content' as const,
      label: 'Content',
      pathData:
        'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
    },
    {
      id: 'buddies' as const,
      label: 'Buddies',
      pathData:
        'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
      circles: [{ cx: 9, cy: 7, r: 4 }],
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      pathData: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2',
      circles: [{ cx: 12, cy: 7, r: 4 }],
    },
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '1px solid #E5E7EB',
        padding: '8px 0',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      {navItems.map((item) => {
        const isActive = activeView === item.id;
        const color = isActive ? '#F59E0B' : 'rgba(45,76,76,0.25)';
        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 16px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color,
              flex: 1,
              maxWidth: '100px',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {item.pathData.split(' M').map((seg, i) => (
                <path key={i} d={i === 0 ? seg : `M${seg}`} />
              ))}
              {item.circles?.map((c, i) => (
                <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
              ))}
            </svg>
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '9px',
                fontWeight: isActive ? 600 : 300,
                letterSpacing: '0.05em',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
