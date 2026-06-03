/** Lista de usuários favoritados pelo usuário autenticado. */
import { useEffect, useState } from 'react';
import { UserCard } from '../components/UserCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { SkeletonCards } from '../components/ui/SkeletonCards';
import { api } from '../services/api';

export function Favorites() {
  const [items, setItems] = useState<any[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/users/me/favorites')
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <h1 className="page-title">
        <Icon name="heart-fill" /> Favoritos
      </h1>
      <p className="page-subtitle">Pessoas que você salvou para revisitar</p>
      <div id="fav-list">
        {error ? (
          <EmptyState
            icon="exclamation-triangle"
            title="Erro ao carregar favoritos"
            subtitle="Tente novamente."
          />
        ) : items === null ? (
          <SkeletonCards count={2} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="heart"
            title="Nenhum favorito ainda"
            subtitle="Toque no coração no perfil de alguém para salvá-lo aqui."
          />
        ) : (
          items.map((u) => <UserCard key={u.id} user={u} />)
        )}
      </div>
    </>
  );
}
