/** Campo de senha com indicador de força, regras visuais e confirmação. */
import { useState } from 'react';
import { Icon } from './Icon';
import { evaluatePassword, passwordStrength } from '../../utils/password';

interface Props {
  name: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  confirmName?: string;
  confirmValue?: string;
  onConfirmChange?: (v: string) => void;
  confirmLabel?: string;
  autoComplete?: string;
  required?: boolean;
  showMeter?: boolean;
}

export function PasswordField({
  name,
  label = 'Senha',
  value,
  onChange,
  confirmName,
  confirmValue,
  onConfirmChange,
  confirmLabel = 'Confirmar senha',
  autoComplete = 'new-password',
  required = true,
  showMeter = true,
}: Props) {
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const checks = evaluatePassword(value);
  const { score, label: strengthLabel } = passwordStrength(value);
  const mismatch = confirmName !== undefined && confirmValue !== '' && confirmValue !== value;

  return (
    <>
      <div className="field">
        <label className="field__label" htmlFor={name}>
          {label}
        </label>
        <div className="password-input">
          <input
            id={name}
            className="input"
            name={name}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            required={required}
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            className="password-input__toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Esconder senha' : 'Mostrar senha'}
          >
            <Icon name={show ? 'eye-slash' : 'eye'} />
          </button>
        </div>

        {showMeter && (
          <div className="password-meter" aria-live="polite">
            <div className={`password-meter__bar password-meter__bar--s${score}`}>
              <span />
            </div>
            {value && (
              <span className={`password-meter__label password-meter__label--s${score}`}>
                {strengthLabel}
              </span>
            )}
          </div>
        )}

        {showMeter && (
          <ul className="password-rules">
            <Rule ok={checks.length}>Mínimo 8 caracteres</Rule>
            <Rule ok={checks.upper}>Uma letra maiúscula</Rule>
            <Rule ok={checks.lower}>Uma letra minúscula</Rule>
            <Rule ok={checks.number}>Um número</Rule>
            <Rule ok={checks.symbol}>Um símbolo (ex.: !@#$)</Rule>
          </ul>
        )}
      </div>

      {confirmName !== undefined && onConfirmChange && (
        <div className="field">
          <label className="field__label" htmlFor={confirmName}>
            {confirmLabel}
          </label>
          <div className="password-input">
            <input
              id={confirmName}
              className="input"
              name={confirmName}
              type={showConfirm ? 'text' : 'password'}
              value={confirmValue}
              onChange={(e) => onConfirmChange(e.target.value)}
              autoComplete={autoComplete}
              required={required}
              placeholder="Repita a senha"
            />
            <button
              type="button"
              className="password-input__toggle"
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={showConfirm ? 'Esconder senha' : 'Mostrar senha'}
            >
              <Icon name={showConfirm ? 'eye-slash' : 'eye'} />
            </button>
          </div>
          {mismatch && <p className="field__error">As senhas não coincidem.</p>}
        </div>
      )}
    </>
  );
}

function Rule({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`password-rule${ok ? ' password-rule--ok' : ''}`}>
      <Icon name={ok ? 'check-circle-fill' : 'circle'} />
      <span>{children}</span>
    </li>
  );
}
