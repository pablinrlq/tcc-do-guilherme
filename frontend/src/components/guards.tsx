/** Guards de rota: proteção por autenticação e redirecionamento de logados. */
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from './ui/Spinner';

/** Tela cheia de carregamento exibida enquanto a sessão é restaurada. */
function BootSplash() {
  return (
    <div className="auth-screen">
      <Spinner />
    </div>
  );
}

/** Rotas protegidas: exige sessão ativa, senão redireciona para /login. */
export function RequireAuth() {
  const { status } = useAuth();
  if (status === 'loading') return <BootSplash />;
  if (status === 'guest') return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Login/registro: usuários já autenticados vão direto para o app. */
export function RedirectIfAuthed() {
  const { status, user } = useAuth();
  if (status === 'loading') return <BootSplash />;
  if (status === 'authed') {
    return <Navigate to={user!.onboardingCompleted ? '/feed' : '/onboarding'} replace />;
  }
  return <Outlet />;
}
