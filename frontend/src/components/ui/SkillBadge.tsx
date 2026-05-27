/** Etiqueta de habilidade (ensina, aprende ou neutra). */
import { Icon } from './Icon';

export function SkillBadge({
  name,
  kind = 'neutral',
}: {
  name: string;
  kind?: 'teach' | 'learn' | 'neutral';
}) {
  const cls = kind === 'teach' ? 'skill-badge--teach' : kind === 'learn' ? 'skill-badge--learn' : '';
  const ic = kind === 'teach' ? 'mortarboard-fill' : kind === 'learn' ? 'book-half' : 'tag-fill';
  return (
    <span className={`skill-badge ${cls}`}>
      <Icon name={ic} /> {name}
    </span>
  );
}
