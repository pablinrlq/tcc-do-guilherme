/** Avatar do usuário: foto quando existe, senão as iniciais do nome. */
export interface AvatarUser {
  name?: string | null;
  avatarUrl?: string | null;
}

export function Avatar({
  user,
  size = 'md',
}: {
  user: AvatarUser | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls = `avatar avatar--${size}`;
  if (user?.avatarUrl) {
    return <img className={cls} src={user.avatarUrl} alt={user.name ?? ''} loading="lazy" />;
  }
  const initials = (user?.name || '?')
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0] || '')
    .join('')
    .toUpperCase();
  return <div className={cls}>{initials}</div>;
}
