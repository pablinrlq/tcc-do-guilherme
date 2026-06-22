import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Icon } from '../../src/components/ui/Icon';
import { Avatar } from '../../src/components/ui/Avatar';
import { Stars } from '../../src/components/ui/Stars';
import { MatchBadge } from '../../src/components/ui/MatchBadge';
import { ScoreRing } from '../../src/components/ui/ScoreRing';
import { SkillBadge } from '../../src/components/ui/SkillBadge';
import { Spinner } from '../../src/components/ui/Spinner';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { SkeletonCards } from '../../src/components/ui/SkeletonCards';
import { Sheet } from '../../src/components/ui/Sheet';
import { ReportModal } from '../../src/components/ui/ReportModal';
import { ToastProvider } from '../../src/contexts/ToastContext';

vi.mock('../../src/services/api', () => {
  class ApiError extends Error {
    constructor(msg: string) {
      super(msg);
    }
  }
  return {
    ApiError,
    api: { post: vi.fn() },
  };
});

describe('Icon', () => {
  it('renderiza com e sem classe extra', () => {
    const { container, rerender } = render(<Icon name="house" />);
    expect(container.querySelector('.bi-house')).toBeTruthy();
    rerender(<Icon name="house" extra="big" />);
    expect(container.querySelector('.bi-house.big')).toBeTruthy();
  });
});

describe('Avatar', () => {
  it('usa imagem quando há avatarUrl', () => {
    const { container } = render(<Avatar user={{ name: 'Ana', avatarUrl: '/u/a.png' }} size="lg" />);
    const img = container.querySelector('img.avatar--lg') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.alt).toBe('Ana');
  });
  it('usa alt vazio quando a imagem não tem nome', () => {
    const { container } = render(<Avatar user={{ avatarUrl: '/u/x.png' }} />);
    expect((container.querySelector('img') as HTMLImageElement).alt).toBe('');
  });
  it('gera iniciais a partir do nome (tamanho padrão md)', () => {
    const { container } = render(<Avatar user={{ name: 'Ana Maria' }} />);
    expect(container.querySelector('.avatar--md')).toHaveTextContent('AM');
  });
  it('usa "?" quando não há nome nem usuário', () => {
    const { container } = render(<Avatar user={null} />);
    expect(container.querySelector('.avatar')).toHaveTextContent('?');
  });
  it('ignora partes vazias do nome ao montar iniciais', () => {
    const { container } = render(<Avatar user={{ name: 'Ana ' }} />);
    expect(container.querySelector('.avatar')).toHaveTextContent('A');
  });
});

describe('Stars', () => {
  it('gera 5 estrelas com as cheias arredondadas', () => {
    const { container } = render(<Stars rating={3} />);
    expect(container.querySelectorAll('.bi-star-fill')).toHaveLength(3);
    expect(container.querySelectorAll('i')).toHaveLength(5);
  });
});

describe('MatchBadge', () => {
  it('cobre todos os tipos e o fallback', () => {
    const { rerender } = render(<MatchBadge match={{ type: 'PERFECT' }} />);
    expect(screen.getByText(/Match perfeito/)).toBeInTheDocument();
    rerender(<MatchBadge match={{ type: 'PARTIAL' }} />);
    expect(screen.getByText(/Match parcial/)).toBeInTheDocument();
    rerender(<MatchBadge match={{ type: 'COIN_ONLY' }} />);
    expect(screen.getByText(/Aula por moedas/)).toBeInTheDocument();
    rerender(<MatchBadge match={{ type: 'DESCONHECIDO' }} />);
    expect(screen.getByText(/Aula por moedas/)).toBeInTheDocument();
  });
});

describe('ScoreRing', () => {
  it('escolhe a cor por faixa de pontuação', () => {
    const { container, rerender } = render(<ScoreRing score={80} />);
    const style = () => (container.querySelector('.score-ring') as HTMLElement).getAttribute('style');
    expect(style()).toContain('--success');
    rerender(<ScoreRing score={50} />);
    expect(style()).toContain('--warning');
    rerender(<ScoreRing score={10} />);
    expect(style()).toContain('--text-soft');
    expect(container.querySelector('.score-ring span')).toHaveTextContent('10');
  });
});

describe('SkillBadge', () => {
  it('cobre teach/learn/neutral', () => {
    const { container, rerender } = render(<SkillBadge name="X" kind="teach" />);
    expect(container.querySelector('.skill-badge--teach')).toBeTruthy();
    rerender(<SkillBadge name="X" kind="learn" />);
    expect(container.querySelector('.skill-badge--learn')).toBeTruthy();
    rerender(<SkillBadge name="X" />);
    expect(container.querySelector('.bi-tag-fill')).toBeTruthy();
  });
});

