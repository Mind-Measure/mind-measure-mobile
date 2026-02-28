// Re-export signin handler — avoids duplicate auth logic; clients may hit either /api/auth/login or /api/auth/signin
export { default } from './signin';
