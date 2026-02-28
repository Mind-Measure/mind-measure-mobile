// Re-export signup handler — avoids duplicate auth logic; clients may hit either /api/auth/register or /api/auth/signup
export { default } from './signup';
