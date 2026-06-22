import { describe, it, expect, vi, afterEach } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ToastProvider, useToast } from '../../src/contexts/ToastContext';

const wrapper = ({ children }: { children: ReactNode }) => <ToastProvider>{children}</ToastProvider>;

afterEach(() => {
  vi.useRealTimers();
});

describe('toast', () => {
  it('exibe, empilha e remove após o tempo definido', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.toast('Olá', 'success', 1000);
    });
    expect(document.querySelectorAll('.toast')).toHaveLength(1);
    expect(document.querySelector('.toast--success')).toHaveTextContent('Olá');

    act(() => {
      result.current.toast('De novo'); // tipo padrão info, duração padrão
    });
    expect(document.querySelectorAll('.toast-wrap')).toHaveLength(1);
    expect(document.querySelectorAll('.toast')).toHaveLength(2);
    expect(document.querySelector('.toast--info')).toHaveTextContent('De novo');

    act(() => {
      vi.advanceTimersByTime(1000); // remove só o primeiro (1000ms)
    });
    expect(document.querySelectorAll('.toast')).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2800); // remove o segundo e o wrapper some
    });
    expect(document.querySelectorAll('.toast')).toHaveLength(0);
    expect(document.querySelector('.toast-wrap')).toBeNull();
  });
});

describe('confirm', () => {
  it('resolve true ao confirmar com o texto customizado', async () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    let p!: Promise<boolean>;
    act(() => {
      p = result.current.confirm('Tem certeza?', 'Sim');
    });
    expect(document.querySelector('.sheet__title')).toHaveTextContent('Confirmação');
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument();
    const ok = document.querySelector('[data-ok]') as HTMLElement;
    expect(ok).toHaveTextContent('Sim');
    fireEvent.click(ok);
    expect(await p).toBe(true);
    expect(document.querySelector('.overlay')).toBeNull();
  });

  it('resolve false ao cancelar (texto padrão Confirmar)', async () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    let p!: Promise<boolean>;
    act(() => {
      p = result.current.confirm('Apagar?');
    });
    expect(document.querySelector('[data-ok]')).toHaveTextContent('Confirmar');
    fireEvent.click(document.querySelector('[data-cancel]') as HTMLElement);
    expect(await p).toBe(false);
  });

  it('clicar no overlay cancela; clicar no conteúdo não fecha', async () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    let p!: Promise<boolean>;
    act(() => {
      p = result.current.confirm('Sair?');
    });
    // clique no conteúdo (sheet) não fecha
    fireEvent.click(document.querySelector('.sheet') as HTMLElement);
    expect(document.querySelector('.overlay')).toBeTruthy();
    // clique no overlay fecha cancelando
    fireEvent.click(document.querySelector('.overlay') as HTMLElement);
    expect(await p).toBe(false);
    expect(document.querySelector('.overlay')).toBeNull();
  });
});

describe('useToast fora do provider', () => {
  it('lança erro explicativo', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast deve ser usado dentro de <ToastProvider>',
    );
  });
});

describe('provider renderiza os filhos', () => {
  it('children aparecem normalmente', () => {
    render(
      <ToastProvider>
        <div data-testid="filho">conteúdo</div>
      </ToastProvider>,
    );
    expect(screen.getByTestId('filho')).toBeInTheDocument();
  });
});
