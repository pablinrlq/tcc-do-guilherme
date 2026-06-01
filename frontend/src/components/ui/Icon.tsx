/** Ícone do Bootstrap Icons (ex.: <Icon name="house-door" />). */
export function Icon({ name, extra }: { name: string; extra?: string }) {
  return <i className={`bi bi-${name}${extra ? ' ' + extra : ''}`} aria-hidden="true"></i>;
}
