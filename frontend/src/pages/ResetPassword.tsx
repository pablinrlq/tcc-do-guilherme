/** Recuperação de senha: definir a nova senha com o token recebido. */
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PasswordField } from '../components/ui/PasswordField';
import { useToast } from '../contexts/ToastContext';
import { api, ApiError } from '../services/api';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '../utils/password';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const token = searchParams.get('token') ?? '';

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      toast(PASSWORD_RULE_MESSAGE, 'error');
      return;
    }
    if (password !== confirm) {
      toast('A confirmação não confere com a senha', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast('Senha redefinida! Entre com a nova senha.', 'success');
      navigate('/login');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao redefinir a senha', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <div className="logo-mark">
          <i className="bi bi-shield-lock"></i>
        </div>
        <h1>Nova senha</h1>
        <p>Defina a nova senha da sua conta.</p>
      </div>
      <form id="reset-form" onSubmit={onSubmit}>
        <PasswordField
          name="password"
          label="Nova senha"
          value={password}
          onChange={setPassword}
          confirmName="confirm"
          confirmLabel="Confirmar nova senha"
          confirmValue={confirm}
          onConfirmChange={setConfirm}
        />
        <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
          {submitting ? 'Redefinindo...' : 'Redefinir senha'}
        </button>
      </form>
      <p className="auth-switch">
        <Link to="/login">Voltar ao login</Link>
      </p>
    </div>
  );
}
