/** Rótulos em português para os códigos de domínio e utilitários de data. */

export const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
  EXPERT: 'Especialista',
};

export const LEARNING_LEVEL_LABELS: Record<string, string> = {
  NONE: 'Nenhum conhecimento',
  BEGINNER: 'Iniciante',
  INTERMEDIATE: 'Intermediário',
  ADVANCED: 'Avançado',
};

export const MODALITY_LABELS: Record<string, string> = {
  ONLINE: 'Online',
  IN_PERSON: 'Presencial',
  BOTH: 'Online e presencial',
};

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
  UNDISCLOSED: 'Prefiro não informar',
  ANY: 'Indiferente',
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  NIGHT: 'Noite',
  WEEKEND: 'Fim de semana',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceita',
  REJECTED: 'Recusada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Concluída',
};

export const TX_LABELS: Record<string, string> = {
  PURCHASE: 'Compra de moedas',
  EARNING: 'Recebimento',
  SPEND: 'Pagamento',
  LOCK: 'Reserva',
  UNLOCK: 'Estorno',
  REFUND: 'Reembolso',
  BONUS: 'Bônus',
};

export function label(map: Record<string, string>, key: string | null | undefined): string {
  if (!key) return '';
  return map[key] ?? key;
}

/** Ícone (Bootstrap Icons) correspondente a cada categoria de habilidade. */
export const CATEGORY_ICONS: Record<string, string> = {
  musica: 'music-note-beamed',
  idiomas: 'translate',
  tecnologia: 'cpu',
  artesanato: 'scissors',
  culinaria: 'egg-fried',
  fotografia: 'camera',
  negocios: 'graph-up-arrow',
  design: 'palette',
  esportes: 'trophy',
  'bem-estar': 'heart-pulse',
  academico: 'book',
  outros: 'three-dots',
};

/** Retorna o nome do ícone Bootstrap para o slug de categoria informado. */
export function categoryIconName(slug?: string | null): string {
  return (slug && CATEGORY_ICONS[slug]) || 'tag-fill';
}

/** Calcula tempo relativo (ex.: "há 3 dias"). */
export function timeAgo(date: string | Date): string {
  const d = new Date(date).getTime();
  const diff = Date.now() - d;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'agora mesmo';
  const min = Math.floor(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} dia${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? 'es' : ''}`;
  return `há ${Math.floor(months / 12)} ano(s)`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
