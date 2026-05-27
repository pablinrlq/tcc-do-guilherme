/** Exibição de avaliação em 5 estrelas (arredonda para a estrela cheia). */
export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`bi bi-star${i <= full ? '-fill' : ''}`}></i>
      ))}
    </span>
  );
}