describe('Spinner / EmptyState / SkeletonCards', () => {
  it('spinner renderiza', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('.spinner')).toBeTruthy();
  });
  it('emptyState com e sem subtítulo', () => {
    const { rerender } = render(<EmptyState icon="compass" title="Vazio" />);
    expect(screen.getByText('Vazio')).toBeInTheDocument();
    rerender(<EmptyState icon="compass" title="Vazio" subtitle="sub" />);
    expect(screen.getByText('sub')).toBeInTheDocument();
  });
  it('skeletonCards usa a contagem informada e o padrão 3', () => {
    const { container, rerender } = render(<SkeletonCards count={2} />);
    expect(container.querySelectorAll('.skeleton-card')).toHaveLength(2);
    rerender(<SkeletonCards />);
    expect(container.querySelectorAll('.skeleton-card')).toHaveLength(3);
  });
});

describe('Sheet', () => {
  it('renderiza em portal e fecha apenas no clique do overlay', () => {
    const onClose = vi.fn();
    render(
      <Sheet title="Título" onClose={onClose}>
        <p>corpo</p>
      </Sheet>,
    );
    expect(document.querySelector('.sheet__title')).toHaveTextContent('Título');
    expect(screen.getByText('corpo')).toBeInTheDocument();
    // clique no conteúdo não fecha
    fireEvent.click(document.querySelector('.sheet') as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
    // clique no overlay fecha
    fireEvent.click(document.querySelector('.overlay') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ─── ReportModal ─────────────────────────────────────────────────────────────

async function importApi() {
  const mod = await import('../../src/services/api');
  return mod.api as { post: ReturnType<typeof vi.fn> };
}

function renderModal(props: Partial<Parameters<typeof ReportModal>[0]> = {}) {
  const onClose = vi.fn();
  render(
    <ToastProvider>
      <ReportModal targetId="u1" targetName="João" onClose={onClose} {...props} />
    </ToastProvider>,
  );
  return { onClose };
}

describe('ReportModal', () => {
  it('renderiza com o nome do alvo no título', () => {
    renderModal();
    expect(screen.getByText(/Denunciar João/)).toBeInTheDocument();
  });

  it('renderiza sem nome do alvo', () => {
    renderModal({ targetName: undefined });
    expect(screen.getByText('Denunciar')).toBeInTheDocument();
  });

  it('botão enviar desabilitado sem tipo selecionado', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /Enviar/ })).toBeDisabled();
  });

  it('botão enviar desabilitado quando descrição tem menos de 10 caracteres', () => {
    renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'SPAM' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'curto' } });
    expect(screen.getByRole('button', { name: /Enviar/ })).toBeDisabled();
  });

  it('botão Cancelar chama onClose', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clique no overlay chama onClose', () => {
    const { onClose } = renderModal();
    const overlay = document.querySelector('.overlay') as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clique dentro do sheet não fecha o modal', () => {
    const { onClose } = renderModal();
    const sheet = document.querySelector('.sheet') as HTMLElement;
    fireEvent.click(sheet);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('submit com sucesso: chama api.post, toast e fecha', async () => {
    const apiModule = await importApi();
    apiModule.post.mockResolvedValueOnce({});

    const { onClose } = renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'SPAM' } });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Esta é uma descrição longa o suficiente.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(apiModule.post).toHaveBeenCalledWith('/reports', expect.objectContaining({ type: 'SPAM' }));
    expect(screen.getByText(/Denúncia enviada/)).toBeInTheDocument();
  });

  it('submit com ApiError exibe mensagem da API', async () => {
    const { ApiError, api } = await import('../../src/services/api');
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new ApiError('Já existe uma denúncia pendente'),
    );

    renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'HARASSMENT' } });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Descrição detalhada do problema.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar/ }));

    await waitFor(() =>
      expect(screen.getByText('Já existe uma denúncia pendente')).toBeInTheDocument(),
    );
  });

  it('submit com erro genérico exibe mensagem padrão', async () => {
    const { api } = await import('../../src/services/api');
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network'));

    renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'OTHER' } });
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Descrição detalhada do problema genérico.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar/ }));

    await waitFor(() =>
      expect(screen.getByText('Erro ao enviar denúncia')).toBeInTheDocument(),
    );
  });

  it('submit sem tipo não chama api.post (if !type guard)', async () => {
    const apiModule = await importApi();
    apiModule.post.mockClear();

    renderModal();
    // Submeter o form diretamente (bypassando o botão disabled)
    fireEvent.submit(screen.getByRole('combobox').closest('form')!);

    await new Promise((r) => setTimeout(r, 0));
    expect(apiModule.post).not.toHaveBeenCalled();
  });

  it('exibe contador de caracteres da descrição', () => {
    renderModal();
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'abc' } });
    expect(screen.getByText('3/1000')).toBeInTheDocument();
  });
});
