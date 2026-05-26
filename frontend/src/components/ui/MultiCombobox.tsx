/** Combobox de múltipla seleção: aceita apenas valores existentes na lista. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from './Icon';
import type { ComboboxOption } from './Combobox';

interface Props {
  options: ComboboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  max?: number;
}

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function MultiCombobox({
  options,
  values,
  onChange,
  placeholder,
  emptyMessage = 'Nenhum resultado',
  max,
}: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedSet = useMemo(() => new Set(values), [values]);
  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    const base = options.filter((o) => !selectedSet.has(o.value));
    if (!q) return base.slice(0, 100);
    return base.filter((o) => normalize(o.label).includes(q)).slice(0, 100);
  }, [options, selectedSet, query]);

  const labelByValue = useMemo(() => {
    const m = new Map<string, string>();
    options.forEach((o) => m.set(o.value, o.label));
    return m;
  }, [options]);

  const reachedMax = !!max && values.length >= max;

  const add = (opt: ComboboxOption) => {
    /* v8 ignore next */
    if (reachedMax) return;
    onChange([...values, opt.value]);
    setQuery('');
    setActiveIdx(0);
  };

  const remove = (val: string) => {
    onChange(values.filter((v) => v !== val));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && filtered[activeIdx]) {
        e.preventDefault();
        add(filtered[activeIdx]);
      }
    } else if (e.key === 'Backspace' && !query && values.length) {
      remove(values[values.length - 1]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="combobox" ref={wrapperRef}>
      <div className="chips" style={{ marginBottom: values.length ? 8 : 0 }}>
        {values.map((v) => (
          <span className="chip selected" key={v}>
            {labelByValue.get(v) ?? v}
            <b
              style={{ marginLeft: 4, cursor: 'pointer' }}
              onClick={() => remove(v)}
              aria-label={`Remover ${labelByValue.get(v) ?? v}`}
            >
              <Icon name="x-lg" />
            </b>
          </span>
        ))}
      </div>
      <input
        className="input"
        type="text"
        value={query}
        placeholder={reachedMax ? `Limite de ${max} atingido` : placeholder}
        disabled={reachedMax}
        autoComplete="off"
        onFocus={() => {
          setOpen(true);
          setActiveIdx(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIdx(0);
        }}
        onKeyDown={onKeyDown}
      />
      {open && !reachedMax && (
        <div className="combobox__list" role="listbox">
          {filtered.length === 0 ? (
            <div className="combobox__empty">{emptyMessage}</div>
          ) : (
            filtered.map((opt, idx) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={false}
                className={`combobox__item${idx === activeIdx ? ' combobox__item--active' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(opt);
                }}
                onMouseEnter={() => setActiveIdx(idx)}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
