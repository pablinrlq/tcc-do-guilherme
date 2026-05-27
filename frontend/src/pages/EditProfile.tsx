/** Edição do perfil: dados básicos, complementares e foto. */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { AvatarCropper } from '../components/ui/AvatarCropper';
import { Combobox } from '../components/ui/Combobox';
import { Icon } from '../components/ui/Icon';
import { MultiCombobox } from '../components/ui/MultiCombobox';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useBrazilCities, useBrazilStates } from '../hooks/useBrazilLocations';
import { api } from '../services/api';
import { COUNTRIES, normalizeCountry } from '../utils/countries';
import { validateImageFile } from '../utils/files';
import { COMMON_LANGUAGES, normalizeLanguage } from '../utils/languages';
import { AVAILABILITY_LABELS, GENDER_LABELS, MODALITY_LABELS } from '../utils/format';

const AVAILABILITY = ['MORNING', 'AFTERNOON', 'NIGHT', 'WEEKEND'];

export function EditProfile() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [user, setUserData] = useState<any>(null);
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const [city, setCity] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [nationality, setNationality] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);

  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const { states, loading: loadingStates } = useBrazilStates();
  const { cities, loading: loadingCities } = useBrazilCities(stateUf);

  const stateOptions = useMemo(
    () => states.map((s) => ({ value: s.sigla, label: `${s.nome} (${s.sigla})` })),
    [states],
  );
  const cityOptions = useMemo(() => cities.map((c) => ({ value: c, label: c })), [cities]);

  useEffect(() => {
    let cancelled = false;
    api.get('/auth/me').then(({ user: me }) => {
      if (cancelled) return;
      setUserData(me);
      setAvailability(new Set(me.profile?.availability || []));
      setStateUf(me.state || '');
      setCity(me.city || '');
      setNationality(normalizeCountry(me.profile?.nationality || ''));
      const langs: string[] = me.profile?.languages || [];
      setLanguages(
        Array.from(new Set(langs.map(normalizeLanguage).filter(Boolean))),
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) {
    return (
      <div className="row" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  const p = user.profile || {};

  const onAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const invalid = validateImageFile(file, 5);
    if (invalid) {
      toast(invalid, 'error');
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
  };

  const onCropDone = async (blob: Blob) => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    const fd = new FormData();
    fd.append('avatar', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
    try {
      const res = await api.upload('/users/me/avatar', fd);
      setUser(res.user);
      setUserData((prev: any) => ({ ...prev, avatarUrl: res.user.avatarUrl }));
      toast('Foto atualizada!', 'success');
    } catch {
      toast('Erro ao enviar a foto', 'error');
    }
  };

  const onCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const toggleAvailability = (av: string) => {
    setAvailability((prev) => {
      const next = new Set(prev);
      if (next.has(av)) next.delete(av);
      else next.add(av);
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.patch('/users/me', {
        name: fd.get('name'),
        bio: fd.get('bio') || undefined,
        city: city || undefined,
        state: stateUf || undefined,
      });
      const res = await api.patch('/users/me/profile', {
        gender: fd.get('gender') || undefined,
        birthDate: fd.get('birthDate') || undefined,
        nationality: nationality || undefined,
        languages,
        availability: [...availability],
        preferredModality: fd.get('preferredModality') || undefined,
      });
      setUser(res.user);
      toast('Perfil atualizado!', 'success');
      navigate('/profile/me');
    } catch {
      toast('Erro ao salvar', 'error');
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Editar perfil</h1>
      <div className="col" style={{ alignItems: 'center', gap: 10 }} id="avatar-box">
        <Avatar user={user} size="lg" />
        <label className="btn btn--outline btn--sm">
          <Icon name="camera" /> Trocar foto
          <input type="file" id="avatar-input" accept="image/*" hidden onChange={onAvatarPick} />
        </label>
      </div>

      <form id="profile-form" className="mt-16" onSubmit={onSubmit}>
        <div className="field">
          <label className="field__label">Nome</label>
          <input className="input" name="name" defaultValue={user.name} required />
        </div>
        <div className="field">
          <label className="field__label">Bio</label>
          <textarea
            className="textarea"
            name="bio"
            maxLength={200}
            placeholder="Conte um pouco sobre você"
            defaultValue={user.bio || ''}
          ></textarea>
        </div>
        <div className="row gap-8">
          <div className="field" style={{ width: 140 }}>
            <label className="field__label">UF</label>
            <Combobox
              options={stateOptions}
              value={stateUf}
              onChange={(v) => {
                setStateUf(v);
                setCity('');
              }}
              placeholder="Estado"
              loading={loadingStates}
            />
          </div>
          <div className="field full">
            <label className="field__label">Cidade</label>
            <Combobox
              options={cityOptions}
              value={city}
              onChange={setCity}
              placeholder={stateUf ? 'Cidade' : 'Selecione um estado primeiro'}
              disabled={!stateUf}
              loading={loadingCities}
            />
          </div>
        </div>

        <div className="section-title">Dados complementares</div>
        <div className="row gap-8">
          <div className="field full">
            <label className="field__label">Gênero</label>
            <select className="select" name="gender" defaultValue={p.gender || ''}>
              {['', 'MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'].map((g) => (
                <option key={g} value={g}>
                  {g ? GENDER_LABELS[g] : 'Selecione'}
                </option>
              ))}
            </select>
          </div>
          <div className="field full">
            <label className="field__label">Nascimento</label>
            <input
              className="input"
              type="date"
              name="birthDate"
              defaultValue={p.birthDate ? String(p.birthDate).slice(0, 10) : ''}
            />
          </div>
        </div>
        <div className="field">
          <label className="field__label">Nacionalidade</label>
          <Combobox
            options={COUNTRIES}
            value={nationality}
            onChange={setNationality}
            placeholder="Selecione um país"
          />
        </div>
        <div className="field">
          <label className="field__label">Idiomas</label>
          <MultiCombobox
            options={COMMON_LANGUAGES}
            values={languages}
            onChange={setLanguages}
            placeholder="Adicione um idioma"
          />
        </div>
        <div className="field">
          <label className="field__label">Modalidade preferida</label>
          <select className="select" name="preferredModality" defaultValue={p.preferredModality || ''}>
            {['', 'ONLINE', 'IN_PERSON', 'BOTH'].map((m) => (
              <option key={m} value={m}>
                {m ? MODALITY_LABELS[m] : 'Selecione'}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field__label">Disponibilidade</label>
          <div className="chips" id="avail-chips">
            {AVAILABILITY.map((a) => (
              <span
                key={a}
                className={`chip${availability.has(a) ? ' selected' : ''}`}
                data-av={a}
                onClick={() => toggleAvailability(a)}
              >
                {AVAILABILITY_LABELS[a]}
              </span>
            ))}
          </div>
        </div>

        <div className="btn-row mt-16">
          <Link className="btn btn--secondary full" to="/profile/me">
            Cancelar
          </Link>
          <button className="btn btn--primary full" type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      {cropSrc && <AvatarCropper src={cropSrc} onCancel={onCropCancel} onConfirm={onCropDone} />}
    </>
  );
}
