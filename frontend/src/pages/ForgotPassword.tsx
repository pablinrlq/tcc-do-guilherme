/** Recuperação de senha: solicitar o link de redefinição. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { api, ApiError } from '../services/api';

export function ForgotPassword() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: String(data.get('email')) });
      setResult(res);
      toast('Solicitação enviada', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao solicitar recuperação', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="logo-mark">
          <i className="bi bi-key"></i>
        </div>
        <h1>Recuperar senha</h1>
        <p>Informe seu e-mail para receber o link de redefinição.</p>
      </div>
      <form id="forgot-form" onSubmit={onSubmit}>
        <div className="field">
          <label className="field__label">E-mail</label>
          <input className="input" name="email" type="email" placeholder="voce@email.com" required />
        </div>
        <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar link'}
        </button>
      </form>
      <div id="forgot-result">
        {result &&
          // Sem serviço de e-mail no MVP: em ambiente de desenvolvimento a API
          // devolve o link de redefinição, exibido aqui para demonstração.
          (result.resetLink ? (
            <div className="card" style={{ marginTop: 12 }}>
              <p className="muted" style={{ fontSize: '.85rem' }}>
                Modo demonstração — link de redefinição:
              </p>
              <a href={result.resetLink} style={{ wordBreak: 'break-all' }}>
                {result.resetLink}
              </a>
            </div>
          ) : (
            <div className="card" style={{ marginTop: 12 }}>
              <p>{result.message}</p>
            </div>
          ))}
      </div>
      <p className="auth-switch">
        <Link to="/login">Voltar ao login</Link>
      </p>
    </div>
  );
}
