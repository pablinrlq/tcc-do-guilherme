import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { UserCard } from '../../src/components/UserCard';

function renderCard(user: any) {
  return render(
    <MemoryRouter>
      <UserCard user={user} />
    </MemoryRouter>,
  );
}

describe('UserCard', () => {
  it('renderiza usuário completo com match recíproco', () => {
    const { container } = renderCard({
      id: 'u1',
      name: 'Carlos',
      city: 'São Paulo',
      state: 'SP',
      bio: 'Dev full stack',
      rating: { count: 3, average: 4.7 },
      match: { score: 88, type: 'PERFECT', reciprocal: true },
      teachingSkills: [{ skill: { name: 'Node' } }, { skill: { name: 'TS' } }],
      learningSkills: [{ skill: { name: 'Go' } }],
    });
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText(/São Paulo/)).toBeInTheDocument();
    expect(screen.getByText(/\/SP/)).toBeInTheDocument();
    expect(container.querySelector('.score-ring')).toBeTruthy();
    expect(screen.getByText(/Troca perfeita/)).toBeInTheDocument();
    expect(screen.getByText('Ensina:')).toBeInTheDocument();
    expect(screen.getByText('Quer aprender:')).toBeInTheDocument();
    expect(screen.getByText('Dev full stack')).toBeInTheDocument();
  });

  it('gera links de perfil, compra de aula e troca com o id do usuário', () => {
    renderCard({ id: 'u1', name: 'Carlos' });
    expect(screen.getByText(/Ver perfil/).closest('a')).toHaveAttribute('href', '/profile/u1');
    expect(screen.getByText(/Comprar aula/).closest('a')).toHaveAttribute(
      'href',
      '/request/new/u1?mode=coin',
    );
    expect(screen.getByText(/Solicitar troca/).closest('a')).toHaveAttribute(
      'href',
      '/request/new/u1',
    );
  });

  it('renderiza usuário mínimo (sem match, sem cidade, sem avaliações)', () => {
    const { container } = renderCard({ id: 'u2', name: 'Bia', teachingSkills: [], learningSkills: [] });
    expect(screen.getByText('Bia')).toBeInTheDocument();
    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
    expect(container.querySelector('.score-ring')).toBeNull();
    expect(screen.queryByText(/Troca perfeita/)).toBeNull();
    expect(screen.queryByText('Ensina:')).toBeNull();
    expect(screen.queryByText('Quer aprender:')).toBeNull();
  });

  it('lida com habilidades sem nome/skill (fallback vazio)', () => {
    renderCard({
      id: 'u4',
      name: 'Sem Skill',
      teachingSkills: [{}],
      learningSkills: [{ skill: {} }],
    });
    expect(screen.getByText('Ensina:')).toBeInTheDocument();
    expect(screen.getByText('Quer aprender:')).toBeInTheDocument();
  });

  it('cobre cidade sem estado e match não recíproco', () => {
    renderCard({
      id: 'u3',
      name: 'Léo',
      city: 'Recife',
      rating: { count: 1, average: 5 },
      match: { score: 40, type: 'PARTIAL', reciprocal: false },
    });
    expect(screen.getByText(/Recife/)).toBeInTheDocument();
    expect(screen.getByText(/Match parcial/)).toBeInTheDocument();
    expect(screen.queryByText(/Troca perfeita/)).toBeNull();
  });
});
