/** Página 404. */
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';

export function NotFound() {
  return (
    <div className="auth-screen">
      <EmptyState icon="compass" title="Página não encontrada" />
      <Link className="btn btn--primary btn--block" to="/feed">
        Ir para o feed
      </Link>
    </div>
  );
}
