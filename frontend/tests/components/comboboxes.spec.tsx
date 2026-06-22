import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { Combobox } from '../../src/components/ui/Combobox';
import { MultiCombobox } from '../../src/components/ui/MultiCombobox';

const OPTIONS = [
  { value: 'sp', label: 'São Paulo' },
  { value: 'rj', label: 'Rio de Janeiro' },
  { value: 'mg', label: 'Minas Gerais' },
];

// ─── Combobox ────────────────────────────────────────────────────────────────

function ComboWrapper({
  initialValue = '',
  disabled = false,
  loading = false,
  emptyMessage,
}: {
  initialValue?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
}) {
  const [val, setVal] = useState(initialValue);
  return (
    <Combobox
      id="cb"
      options={OPTIONS}
      value={val}
      onChange={setVal}
      placeholder="Escolha..."
      disabled={disabled}
      loading={loading}
      emptyMessage={emptyMessage}
    />
  );
}

describe('Combobox', () => {
  it('renderiza com placeholder', () => {
    render(<ComboWrapper />);
    expect(screen.getByPlaceholderText('Escolha...')).toBeInTheDocument();
  });

  it('mostra "Carregando..." e desabilita input quando loading', () => {
    render(<ComboWrapper loading />);
    const input = screen.getByPlaceholderText('Carregando...') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('abre a lista ao receber foco e exibe as opções', () => {
    render(<ComboWrapper />);
    fireEvent.focus(screen.getByPlaceholderText('Escolha...'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('filtra opções conforme digitação', () => {
    render(<ComboWrapper />);
    const input = screen.getByPlaceholderText('Escolha...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Paulo' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
  });

  it('exibe emptyMessage quando filtro não encontra nada', () => {
    render(<ComboWrapper emptyMessage="Sem resultados" />);
    const input = screen.getByPlaceholderText('Escolha...');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('Sem resultados')).toBeInTheDocument();
  });

  it('seleciona opção ao mouseDown e fecha a lista', () => {
    const onChange = vi.fn();
    const { container } = render(
      <Combobox id="cb2" options={OPTIONS} value="" onChange={onChange} placeholder="..." />,
    );
    fireEvent.focus(container.querySelector('input')!);
    const option = screen.getByText('Rio de Janeiro');
    fireEvent.mouseDown(option);
    expect(onChange).toHaveBeenCalledWith('rj');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('ArrowDown abre lista e move destaque para baixo', () => {
    render(<ComboWrapper />);
    const input = screen.getByPlaceholderText('Escolha...');
    // 1ª tecla: abre lista, idx 0→1
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // 2ª tecla: idx 1→2
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const items = screen.getAllByRole('option');
    expect(items[2].className).toContain('combobox__item--active');
    // tentativa além do último não quebra
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(items[2].className).toContain('combobox__item--active');
  });

  it('ArrowUp move destaque para cima', () => {
    render(<ComboWrapper />);
    const input = screen.getByPlaceholderText('Escolha...');
    // focus seta idx=0; ArrowDown x2 → idx=2; ArrowUp → idx=1
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    const items = screen.getAllByRole('option');
    expect(items[1].className).toContain('combobox__item--active');
    // subir até 0
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(items[0].className).toContain('combobox__item--active');
    // tentar subir além de 0 — não quebra
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(items[0].className).toContain('combobox__item--active');
  });

  it('Enter seleciona item ativo', () => {
    const onChange = vi.fn();
    render(
      <Combobox id="cb3" options={OPTIONS} value="" onChange={onChange} placeholder="..." />,
    );
    const input = screen.getByPlaceholderText('...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('sp');
  });

  it('Enter não faz nada quando lista está fechada', () => {
    const onChange = vi.fn();
    render(
      <Combobox id="cb4" options={OPTIONS} value="" onChange={onChange} placeholder="..." />,
    );
    const input = screen.getByPlaceholderText('...');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Escape fecha lista', () => {
    render(<ComboWrapper initialValue="sp" />);
    const input = screen.getByPlaceholderText('Escolha...') as HTMLInputElement;
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    // sem digitar nada — query permanece com o label da seleção
    expect(input.value).toBe('São Paulo');
  });

  it('mouseEnter atualiza item ativo', () => {
    render(<ComboWrapper />);
    fireEvent.focus(screen.getByPlaceholderText('Escolha...'));
    const items = screen.getAllByRole('option');
    fireEvent.mouseEnter(items[2]);
    expect(items[2].className).toContain('combobox__item--active');
  });

  it('item selecionado recebe classe --selected', () => {
    // com query = label, o filtro mostra apenas 1 item — o selecionado
    render(<ComboWrapper initialValue="rj" />);
    fireEvent.focus(screen.getByPlaceholderText('Escolha...'));
    // só Rio de Janeiro aparece (filtrado pelo label inicial)
    const item = screen.getByRole('option');
    expect(item.className).toContain('combobox__item--selected');
  });

  it('fechar ao clicar fora fecha a lista', () => {
    render(<ComboWrapper initialValue="mg" />);
    const input = screen.getByPlaceholderText('Escolha...') as HTMLInputElement;
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('digitar diferente da seleção atual limpa o valor', () => {
    const onChange = vi.fn();
    render(
      <Combobox id="cb5" options={OPTIONS} value="sp" onChange={onChange} placeholder="..." />,
    );
    const input = screen.getByPlaceholderText('...');
    fireEvent.change(input, { target: { value: 'Rio' } });
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('disabled: lista não abre ao receber foco', () => {
    render(<ComboWrapper disabled />);
    fireEvent.focus(screen.getByPlaceholderText('Escolha...'));
    // O input está desabilitado, mas o focus não deve mostrar a lista
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('Escape sem seleção usa fallback vazio para setQuery', () => {
    // sem initialValue → selected é undefined → selected?.label ?? '' usa ''
    render(<ComboWrapper />);
    const input = screen.getByPlaceholderText('Escolha...') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('fechar ao clicar fora sem seleção usa fallback vazio para setQuery', () => {
    // sem initialValue → selected é undefined → setQuery('') no outside click
    render(<ComboWrapper />);
    const input = screen.getByPlaceholderText('Escolha...') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('tecla desconhecida não tem efeito (cobre branch false do else-if Escape)', () => {
    render(<ComboWrapper />);
    const input = screen.getByPlaceholderText('Escolha...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'F9' });
    // lista continua aberta e sem crash
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});

// ─── MultiCombobox ───────────────────────────────────────────────────────────

function MultiWrapper({
  initial = [] as string[],
  max,
}: {
  initial?: string[];
  max?: number;
}) {
  const [vals, setVals] = useState(initial);
  return (
    <MultiCombobox
      options={OPTIONS}
      values={vals}
      onChange={setVals}
      placeholder="Adicionar..."
      max={max}
    />
  );
}

describe('MultiCombobox', () => {
  it('renderiza chips para valores selecionados', () => {
    render(<MultiWrapper initial={['sp', 'rj']} />);
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
    expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
  });

  it('remove chip ao clicar no botão de remoção', () => {
    render(<MultiWrapper initial={['sp']} />);
    fireEvent.click(screen.getByLabelText('Remover São Paulo'));
    expect(screen.queryByText('São Paulo')).not.toBeInTheDocument();
  });

  it('abre lista excluindo os itens já selecionados', () => {
    render(<MultiWrapper initial={['sp']} />);
    fireEvent.focus(screen.getByPlaceholderText('Adicionar...'));
    const items = screen.getAllByRole('option');
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.textContent)).not.toContain('São Paulo');
  });

  it('adiciona item via mouseDown', () => {
    render(<MultiWrapper />);
    fireEvent.focus(screen.getByPlaceholderText('Adicionar...'));
    fireEvent.mouseDown(screen.getByText('Minas Gerais'));
    expect(screen.getByText('Minas Gerais')).toBeInTheDocument();
  });

  it('ArrowDown/ArrowUp navega, Enter adiciona item', () => {
    render(<MultiWrapper />);
    const input = screen.getByPlaceholderText('Adicionar...');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // segundo item (index 1) foi pressionado com Enter após ArrowDown x2 e ArrowUp x1
    expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
  });

  it('Enter não faz nada quando lista está fechada', () => {
    const onChange = vi.fn();
    render(
      <MultiCombobox options={OPTIONS} values={[]} onChange={onChange} />,
    );
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Backspace remove o último chip quando query está vazia', () => {
    render(<MultiWrapper initial={['sp', 'rj']} />);
    fireEvent.keyDown(screen.getByPlaceholderText('Adicionar...'), { key: 'Backspace' });
    expect(screen.queryByText('Rio de Janeiro')).not.toBeInTheDocument();
    expect(screen.getByText('São Paulo')).toBeInTheDocument();
  });

  it('Backspace não faz nada quando há texto no input', () => {
    render(<MultiWrapper />);
    const input = screen.getByPlaceholderText('Adicionar...');
    fireEvent.change(input, { target: { value: 'Sao' } });
    fireEvent.keyDown(input, { key: 'Backspace' });
    // sem valores para remover → sem chip
    expect(screen.queryByRole('listbox')).toBeInTheDocument();
  });

  it('Escape fecha a lista', () => {
    render(<MultiWrapper />);
    const input = screen.getByPlaceholderText('Adicionar...');
    fireEvent.focus(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('max atingido: input desabilitado com placeholder de limite', () => {
    render(<MultiWrapper initial={['sp', 'rj']} max={2} />);
    const input = screen.getByPlaceholderText('Limite de 2 atingido') as HTMLInputElement;
    expect(input.disabled).toBe(true);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('add não faz nada quando max atingido', () => {
    render(<MultiWrapper initial={['sp']} max={1} />);
    fireEvent.focus(screen.getByPlaceholderText('Limite de 1 atingido'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('exibe emptyMessage quando nenhum item não-selecionado corresponde', () => {
    render(<MultiWrapper initial={['sp', 'rj', 'mg']} />);
    // todos selecionados → lista vazia
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    // lista não aparece pois reachedMax is false mas... na verdade não tem max
    // então lista aparece com emptyMessage padrão
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
  });

  it('chip exibe valor bruto quando label não encontrado (fallback)', () => {
    render(
      <MultiCombobox
        options={OPTIONS}
        values={['xx']}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText('xx')).toBeInTheDocument();
  });

  it('fecha ao clicar fora', () => {
    render(<MultiWrapper />);
    fireEvent.focus(screen.getByPlaceholderText('Adicionar...'));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('mouseEnter atualiza item ativo na lista', () => {
    render(<MultiWrapper />);
    fireEvent.focus(screen.getByPlaceholderText('Adicionar...'));
    const items = screen.getAllByRole('option');
    fireEvent.mouseEnter(items[2]);
    expect(items[2].className).toContain('combobox__item--active');
  });
});
