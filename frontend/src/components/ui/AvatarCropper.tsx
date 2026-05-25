/** Modal de crop de avatar (recorte circular via canvas). Retorna um Blob JPEG. */
import { useEffect, useRef, useState } from 'react';
import { Sheet } from './Sheet';
import { Icon } from './Icon';

interface Props {
  src: string;
  onCancel: () => void;
  onConfirm: (blob: Blob, dataUrl: string) => void;
  outputSize?: number;
}

const STAGE = 320;

export function AvatarCropper({ src, onCancel, onConfirm, outputSize = 512 }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [minScale, setMinScale] = useState(1);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const onImgLoad = () => {
    const img = imgRef.current;
    /* v8 ignore next */
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNatural({ w, h });
    // escala mínima cobre o palco
    const min = Math.max(STAGE / w, STAGE / h);
    setMinScale(min);
    setScale(min);
    // centraliza
    setPos({ x: (STAGE - w * min) / 2, y: (STAGE - h * min) / 2 });
  };

  const clamp = (p: { x: number; y: number }, s: number) => {
    const w = natural.w * s;
    const h = natural.h * s;
    return {
      x: Math.min(0, Math.max(STAGE - w, p.x)),
      y: Math.min(0, Math.max(STAGE - h, p.y)),
    };
  };

  const onScaleChange = (next: number) => {
    if (!natural.w) return;
    // mantém o centro da imagem visível ao escalar
    const cx = STAGE / 2;
    const cy = STAGE / 2;
    const rx = (cx - pos.x) / scale;
    const ry = (cy - pos.y) / scale;
    const newPos = { x: cx - rx * next, y: cy - ry * next };
    setScale(next);
    setPos(clamp(newPos, next));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    setPos(clamp({ x: d.px + (e.clientX - d.x), y: d.py + (e.clientY - d.y) }, scale));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragRef.current = null;
  };

  useEffect(() => {
    // bloqueia o gesto padrão de pan no touch
    const stage = stageRef.current;
    /* v8 ignore next */
    if (!stage) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    stage.addEventListener('touchmove', prevent, { passive: false });
    return () => stage.removeEventListener('touchmove', prevent);
  }, []);

  const confirm = async () => {
    const img = imgRef.current;
    if (!img || !natural.w) return;
    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      /* v8 ignore next */
      if (!ctx) throw new Error('Sem suporte a canvas');
      const ratio = outputSize / STAGE;
      // posição/escala no espaço de saída
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, outputSize, outputSize);
      ctx.drawImage(
        img,
        0,
        0,
        natural.w,
        natural.h,
        pos.x * ratio,
        pos.y * ratio,
        natural.w * scale * ratio,
        natural.h * scale * ratio,
      );
      /* v8 ignore start */
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao gerar imagem'))), 'image/jpeg', 0.9),
      );
      /* v8 ignore stop */
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onConfirm(blob, dataUrl);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="Ajustar foto" onClose={onCancel}>
      <div className="cropper">
        <div
          className="cropper__stage"
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Pré-visualização"
            onLoad={onImgLoad}
            draggable={false}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            }}
          />
          <div className="cropper__mask" />
        </div>
        <div className="cropper__controls">
          <Icon name="zoom-out" />
          <input
            type="range"
            min={minScale}
            max={minScale * 4}
            step={0.01}
            value={scale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            aria-label="Zoom"
          />
          <Icon name="zoom-in" />
        </div>
        <div className="cropper__actions">
          <button type="button" className="btn btn--secondary full" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button type="button" className="btn btn--primary full" onClick={confirm} disabled={busy}>
            {busy ? 'Processando...' : 'Aplicar'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
