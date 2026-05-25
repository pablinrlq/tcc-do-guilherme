/** Ponto de entrada da aplicação React. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/main.scss';

// PWA: instala/atualiza o service worker (no-op em desenvolvimento)
registerSW({ immediate: true });

// Compatibilidade: URLs antigas com hash (#/feed) viram caminhos (/feed)
if (location.hash.startsWith('#/')) {
  history.replaceState(null, '', location.hash.slice(1));
}

// Tema salvo
const savedTheme = localStorage.getItem('skillex_theme');
if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.dataset.theme = savedTheme;
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
