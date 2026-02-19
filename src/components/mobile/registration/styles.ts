import type React from 'react';

export const containerStyle: React.CSSProperties = {
  minHeight: '100dvh',
  backgroundColor: '#F5F5F5',
  padding: '20px',
  paddingBottom: '120px',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
};

export const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  marginBottom: '20px',
};

export const buttonPrimaryStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  background: '#2D4C4C',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(45, 76, 76, 0.3)',
  transition: 'all 0.2s',
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '16px',
  border: '2px solid #E5E7EB',
  borderRadius: '12px',
  outline: 'none',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
