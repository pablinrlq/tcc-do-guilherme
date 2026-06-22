import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../src/services/realtime', () => ({
  subscribeRealtime: vi.fn(() => () => {}),
  joinRequestRoom: vi.fn(),
  leaveRequestRoom: vi.fn(),
}));

import { AppLayout } from '../../src/components/AppLayout';
import { useAuth } from '../../src/contexts/AuthContext';
import { subscribeRealtime } from '../../src/services/realtime';

const refreshUnread = vi.fn();

function mockAuth(unread = 0) {
  (useAuth as any).mockReturnValue({ unread, refreshUnread });
}

function renderShell(initialPath = '/feed') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<div>CONTEUDO-FEED</div>} />
          <Route path="/search" element={<div>CONTEUDO-BUSCA</div>} />
          <Route path="/notifications" element={<div>CONTEUDO-NOTIF</div>} />
          <Route path="/settings" element={<div>CONTEUDO-CONFIG</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth(0);
});

describe('shell e navegação', () => {
  it('monta o shell com header, conteúdo e os 5 itens de navegação', () => {
    renderShell();
    expect(document.querySelector('.app-shell')).toBeTruthy();
    expect(document.querySelector('main#view.app-content')).toBeTruthy();
    expect(screen.getByText('CONTEUDO-FEED')).toBeInTheDocument();
    const navs = document.querySelectorAll('.nav-item');
    expect(navs).toHaveLength(5);
    // FAB no item de trocas
    expect(document.querySelector('a.nav-fab[data-nav="requests"]')).toBeTruthy();
  });

  it('marca o item ativo conforme a rota (classe nav-item active)', () => {
    renderShell('/feed');
    const active = document.querySelector('a.nav-item.active') as HTMLElement;
    expect(active.dataset.nav).toBe('feed');
  });

  it('navegar pela bottom nav troca o conteúdo e o item ativo', () => {
    renderShell('/feed');
    fireEvent.click(document.querySelector('a[data-nav="search"]') as HTMLElement);
    expect(screen.getByText('CONTEUDO-BUSCA')).toBeInTheDocument();
    expect((document.querySelector('a.nav-item.active') as HTMLElement).dataset.nav).toBe('search');
  });

  it('botões do header navegam para notificações e configurações', () => {
    renderShell('/feed');
    fireEvent.click(document.querySelector('[data-action="notifications"]') as HTMLElement);
    expect(screen.getByText('CONTEUDO-NOTIF')).toBeInTheDocument();
    fireEvent.click(document.querySelector('[data-action="settings"]') as HTMLElement);
    expect(screen.getByText('CONTEUDO-CONFIG')).toBeInTheDocument();
  });
});

describe('badge de não lidas', () => {
  it('fica oculto com 0 não lidas', () => {
    mockAuth(0);
    renderShell();
    const dot = document.querySelector('[data-unread]') as HTMLElement;
    expect(dot.classList.contains('hidden')).toBe(true);
  });

  it('exibe a contagem quando há não lidas', () => {
    mockAuth(5);
    renderShell();
    const dot = document.querySelector('[data-unread]') as HTMLElement;
    expect(dot.classList.contains('hidden')).toBe(false);
    expect(dot.textContent).toBe('5');
  });

  it('limita a exibição em 99+', () => {
    mockAuth(150);
    renderShell();
    expect((document.querySelector('[data-unread]') as HTMLElement).textContent).toBe('99+');
  });
});

describe('tema', () => {
  it('alterna claro/escuro persistindo a escolha', () => {
    renderShell();
    const btn = document.querySelector('[data-action="theme"]') as HTMLElement;
    expect(btn.querySelector('.bi-moon-stars')).toBeTruthy(); // claro → ícone de lua
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('skillex_theme')).toBe('dark');
    expect(btn.querySelector('.bi-sun')).toBeTruthy(); // escuro → ícone de sol
    fireEvent.click(btn);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('skillex_theme')).toBe('light');
  });
});

describe('tempo real', () => {
  it('busca o contador ao montar e assina notification:new', () => {
    renderShell();
    expect(refreshUnread).toHaveBeenCalled();
    expect(subscribeRealtime).toHaveBeenCalledWith('notification:new', expect.any(Function));
    // Disparar o evento atualiza o contador de novo
    refreshUnread.mockClear();
    const handler = (subscribeRealtime as any).mock.calls.find(
      (c: any[]) => c[0] === 'notification:new',
    )[1];
    handler({});
    expect(refreshUnread).toHaveBeenCalled();
  });
});
