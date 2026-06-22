import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// jsdom não implementa scrollTo (usado pelo ScrollToTop) — stub no-op.
window.scrollTo = () => {};

// Estado de DOM limpo antes de cada teste.
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});
