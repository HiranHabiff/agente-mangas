import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// react-grab em desenvolvimento (equivalente ao <Script strategy="lazyOnload"> do Next)
if (import.meta.env.DEV) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/react-grab@latest/dist/index.global.js';
  script.async = true;
  document.body.appendChild(script);
}
