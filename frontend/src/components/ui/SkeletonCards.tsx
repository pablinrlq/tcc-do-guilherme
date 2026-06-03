/** Cards "esqueleto" exibidos durante o carregamento de listas. */
export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton skeleton-card"></div>
      ))}
    </>
  );
}
