/** Combobox/autocomplete que aceita apenas valores existentes na lista. */
import { useEffect, useMemo, useRef, useState } from 'react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface Props {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  id?: string;
  required?: boolean;
}

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  loading,
  emptyMessage = 'Nenhum resultado',
  id,
  required,
}: Props) {
  const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.label ?? '');
  }, [selected?.label]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpen(false);
        // Se o texto não casa com uma opção válida, reverte para a seleção atual.
        setQuery(selected?.label ?? '');
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [selected?.label]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return options.slice(0, 100);
    return options.filter((o) => normalize(o.label).includes(q)).slice(0, 100);
  }, [options, query]);

  const select = (opt: ComboboxOption) => {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
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
        select(filtered[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery(selected?.label ?? '');
    }
  };

  return (
    <div className="combobox" ref={wrapperRef}>
      <input
        id={id}
        className="input"
        type="text"
        value={query}
        placeholder={loading ? 'Carregando...' : placeholder}
        disabled={disabled || loading}
        autoComplete="off"
        required={required}
        onFocus={() => {
          setOpen(true);
          setActiveIdx(0);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIdx(0);
          // limpa seleção quando o usuário começa a digitar diferente
          if (selected && e.target.value !== selected.label) onChange('');
        }}
        onKeyDown={onKeyDown}
      />
      {open && !disabled && !loading && (
        <div className="combobox__list" role="listbox">
          {filtered.length === 0 ? (
            <div className="combobox__empty">{emptyMessage}</div>
          ) : (
            filtered.map((opt, idx) => (
              <div
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                className={`combobox__item${idx === activeIdx ? ' combobox__item--active' : ''}${
                  opt.value === value ? ' combobox__item--selected' : ''
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(opt);
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
