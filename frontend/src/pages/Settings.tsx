/** Configurações da conta: aparência, segurança, sessão e exclusão (LGPD). */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { PasswordField } from '../components/ui/PasswordField';
import { Sheet } from '../components/ui/Sheet';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api, ApiError } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { isStrongPassword, PASSWORD_RULE_MESSAGE } from '../utils/password';

export function Settings() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast, confirm } = useToast();
  const { toggleTheme } = useTheme();
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const onChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isStrongPassword(newPassword)) {
      toast(PASSWORD_RULE_MESSAGE, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('A confirmação não confere com a nova senha', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      toast('Senha alterada com sucesso', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao alterar a senha', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const onLogout = async () => {
    if (await confirm('Deseja sair da sua conta?', 'Sair')) logout();
  };

  const onAskDelete = async () => {
    const sure = await confirm(
      'Tem certeza? Seus dados pessoais, habilidades e favoritos serão removidos permanentemente.',
      'Continuar',
    );
    if (sure) setConfirmingDelete(true);
  };

  const onDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setDeleting(true);
    try {
      await api.del('/users/me', { password: String(data.get('password')) });
      setConfirmingDelete(false);
      logout();
      toast('Conta excluída. Sentiremos sua falta!', 'success');
      navigate('/');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao excluir a conta', 'error');
      setDeleting(false);
    }
  };

  return (
    <>
      <h1 className="page-title">
        <Icon name="gear-fill" /> Configurações
      </h1>
      <p className="page-subtitle">Preferências, segurança e sessão</p>

      <section className="card">
        <h2 className="card-title">
          <Icon name="palette" /> Aparência
        </h2>
        <button className="btn btn--ghost" id="btn-theme" onClick={toggleTheme}>
          Alternar tema claro/escuro
        </button>
      </section>

      <section className="card">
        <h2 className="card-title">
          <Icon name="shield-lock" /> Alterar senha
        </h2>
        <form id="password-form" onSubmit={onChangePassword}>
          <div className="field">
            <label className="field__label" htmlFor="currentPassword">Senha atual</label>
            <input
              id="currentPassword"
              className="input"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <PasswordField
            name="newPassword"
            label="Nova senha"
            value={newPassword}
            onChange={setNewPassword}
            confirmName="confirmPassword"
            confirmLabel="Confirmar nova senha"
            confirmValue={confirmPassword}
            onConfirmChange={setConfirmPassword}
          />
          <button className="btn btn--primary" type="submit" disabled={savingPassword}>
            {savingPassword ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">
          <Icon name="box-arrow-right" /> Sessão
        </h2>
        <button className="btn btn--ghost" id="btn-logout" onClick={onLogout}>
          Sair da conta
        </button>
      </section>

      <section className="card" style={{ borderColor: 'var(--danger)' }}>
        <h2 className="card-title" style={{ color: 'var(--danger)' }}>
          <Icon name="exclamation-octagon" /> Zona de perigo
        </h2>
        <p className="muted" style={{ fontSize: '.85rem', marginBottom: 12 }}>
          Excluir sua conta remove seus dados pessoais de forma permanente (LGPD). Solicitações em
          andamento serão canceladas e moedas reservadas, devolvidas. Esta ação não pode ser
          desfeita.
        </p>
        <button className="btn btn--ghost" id="btn-delete" style={{ color: 'var(--danger)' }} onClick={onAskDelete}>
          Excluir minha conta
        </button>
      </section>

      {confirmingDelete && (
        <Sheet title="Confirmar exclusão da conta" onClose={() => setConfirmingDelete(false)}>
          <form id="delete-form" onSubmit={onDelete}>
            <div className="field">
              <label className="field__label">Digite sua senha para confirmar</label>
              <input
                className="input"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <button
              className="btn btn--primary btn--block"
              type="submit"
              disabled={deleting}
              style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
            >
              {deleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </button>
          </form>
        </Sheet>
      )}
    </>
  );
}
