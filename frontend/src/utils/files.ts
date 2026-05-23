/** Validações de arquivos enviados pelo usuário. */

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Valida uma imagem antes do upload (tipo e tamanho).
 * Retorna a mensagem de erro, ou `null` quando o arquivo é válido —
 * espelha a validação do backend para dar feedback imediato.
 */
export function validateImageFile(file: File, maxMb = 5): string | null {
  if (!IMAGE_TYPES.includes(file.type)) {
    return 'Formato inválido. Use JPG, PNG, WEBP ou GIF.';
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `A imagem deve ter no máximo ${maxMb} MB.`;
  }
  return null;
}
