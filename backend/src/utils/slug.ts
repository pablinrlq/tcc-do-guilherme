/**
 * Gera um "slug" amigável a URL a partir de um texto, removendo acentos
 * e caracteres especiais. Ex.: "Marketing Digital" → "marketing-digital".
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
