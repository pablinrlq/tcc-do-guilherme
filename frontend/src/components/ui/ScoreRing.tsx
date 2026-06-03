/** Anel circular com a pontuação de compatibilidade (0–100). */
import type { CSSProperties } from 'react';

export function ScoreRing({ score }: { score: number }) {
  const ring = score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--text-soft)';
  return (
    <div className="score-ring" style={{ '--val': score, '--ring': ring } as CSSProperties}>
      <span>{score}</span>
    </div>
  );
}
