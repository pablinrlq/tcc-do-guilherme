/** Painel administrativo: visão geral, usuários, categorias e habilidades. */
import { useCallback, useEffect, useState } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Icon } from '../components/ui/Icon';
import { Sheet } from '../components/ui/Sheet';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api, ApiError } from '../services/api';

type Tab = 'overview' | 'users' | 'categories' | 'skills' | 'reports';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

function StatCard({ value, label, icon }: { value: string | number; label: string; icon: string }) {
  return (
    <div className="card text-center">
      <div style={{ fontSize: '1.7rem', color: 'var(--color-primary)' }}>
        <Icon name={icon} />
      </div>
      <div className="stat__value" style={{ fontSize: '1.6rem' }}>
        {value}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Aba: visão geral
// ---------------------------------------------------------------------------
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/stats/overview')
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Erro ao carregar estatísticas'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <EmptyState icon="exclamation-triangle" title={error} subtitle="Tente novamente." />;
  if (!stats) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <StatCard value={stats.totalUsers} label="Usuários" icon="people-fill" />
      <StatCard value={stats.onboardedUsers} label="Perfis completos" icon="check-circle-fill" />
      <StatCard value={stats.totalSkills} label="Habilidades" icon="tools" />
      <StatCard value={stats.totalRequests} label="Solicitações" icon="arrow-left-right" />
      <StatCard value={stats.completedExchanges} label="Trocas concluídas" icon="trophy-fill" />
      <StatCard value={stats.totalReviews} label="Avaliações" icon="star-fill" />
      <StatCard value={stats.averageRating} label="Nota média" icon="bar-chart-fill" />
      <StatCard value={stats.coinsInCirculation} label="Moedas em circulação" icon="coin" />
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Aba: usuários
// ---------------------------------------------------------------------------
function UsersTab() {
  const { user: me } = useAuth();
  const { toast, confirm } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string, p: number) => {
    setRes(null);
    setError(null);
    try {
      setRes(await api.get(`/admin/users?q=${encodeURIComponent(query)}&page=${p}&limit=15`));
    } catch (err) {
      setError(errorMessage(err, 'Erro ao carregar usuários'));
    }
  }, []);

  useEffect(() => {
    load(q, page);
  }, [load, q, page]);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setQ(String(data.get('q') || '').trim());
    setPage(1);
  };

  const toggleUser = async (u: any) => {
    const ok = await confirm(
      u.isActive
        ? `Desativar a conta de ${u.name}? A pessoa não conseguirá mais entrar e sairá do feed e da busca.`
        : `Reativar a conta de ${u.name}?`,
      u.isActive ? 'Desativar' : 'Reativar',
    );
    if (!ok) return;
    try {
      await api.patch(`/admin/users/${u.id}/status`, { isActive: !u.isActive });
      toast(u.isActive ? 'Conta desativada' : 'Conta reativada', 'success');
      setPage(1);
      load(q, 1);
    } catch (err) {
      toast(errorMessage(err, 'Erro ao atualizar usuário'), 'error');
    }
  };

  return (
    <>
      <form id="user-search" className="row gap-8" style={{ marginBottom: 12 }} onSubmit={onSearch}>
        <input className="input full" name="q" placeholder="Buscar por nome ou e-mail" defaultValue={q} />
        <button className="btn btn--secondary" type="submit">
          <Icon name="search" />
        </button>
      </form>
      <div id="user-list">
        {error ? (
          <EmptyState icon="exclamation-triangle" title={error} subtitle="Tente novamente." />
        ) : !res ? (
          <Spinner />
        ) : !res.items.length ? (
          <EmptyState icon="people" title="Nenhum usuário encontrado" />
        ) : (
          <>
            {res.items.map((u: any) => (
              <div className="card row gap-8" style={{ alignItems: 'center' }} data-user={u.id} key={u.id}>
                <Avatar user={u} size="sm" />
                <div className="full" style={{ minWidth: 0 }}>
                  <strong>{u.name}</strong>
                  {u.role === 'ADMIN' && (
                    <span className="skill-badge">
                      <Icon name="shield-fill" /> Admin
                    </span>
                  )}
                  {!u.isActive && (
                    <span className="skill-badge" style={{ color: 'var(--danger)' }}>
                      <Icon name="slash-circle" /> Desativada
                    </span>
                  )}
                  <div className="muted" style={{ fontSize: '.82rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {u.email}
                  </div>
                </div>
                {u.id !== me?.id && (
                  <button className="btn btn--ghost" data-toggle onClick={() => toggleUser(u)}>
                    {u.isActive ? 'Desativar' : 'Reativar'}
                  </button>
                )}
              </div>
            ))}
            {res.hasMore && (
              <button className="btn btn--secondary btn--block" data-more onClick={() => setPage(page + 1)}>
                Carregar mais
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
//  Aba: categorias
// ---------------------------------------------------------------------------
function CategoryForm({
  values,
  onSubmit,
}: {
  values?: { name?: string; icon?: string; color?: string };
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form id="cat-form" onSubmit={onSubmit}>
      <div className="field">
        <label className="field__label">Nome</label>
        <input className="input" name="name" minLength={2} maxLength={40} defaultValue={values?.name ?? ''} required />
      </div>
      <div className="row gap-8">
        <div className="field full">
          <label className="field__label">Ícone (emoji)</label>
          <input className="input" name="icon" maxLength={8} defaultValue={values?.icon ?? ''} placeholder="🎻" />
        </div>
        <div className="field full">
          <label className="field__label">Cor (#RRGGBB)</label>
          <input
            className="input"
            name="color"
            pattern="^#[0-9A-Fa-f]{6}$"
            defaultValue={values?.color ?? ''}
            placeholder="#F97316"
          />
        </div>
      </div>
      <button className="btn btn--primary btn--block" type="submit">
        Salvar
      </button>
    </form>
  );
}

function CategoriesTab() {
  const { toast, confirm } = useToast();
  const [categories, setCategories] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<null | { id?: string; values?: any }>(null);

  const load = useCallback(async () => {
    setCategories(null);
    setError(null);
    try {
      setCategories((await api.get('/categories')).categories);
    } catch (err) {
      setError(errorMessage(err, 'Erro ao carregar categorias'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { name: String(data.get('name')).trim() };
    const iconVal = String(data.get('icon') || '').trim();
    const colorVal = String(data.get('color') || '').trim();
    if (iconVal) payload.icon = iconVal;
    if (colorVal) payload.color = colorVal;
    try {
      if (editing?.id) await api.patch(`/admin/categories/${editing.id}`, payload);
      else await api.post('/admin/categories', payload);
      setEditing(null);
      toast('Categoria salva', 'success');
      load();
    } catch (err) {
      toast(errorMessage(err, 'Erro ao salvar categoria'), 'error');
    }
  };

  const deleteCategory = async (c: any) => {
    if (!(await confirm(`Excluir a categoria "${c.name}"?`, 'Excluir'))) return;
    try {
      await api.del(`/admin/categories/${c.id}`);
      toast('Categoria excluída', 'success');
      load();
    } catch (err) {
      toast(errorMessage(err, 'Erro ao excluir categoria'), 'error');
    }
  };

  return (
    <>
      <button
        className="btn btn--primary btn--block"
        id="cat-new"
        style={{ marginBottom: 12 }}
        onClick={() => setEditing({})}
      >
        <Icon name="plus-lg" /> Nova categoria
      </button>
      <div id="cat-list">
        {error ? (
          <EmptyState icon="exclamation-triangle" title={error} subtitle="Tente novamente." />
        ) : !categories ? (
          <Spinner />
        ) : !categories.length ? (
          <EmptyState icon="tags" title="Nenhuma categoria cadastrada" />
        ) : (
          categories.map((c: any) => (
            <div className="card row gap-8" style={{ alignItems: 'center' }} data-cat={c.id} key={c.id}>
              <span style={{ fontSize: '1.3rem' }}>{c.icon ?? '🏷️'}</span>
              <div className="full">
                <strong>{c.name}</strong>
                <div className="muted" style={{ fontSize: '.82rem' }}>
                  {c.skillsCount ?? 0} habilidade(s)
                </div>
              </div>
              <button className="icon-btn" data-edit title="Editar" onClick={() => setEditing({ id: c.id, values: c })}>
                <Icon name="pencil" />
              </button>
              <button className="icon-btn" data-del title="Excluir" onClick={() => deleteCategory(c)}>
                <Icon name="trash" />
              </button>
            </div>
          ))
        )}
      </div>
      {editing && (
        <Sheet title={editing.id ? 'Editar categoria' : 'Nova categoria'} onClose={() => setEditing(null)}>
          <CategoryForm values={editing.values} onSubmit={submitCategory} />
        </Sheet>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
//  Aba: habilidades (catálogo)
// ---------------------------------------------------------------------------
function SkillForm({
  categories,
  values,
  onSubmit,
}: {
  categories: any[];
  values?: { name?: string; categoryId?: string };
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form id="skill-form" onSubmit={onSubmit}>
      <div className="field">
        <label className="field__label">Nome</label>
        <input className="input" name="name" minLength={2} maxLength={60} defaultValue={values?.name ?? ''} required />
      </div>
      <div className="field">
        <label className="field__label">Categoria</label>
        <select className="input" name="categoryId" defaultValue={values?.categoryId ?? categories[0]?.id} required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn--primary btn--block" type="submit">
        Salvar
      </button>
    </form>
  );
}

function SkillsTab() {
  const { toast, confirm } = useToast();
  const [q, setQ] = useState('');
  const [skills, setSkills] = useState<any[] | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<null | { id?: string; values?: any }>(null);

  const load = useCallback(async (query: string) => {
    setSkills(null);
    setError(null);
    try {
      const [{ skills: items }, { categories: cats }] = await Promise.all([
        api.get(`/skills?q=${encodeURIComponent(query)}`),
        api.get('/categories'),
      ]);
      setSkills(items);
      setCategories(cats);
    } catch (err) {
      setError(errorMessage(err, 'Erro ao carregar habilidades'));
    }
  }, []);

  useEffect(() => {
    load(q);
  }, [load, q]);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setQ(String(data.get('q') || '').trim());
  };

  const newSkill = () => {
    if (!categories.length) {
      toast('Cadastre uma categoria antes', 'error');
      return;
    }
    setEditing({});
  };

  const submitSkill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const payload = {
      name: String(data.get('name')).trim(),
      categoryId: String(data.get('categoryId')),
    };
    try {
      if (editing?.id) await api.patch(`/admin/skills/${editing.id}`, payload);
      else await api.post('/admin/skills', payload);
      setEditing(null);
      toast('Habilidade salva', 'success');
      load(q);
    } catch (err) {
      toast(errorMessage(err, 'Erro ao salvar habilidade'), 'error');
    }
  };

  const deleteSkill = async (s: any) => {
    if (!(await confirm(`Excluir a habilidade "${s.name}"?`, 'Excluir'))) return;
    try {
      await api.del(`/admin/skills/${s.id}`);
      toast('Habilidade excluída', 'success');
      load(q);
    } catch (err) {
      toast(errorMessage(err, 'Erro ao excluir habilidade'), 'error');
    }
  };

  return (
    <>
      <form id="skill-search" className="row gap-8" style={{ marginBottom: 12 }} onSubmit={onSearch}>
        <input className="input full" name="q" placeholder="Buscar habilidade" defaultValue={q} />
        <button className="btn btn--secondary" type="submit">
          <Icon name="search" />
        </button>
      </form>
      {/* Desabilitado durante o carregamento: o clique depende das categorias já buscadas */}
      <button
        className="btn btn--primary btn--block"
        id="skill-new"
        style={{ marginBottom: 12 }}
        disabled={!skills && !error}
        onClick={newSkill}
      >
        <Icon name="plus-lg" /> Nova habilidade
      </button>
      <div id="skill-list">
        {error ? (
          <EmptyState icon="exclamation-triangle" title={error} subtitle="Tente novamente." />
        ) : !skills ? (
          <Spinner />
        ) : !skills.length ? (
          <EmptyState icon="tools" title="Nenhuma habilidade encontrada" />
        ) : (
          skills.map((s: any) => (
            <div className="card row gap-8" style={{ alignItems: 'center' }} data-skill={s.id} key={s.id}>
              <div className="full">
                <strong>{s.name}</strong>
                <div className="muted" style={{ fontSize: '.82rem' }}>
                  {s.category?.name ?? 'Sem categoria'}
                </div>
              </div>
              <button
                className="icon-btn"
                data-edit
                title="Editar"
                onClick={() => setEditing({ id: s.id, values: { name: s.name, categoryId: s.category?.id } })}
              >
                <Icon name="pencil" />
              </button>
              <button className="icon-btn" data-del title="Excluir" onClick={() => deleteSkill(s)}>
                <Icon name="trash" />
              </button>
            </div>
          ))
        )}
      </div>
      {editing && (
        <Sheet title={editing.id ? 'Editar habilidade' : 'Nova habilidade'} onClose={() => setEditing(null)}>
          <SkillForm categories={categories} values={editing.values} onSubmit={submitSkill} />
        </Sheet>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
//  Aba: denúncias
// ---------------------------------------------------------------------------
const REPORT_TYPE_LABELS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: 'Conteúdo inapropriado',
  HARASSMENT: 'Assédio ou abuso',
  SCAM: 'Golpe ou fraude',
  FAKE_PROFILE: 'Perfil falso',
  SPAM: 'Spam',
  OTHER: 'Outro',
};

const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  UNDER_REVIEW: 'Em análise',
  RESOLVED: 'Resolvida',
  DISMISSED: 'Encerrada',
};

const REPORT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--color-primary)',
  UNDER_REVIEW: '#f59e0b',
  RESOLVED: 'var(--success)',
  DISMISSED: 'var(--surface-3)',
};

function ReportsTab() {
  const { toast, confirm } = useToast();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');

  const load = useCallback(
    async (status: string, p: number) => {
      setRes(null);
      setError(null);
      try {
        const qs = status ? `status=${encodeURIComponent(status)}&` : '';
        setRes(await api.get(`/reports/admin?${qs}page=${p}&limit=15`));
      } catch (err) {
        setError(errorMessage(err, 'Erro ao carregar denúncias'));
      }
    },
    [],
  );

  useEffect(() => {
    load(statusFilter, page);
  }, [load, statusFilter, page]);

  const onFilterChange = (s: string) => {
    setStatusFilter(s);
    setPage(1);
  };

  const openResolve = (report: any) => {
    setResolving(report);
    setAdminNote('');
  };

  const submitResolve = async (newStatus: 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED') => {
    if (!resolving) return;
    const label = newStatus === 'UNDER_REVIEW' ? 'Em análise' : newStatus === 'RESOLVED' ? 'Resolver' : 'Encerrar';
    const ok = await confirm(
      `Marcar esta denúncia como "${REPORT_STATUS_LABELS[newStatus]}"?`,
      label,
    );
    if (!ok) return;
    try {
      await api.patch(`/reports/admin/${resolving.id}`, { status: newStatus, adminNote });
      toast('Denúncia atualizada', 'success');
      setResolving(null);
      load(statusFilter, page);
    } catch (err) {
      toast(errorMessage(err, 'Erro ao atualizar denúncia'), 'error');
    }
  };

  return (
    <>
      <div className="segmented" style={{ marginBottom: 12 }}>
        {['', 'PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'].map((s) => (
          <button
            key={s}
            className={statusFilter === s ? 'active' : ''}
            onClick={() => onFilterChange(s)}
          >
            {s ? REPORT_STATUS_LABELS[s] : 'Todas'}
          </button>
        ))}
      </div>

      <div id="report-list">
        {error ? (
          <EmptyState icon="exclamation-triangle" title={error} subtitle="Tente novamente." />
        ) : !res ? (
          <Spinner />
        ) : !res.items.length ? (
          <EmptyState icon="flag" title="Nenhuma denúncia encontrada" />
        ) : (
          <>
            {res.items.map((r: any) => (
              <div className="card" data-report={r.id} key={r.id} style={{ marginBottom: 10 }}>
                <div className="row-between" style={{ marginBottom: 6 }}>
                  <span
                    className="skill-badge"
                    style={{ background: REPORT_STATUS_COLORS[r.status] + '22', color: REPORT_STATUS_COLORS[r.status] }}
                  >
                    {REPORT_STATUS_LABELS[r.status]}
                  </span>
                  <span className="muted" style={{ fontSize: '.78rem' }}>
                    {new Date(r.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div style={{ fontSize: '.88rem', marginBottom: 4 }}>
                  <strong>Tipo:</strong> {REPORT_TYPE_LABELS[r.type] ?? r.type}
                </div>

                {r.target && (
                  <div style={{ fontSize: '.88rem', marginBottom: 4 }}>
                    <strong>Denunciado:</strong>{' '}
                    <a href={`/profile/${r.target.id}`} style={{ color: 'var(--color-primary)' }}>
                      {r.target.name}
                    </a>
                  </div>
                )}
                {r.request && (
                  <div style={{ fontSize: '.88rem', marginBottom: 4 }}>
                    <strong>Solicitação:</strong> #{r.request.id.slice(-6)} ({r.request.type})
                  </div>
                )}
                <div style={{ fontSize: '.88rem', marginBottom: 4 }}>
                  <strong>Denunciante:</strong> {r.reporter?.name}
                </div>
                <p className="muted" style={{ fontSize: '.85rem', marginTop: 4 }}>
                  {r.description}
                </p>
                {r.adminNote && (
                  <div
                    style={{
                      fontSize: '.82rem',
                      marginTop: 6,
                      padding: '6px 10px',
                      background: 'var(--surface-2)',
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    <Icon name="chat-left-text" /> <em>{r.adminNote}</em>
                  </div>
                )}

                {r.status !== 'RESOLVED' && r.status !== 'DISMISSED' && (
                  <button
                    className="btn btn--secondary btn--sm"
                    style={{ marginTop: 10 }}
                    onClick={() => openResolve(r)}
                  >
                    <Icon name="pencil-square" /> Gerenciar
                  </button>
                )}
              </div>
            ))}
            {res.hasMore && (
              <button
                className="btn btn--secondary btn--block"
                data-more
                onClick={() => setPage(page + 1)}
              >
                Carregar mais
              </button>
            )}
          </>
        )}
      </div>

      {resolving && (
        <Sheet title="Gerenciar denúncia" onClose={() => setResolving(null)}>
          <div style={{ fontSize: '.9rem', marginBottom: 12 }}>
            <strong>Tipo:</strong> {REPORT_TYPE_LABELS[resolving.type] ?? resolving.type}
            <br />
            <strong>Usuário denunciado:</strong> {resolving.target?.name ?? '—'}
            <br />
            <strong>Descrição:</strong>
            <p className="muted" style={{ marginTop: 4 }}>
              {resolving.description}
            </p>
          </div>
          <div className="field">
            <label className="field__label">Nota interna (opcional)</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Observações internas sobre esta denúncia..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              maxLength={500}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="row gap-8" style={{ marginTop: 4 }}>
            {resolving.status === 'PENDING' && (
              <button className="btn btn--secondary full" onClick={() => submitResolve('UNDER_REVIEW')}>
                <Icon name="eye" /> Em análise
              </button>
            )}
            <button className="btn btn--primary full" onClick={() => submitResolve('RESOLVED')}>
              <Icon name="check-circle" /> Resolver
            </button>
            <button className="btn btn--ghost full" onClick={() => submitResolve('DISMISSED')}>
              <Icon name="x-circle" /> Encerrar
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
//  Página
// ---------------------------------------------------------------------------
const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'users', label: 'Usuários' },
  { key: 'categories', label: 'Categorias' },
  { key: 'skills', label: 'Habilidades' },
  { key: 'reports', label: 'Denúncias' },
];

export function Admin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  if (!isAdmin) {
    return <EmptyState icon="lock-fill" title="Acesso restrito" subtitle="Somente administradores." />;
  }

  return (
    <>
      <h1 className="page-title">Painel administrativo</h1>
      <p className="page-subtitle">Gestão da plataforma</p>
      <div className="segmented" id="admin-tabs">
        {TABS.map((t) => (
          <button key={t.key} data-tab={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <div id="admin-content">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'categories' && <CategoriesTab />}
        {tab === 'skills' && <SkillsTab />}
        {tab === 'reports' && <ReportsTab />}
      </div>
    </>
  );
}
