/** Selo do tipo de match (perfeito, parcial ou aula por moedas). */
import { Icon } from './Icon';

const MAP: Record<string, [string, string]> = {
  PERFECT: ['perfect', 'Match perfeito'],
  PARTIAL: ['partial', 'Match parcial'],
  COIN_ONLY: ['coin', 'Aula por moedas'],
};

export function MatchBadge({ match }: { match: { type: string } }) {
  const [cls, text] = MAP[match.type] || MAP.COIN_ONLY;
  return (
    <span className={`match-badge match-badge--${cls}`}>
      <Icon name="lightning-charge-fill" /> {text}
    </span>
  );
}
