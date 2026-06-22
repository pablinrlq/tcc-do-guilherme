import { describe, it, expect } from 'vitest';
import { validateImageFile } from '../../src/utils/files';

function fakeFile(type: string, sizeBytes: number): File {
  const file = new File(['x'], 'foto.png', { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

describe('validateImageFile', () => {
  it('aceita os formatos de imagem suportados dentro do limite', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/gif']) {
      expect(validateImageFile(fakeFile(type, 1024))).toBeNull();
    }
  });

  it('rejeita formatos não suportados', () => {
    expect(validateImageFile(fakeFile('application/pdf', 1024))).toMatch(/formato inválido/i);
    expect(validateImageFile(fakeFile('image/svg+xml', 1024))).toMatch(/formato inválido/i);
  });

  it('rejeita arquivos acima do limite (padrão 5 MB)', () => {
    expect(validateImageFile(fakeFile('image/png', 6 * 1024 * 1024))).toMatch(/no máximo 5 MB/);
  });

  it('aceita limite customizado', () => {
    expect(validateImageFile(fakeFile('image/png', 3 * 1024 * 1024), 2)).toMatch(/no máximo 2 MB/);
    expect(validateImageFile(fakeFile('image/png', 1024), 2)).toBeNull();
  });
});
