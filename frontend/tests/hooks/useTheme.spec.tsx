import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useTheme } from '../../src/hooks/useTheme';

describe('useTheme', () => {
  it('começa claro quando não há tema definido', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('começa escuro quando o documento já está em dark', () => {
    document.documentElement.dataset.theme = 'dark';
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
  });

  it('alterna o tema persistindo em localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('skillex_theme')).toBe('dark');
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('skillex_theme')).toBe('light');
  });
});
