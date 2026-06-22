import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { PasswordField } from '../../src/components/ui/PasswordField';

function Wrapper({
  confirm = false,
  showMeter = true,
}: {
  confirm?: boolean;
  showMeter?: boolean;
}) {
  const [val, setVal] = useState('');
  const [conf, setConf] = useState('');
  return (
    <PasswordField
      name="pw"
      value={val}
      onChange={setVal}
      confirmName={confirm ? 'pw-confirm' : undefined}
      confirmValue={confirm ? conf : undefined}
      onConfirmChange={confirm ? setConf : undefined}
      showMeter={showMeter}
    />
  );
}

describe('PasswordField', () => {
  it('renderiza campo de senha com rótulo padrão', () => {
    render(<Wrapper />);
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
  });

  it('alterna visibilidade da senha', () => {
    render(<Wrapper />);
    const input = screen.getByLabelText('Senha') as HTMLInputElement;
    expect(input.type).toBe('password');

    fireEvent.click(screen.getByLabelText('Mostrar senha'));
    expect(input.type).toBe('text');

    fireEvent.click(screen.getByLabelText('Esconder senha'));
    expect(input.type).toBe('password');
  });

  it('exibe indicador de força ao digitar', () => {
    render(<Wrapper />);
    const input = screen.getByLabelText('Senha');
    fireEvent.change(input, { target: { value: 'Abc123!@' } });
    expect(screen.getByText('Forte')).toBeInTheDocument();
  });

  it('sem showMeter não exibe medidor nem regras', () => {
    render(<Wrapper showMeter={false} />);
    expect(screen.queryByText('Mínimo 8 caracteres')).not.toBeInTheDocument();
  });

  it('mostra regras individualmente conforme preenchimento', () => {
    render(<Wrapper />);
    const input = screen.getByLabelText('Senha');
    fireEvent.change(input, { target: { value: 'A' } });
    expect(document.querySelector('.password-rule--ok')).toBeInTheDocument();
  });

  it('exibe campo de confirmação quando configurado', () => {
    render(<Wrapper confirm />);
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument();
  });

  it('alterna visibilidade da confirmação', () => {
    render(<Wrapper confirm />);
    const confirmInput = screen.getByLabelText('Confirmar senha') as HTMLInputElement;
    expect(confirmInput.type).toBe('password');

    const toggleBtns = screen.getAllByRole('button');
    fireEvent.click(toggleBtns[1]);
    expect(confirmInput.type).toBe('text');
  });

  it('mostra erro de não coincidência quando senhas diferem', () => {
    render(<Wrapper confirm />);
    const pw = screen.getByLabelText('Senha');
    const conf = screen.getByLabelText('Confirmar senha');

    fireEvent.change(pw, { target: { value: 'Abc123!@' } });
    fireEvent.change(conf, { target: { value: 'diferente' } });

    expect(screen.getByText('As senhas não coincidem.')).toBeInTheDocument();
  });

  it('não mostra erro quando confirmação está vazia', () => {
    render(<Wrapper confirm />);
    const pw = screen.getByLabelText('Senha');
    fireEvent.change(pw, { target: { value: 'Abc123!@' } });
    expect(screen.queryByText('As senhas não coincidem.')).not.toBeInTheDocument();
  });

  it('não mostra erro quando senhas coincidem', () => {
    render(<Wrapper confirm />);
    const pw = screen.getByLabelText('Senha');
    const conf = screen.getByLabelText('Confirmar senha');
    fireEvent.change(pw, { target: { value: 'Abc123!@' } });
    fireEvent.change(conf, { target: { value: 'Abc123!@' } });
    expect(screen.queryByText('As senhas não coincidem.')).not.toBeInTheDocument();
  });
});
