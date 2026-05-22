/** Tela de cadastro. */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Combobox } from '../components/ui/Combobox';
import { PasswordField } from '../components/ui/PasswordField';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useBrazilCities, useBrazilStates } from '../hooks/useBrazilLocations';
import { ApiError } from '../services/api';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '../utils/password';

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const { states, loading: loadingStates } = useBrazilStates();
  const { cities, loading: loadingCities } = useBrazilCities(state);

  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.sigla, label: `${s.nome} (${s.sigla})` })),
    [states],
  );
  const cityOptions = useMemo(() => cities.map((c) => ({ value: c, label: c })), [cities]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      toast(PASSWORD_RULE_MESSAGE, 'error');
      return;
    }
    if (password !== confirm) {
      toast('As senhas não coincidem', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        city: city || undefined,
        state: state || undefined,
      });
      navigate('/onboarding');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao cadastrar', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="logo-mark">
          <i className="bi bi-arrow-left-right"></i>
        </div>
        <h1>Criar conta</h1>
        <p>Comece a trocar habilidades hoje.</p>
      </div>
      <form id="auth-form" onSubmit={onSubmit}>
        <div className="field">
          <label className="field__label">Nome completo</label>
          <input
            className="input"
            name="name"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label className="field__label">E-mail</label>
          <input
            className="input"
            name="email"
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <PasswordField
          name="password"
          value={password}
          onChange={setPassword}
          confirmName="confirm"
          confirmValue={confirm}
          onConfirmChange={setConfirm}
        />

        <div className="row gap-8">
          <div className="field" style={{ width: 140 }}>
            <label className="field__label">UF</label>
            <Combobox
              options={stateOptions}
              value={state}
              onChange={(v) => {
                setState(v);
                setCity('');
              }}
              placeholder="Estado"
              loading={loadingStates}
            />
          </div>
          <div className="field full">
            <label className="field__label">Cidade</label>
            <Combobox
              options={cityOptions}
              value={city}
              onChange={setCity}
              placeholder={state ? 'Cidade' : 'Selecione um estado primeiro'}
              disabled={!state}
              loading={loadingCities}
            />
          </div>
        </div>

        <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
          {submitting ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
      <p className="auth-switch">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  );
}
