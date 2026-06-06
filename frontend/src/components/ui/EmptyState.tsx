/** Estado vazio com ícone, título e subtítulo opcional. */
import { Icon } from './Icon';

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">
        <Icon name={icon} />
      </div>
      <div className="empty-state__title">{title}</div>
      {subtitle ? <div>{subtitle}</div> : null}
    </div>
  );
}
