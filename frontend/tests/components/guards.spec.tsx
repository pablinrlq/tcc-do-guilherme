import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { RequireAuth, RedirectIfAuthed } from '../../src/components/guards';
import { useAuth } from '../../src/contexts/AuthContext';

function renderProtected(initialPath = '/feed') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/feed" element={<div>FEED</div>} />
        </Route>
        <Route path="/login" element={<div>LOGIN</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderAuthPages(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<RedirectIfAuthed />}>
          <Route path="/login" element={<div>LOGIN</div>} />
        </Route>
        <Route path="/feed" element={<div>FEED</div>} />
        <Route path="/onboarding" element={<div>ONBOARDING</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RequireAuth', () => {
  it('exibe splash de carregamento enquanto a sessão é restaurada', () => {
    (useAuth as any).mockReturnValue({ status: 'loading', user: null });
    renderProtected();
    expect(document.querySelector('.spinner')).toBeTruthy();
    expect(screen.queryByText('FEED')).toBeNull();
  });

  it('redireciona visitante para /login', () => {
    (useAuth as any).mockReturnValue({ status: 'guest', user: null });
    renderProtected();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('renderiza a rota protegida quando autenticado', () => {
    (useAuth as any).mockReturnValue({ status: 'authed', user: { onboardingCompleted: true } });
    renderProtected();
    expect(screen.getByText('FEED')).toBeInTheDocument();
  });
});

describe('RedirectIfAuthed', () => {
  it('exibe splash enquanto a sessão é restaurada', () => {
    (useAuth as any).mockReturnValue({ status: 'loading', user: null });
    renderAuthPages();
    expect(document.querySelector('.spinner')).toBeTruthy();
  });

  it('visitante vê a tela de login normalmente', () => {
    (useAuth as any).mockReturnValue({ status: 'guest', user: null });
    renderAuthPages();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });

  it('autenticado com onboarding completo vai para /feed', () => {
    (useAuth as any).mockReturnValue({ status: 'authed', user: { onboardingCompleted: true } });
    renderAuthPages();
    expect(screen.getByText('FEED')).toBeInTheDocument();
  });

  it('autenticado sem onboarding vai para /onboarding', () => {
    (useAuth as any).mockReturnValue({ status: 'authed', user: { onboardingCompleted: false } });
    renderAuthPages();
    expect(screen.getByText('ONBOARDING')).toBeInTheDocument();
  });
});
