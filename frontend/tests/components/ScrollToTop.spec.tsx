import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { ScrollToTop } from '../../src/components/ScrollToTop';

function GoButton() {
  const navigate = useNavigate();
  return <button onClick={() => navigate('/outra')}>ir</button>;
}

describe('ScrollToTop', () => {
  it('rola para o topo a cada mudança de rota', () => {
    const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/']}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<GoButton />} />
          <Route path="/outra" element={<div>OUTRA</div>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(spy).toHaveBeenCalledWith(0, 0); // render inicial
    spy.mockClear();
    fireEvent.click(screen.getByText('ir'));
    expect(screen.getByText('OUTRA')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(0, 0); // após navegar
    spy.mockRestore();
  });
});
