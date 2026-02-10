import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './assets/chillax-font.css';

createRoot(document.getElementById('root')!).render(<App />);

// Register service worker for image caching and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — non-critical, app works without it
    });
  });
}
