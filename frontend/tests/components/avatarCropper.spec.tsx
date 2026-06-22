import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AvatarCropper } from '../../src/components/ui/AvatarCropper';

// jsdom não implementa pointer capture — stub no protótipo
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(HTMLElement.prototype, 'releasePointerCapture', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Dispara onLoad na img do cropper e define naturalWidth/Height. */
function loadImage(w = 400, h = 400) {
  const img = document.querySelector('.cropper img') as HTMLImageElement;
  Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true });
  Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true });
  fireEvent.load(img);
}

describe('AvatarCropper', () => {
  it('renderiza title, botões e range de zoom', () => {
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Ajustar foto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom')).toBeInTheDocument();
  });

  it('chama onCancel ao clicar em Cancelar', () => {
    const onCancel = vi.fn();
    render(<AvatarCropper src="/img.jpg" onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('onScaleChange sem naturalW não faz nada (retorno antecipado)', () => {
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    // Sem carregar a imagem, natural.w === 0 → onScaleChange retorna imediatamente
    const range = screen.getByLabelText('Zoom');
    fireEvent.change(range, { target: { value: '2' } });
    expect(range).toBeInTheDocument(); // sem crash
  });

  it('carrega imagem e permite ajuste de zoom', () => {
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    loadImage(400, 400);
    const range = screen.getByLabelText('Zoom') as HTMLInputElement;
    const newScale = parseFloat(range.min) * 2;
    fireEvent.change(range, { target: { value: String(newScale) } });
    expect(range).toBeInTheDocument(); // sem crash
  });

  it('drag: pointerDown → pointerMove → pointerUp sem crash', () => {
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    loadImage();
    const stage = document.querySelector('.cropper__stage') as HTMLElement;
    fireEvent.pointerDown(stage, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(stage, { clientX: 115, clientY: 110, pointerId: 1 });
    fireEvent.pointerUp(stage, { clientX: 115, clientY: 110, pointerId: 1 });
    expect(stage).toBeInTheDocument();
  });

  it('pointerMove sem pointerDown anterior não quebra (dragRef null)', () => {
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    loadImage();
    const stage = document.querySelector('.cropper__stage') as HTMLElement;
    fireEvent.pointerMove(stage, { clientX: 50, clientY: 50 });
    expect(stage).toBeInTheDocument();
  });

  it('pointerCancel encerra o drag', () => {
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    loadImage();
    const stage = document.querySelector('.cropper__stage') as HTMLElement;
    fireEvent.pointerDown(stage, { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerCancel(stage, { pointerId: 1 });
    fireEvent.pointerMove(stage, { clientX: 200, clientY: 200 });
    expect(stage).toBeInTheDocument();
  });

  it('Aplicar antes de carregar imagem não chama onConfirm', async () => {
    const onConfirm = vi.fn();
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={onConfirm} />);
    // natural.w === 0 → retorno antecipado
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Aplicar com canvas mock chama onConfirm com blob e dataUrl', async () => {
    const onConfirm = vi.fn();
    const mockBlob = new Blob(['fake'], { type: 'image/jpeg' });
    const mockCtx = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((cb: (b: Blob | null) => void) => cb(mockBlob)),
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,test'),
    };
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLElement;
      return origCreate(tag);
    });

    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={onConfirm} outputSize={256} />);
    loadImage();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
    });

    expect(onConfirm).toHaveBeenCalledWith(mockBlob, 'data:image/jpeg;base64,test');
  });

  it('touchmove no stage não quebra (touchmove listener registrado)', () => {
    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    const stage = document.querySelector('.cropper__stage') as HTMLElement;
    const touchMoveEvent = new TouchEvent('touchmove', { cancelable: true });
    stage.dispatchEvent(touchMoveEvent);
    expect(stage).toBeInTheDocument();
  });

  it('botão mostra "Processando..." e fica desabilitado enquanto busy=true', async () => {
    let resolveToBlob!: (b: Blob) => void;
    const mockBlob = new Blob([''], { type: 'image/jpeg' });
    const mockCtx = { fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockCtx),
      toBlob: vi.fn().mockImplementation((cb: (b: Blob) => void) => {
        // não chama o callback imediatamente → componente fica em estado busy
        resolveToBlob = cb;
      }),
      toDataURL: vi.fn().mockReturnValue('data:image/jpeg;base64,x'),
    };
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'canvas') return mockCanvas as unknown as HTMLElement;
      return origCreate(tag);
    });

    render(<AvatarCropper src="/img.jpg" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    loadImage();

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));

    // enquanto o toBlob está pendente → busy=true → mostra 'Processando...'
    expect(screen.getByRole('button', { name: 'Processando...' })).toBeDisabled();

    // resolve para limpar o estado
    await act(async () => {
      resolveToBlob(mockBlob);
    });
  });
});
