/** Onboarding guiado em 4 etapas: perfil, ensinar, aprender e foto. */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { AvatarCropper } from '../components/ui/AvatarCropper';
import { Combobox } from '../components/ui/Combobox';
import { Icon } from '../components/ui/Icon';
import { MultiCombobox } from '../components/ui/MultiCombobox';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { COUNTRIES } from '../utils/countries';
import { COMMON_LANGUAGES } from '../utils/languages';
import {
  AVAILABILITY_LABELS,
  GENDER_LABELS,
  LEARNING_LEVEL_LABELS,
  LEVEL_LABELS,
  MODALITY_LABELS,
} from '../utils/format';
import { validateImageFile } from '../utils/files';

const AVAILABILITY = ['MORNING', 'AFTERNOON', 'NIGHT', 'WEEKEND'];
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
const LEARN_LEVELS = ['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

interface ProfileState {
  gender: string;
  birthDate: string;
  nationality: string;
  languages: string[];
  modality: string;
}

interface SkillEntry {
  skillName: string;
  level: string;
}

function StepSelect({
  value,
  onChange,
  opts,
  labels,
}: {
  value: string;
  onChange: (v: string) => void;
  opts: string[];
  labels: Record<string, string>;
}) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
      {opts.map((o) => (
        <option key={o} value={o}>
          {labels[o]}
        </option>
      ))}
    </select>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileState>({
    gender: '',
    birthDate: '',
    nationality: '',
    languages: [],
    modality: 'BOTH',
  });
  const [availability, setAvailability] = useState<Set<string>>(new Set());
  const [teach, setTeach] = useState<SkillEntry[]>([]);
  const [learn, setLearn] = useState<{ skillName: string; currentLevel: string }[]>([]);

  // Formulário de adição de habilidade (etapas 2 e 3)
  const [teachSkill, setTeachSkill] = useState('');
  const [teachLevel, setTeachLevel] = useState('INTERMEDIATE');
  const [learnSkill, setLearnSkill] = useState('');
  const [learnLevel, setLearnLevel] = useState('NONE');

  // Etapa de foto
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const setProfileField = <K extends keyof ProfileState>(field: K, value: ProfileState[K]) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const toggleAvailability = (av: string) => {
    setAvailability((prev) => {
      const next = new Set(prev);
      if (next.has(av)) next.delete(av);
      else next.add(av);
      return next;
    });
  };

  const addTeach = () => {
    const skill = teachSkill.trim();
    if (skill.length < 2) {
      toast('Informe uma habilidade', 'error');
      return;
    }
    setTeach((prev) => [...prev, { skillName: skill, level: teachLevel }]);
    setTeachSkill('');
  };

  const addLearn = () => {
    const skill = learnSkill.trim();
    if (skill.length < 2) {
      toast('Informe uma habilidade', 'error');
      return;
    }
    setLearn((prev) => [...prev, { skillName: skill, currentLevel: learnLevel }]);
    setLearnSkill('');
  };

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const onCropDone = (blob: Blob, dataUrl: string) => {
    setAvatarBlob(blob);
    setAvatarPreview(dataUrl);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const onCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const finish = async () => {
    const payload = {
      profile: {
        gender: profile.gender || undefined,
        birthDate: profile.birthDate || undefined,
        nationality: profile.nationality || undefined,
        languages: profile.languages,
        availability: [...availability],
        preferredModality: profile.modality || undefined,
      },
      teachingSkills: teach.map((t) => ({
        skillName: t.skillName,
        level: t.level,
        modality: profile.modality || 'BOTH',
      })),
      learningSkills: learn.map((l) => ({
        skillName: l.skillName,
        currentLevel: l.currentLevel,
        modality: profile.modality || 'BOTH',
      })),
    };
    try {
      const { user: updated } = await api.post('/users/me/onboarding', payload);
      setUser(updated);

      if (avatarBlob) {
        try {
          const fd = new FormData();
          fd.append('avatar', new File([avatarBlob], 'avatar.jpg', { type: 'image/jpeg' }));
          const res = await api.upload('/users/me/avatar', fd);
          setUser(res.user);
        } catch {
          toast('Perfil salvo, mas a foto falhou — tente atualizar depois.', 'error');
        }
      }

      toast('Tudo pronto! Bem-vindo(a) à SkillEx', 'success');
      navigate('/feed');
    } catch (err: any) {
      toast(err?.message || 'Erro ao concluir', 'error');
    }
  };

  const skillChips = (items: { skillName: string }[], kind: 'teach' | 'learn') =>
    items.length ? (
      <div className="chips mb-16">
        {items.map((t, i) => (
          <span className="chip selected" key={`${t.skillName}-${i}`}>
            {t.skillName}{' '}
            <b
              data-rm={i}
              data-kind={kind}
              style={{ marginLeft: 4, cursor: 'pointer' }}
              onClick={() =>
                kind === 'teach'
                  ? setTeach((prev) => prev.filter((_, j) => j !== i))
                  : setLearn((prev) => prev.filter((_, j) => j !== i))
              }
            >
              <Icon name="x-lg" />
            </b>
          </span>
        ))}
      </div>
    ) : (
      <p className="muted mb-8">Nenhuma adicionada ainda.</p>
    );

  return (
    <div className="onboarding">
      <div className="steps-bar">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? 'done' : ''}></span>
        ))}
      </div>
      <div id="step-body">
        {step === 0 && (
          <>
            <h1 className="page-title">Bem-vindo(a)!</h1>
            <p className="page-subtitle">Vamos montar seu perfil em poucos passos.</p>
            <div className="row gap-8">
              <div className="field full">
                <label className="field__label">Gênero</label>
                <StepSelect
                  value={profile.gender}
                  onChange={(v) => setProfileField('gender', v)}
                  opts={['', 'MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']}
                  labels={{ '': 'Selecione', ...GENDER_LABELS }}
                />
              </div>
              <div className="field full">
                <label className="field__label">Nascimento</label>
                <input
                  className="input"
                  type="date"
                  name="birthDate"
                  value={profile.birthDate}
                  onChange={(e) => setProfileField('birthDate', e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Nacionalidade</label>
              <Combobox
                options={COUNTRIES}
                value={profile.nationality}
                onChange={(v) => setProfileField('nationality', v)}
                placeholder="Selecione um país"
              />
            </div>
            <div className="field">
              <label className="field__label">Idiomas</label>
              <MultiCombobox
                options={COMMON_LANGUAGES}
                values={profile.languages}
                onChange={(v) => setProfileField('languages', v)}
                placeholder="Adicione um idioma"
              />
            </div>
            <div className="field">
              <label className="field__label">Modalidade preferida</label>
              <StepSelect
                value={profile.modality}
                onChange={(v) => setProfileField('modality', v)}
                opts={['BOTH', 'ONLINE', 'IN_PERSON']}
                labels={MODALITY_LABELS}
              />
            </div>
            <div className="field">
              <label className="field__label">Disponibilidade</label>
              <div className="chips" id="avail">
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
              <button className="btn btn--ghost" data-act="skip" onClick={finish}>
                Pular
              </button>
              <button className="btn btn--primary full" data-act="next" onClick={() => setStep(1)}>
                Próximo
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="page-title">O que você sabe ensinar?</h1>
            <p className="page-subtitle">Adicione as habilidades que você domina.</p>
            {skillChips(teach, 'teach')}
            <div className="card">
              <div className="field">
                <label className="field__label">Habilidade</label>
                <input
                  className="input"
                  id="t-skill"
                  placeholder="Ex.: Violino"
                  value={teachSkill}
                  onChange={(e) => setTeachSkill(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label">Nível</label>
                <StepSelect value={teachLevel} onChange={setTeachLevel} opts={LEVELS} labels={LEVEL_LABELS} />
              </div>
              <button className="btn btn--outline btn--block" data-act="add-teach" onClick={addTeach}>
                <Icon name="plus-lg" /> Adicionar habilidade
              </button>
            </div>
            <div className="btn-row mt-16">
              <button className="btn btn--secondary" data-act="back" onClick={() => setStep(0)}>
                Voltar
              </button>
              <button className="btn btn--primary full" data-act="next" onClick={() => setStep(2)}>
                Próximo
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="page-title">O que deseja aprender?</h1>
            <p className="page-subtitle">Assim encontramos os melhores matches para você.</p>
            {skillChips(learn, 'learn')}
            <div className="card">
              <div className="field">
                <label className="field__label">Habilidade</label>
                <input
                  className="input"
                  id="l-skill"
                  placeholder="Ex.: Tricô"
                  value={learnSkill}
                  onChange={(e) => setLearnSkill(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label">Nível atual</label>
                <StepSelect value={learnLevel} onChange={setLearnLevel} opts={LEARN_LEVELS} labels={LEARNING_LEVEL_LABELS} />
              </div>
              <button className="btn btn--outline btn--block" data-act="add-learn" onClick={addLearn}>
                <Icon name="plus-lg" /> Adicionar habilidade
              </button>
            </div>
            <div className="btn-row mt-16">
              <button className="btn btn--secondary" data-act="back" onClick={() => setStep(1)}>
                Voltar
              </button>
              <button className="btn btn--primary full" data-act="next" onClick={() => setStep(3)}>
                Próximo
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="page-title">Sua foto de perfil</h1>
            <p className="page-subtitle">
              Uma foto ajuda outros usuários a te reconhecer. Você pode pular e adicionar depois.
            </p>
            <div className="col" style={{ alignItems: 'center', gap: 12 }}>
              {avatarPreview ? (
                <img
                  className="avatar avatar--lg"
                  src={avatarPreview}
                  alt="Pré-visualização do avatar"
                />
              ) : (
                <Avatar user={user} size="lg" />
              )}
              <label className="btn btn--outline btn--sm">
                <Icon name="camera" /> {avatarPreview ? 'Trocar foto' : 'Escolher foto'}
                <input type="file" accept="image/*" hidden onChange={onPickPhoto} />
              </label>
              {avatarPreview && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    setAvatarBlob(null);
                    setAvatarPreview(null);
                  }}
                >
                  Remover
                </button>
              )}
            </div>
            <div className="btn-row mt-16">
              <button className="btn btn--secondary" onClick={() => setStep(2)}>
                Voltar
              </button>
              <button className="btn btn--primary full" onClick={finish}>
                Concluir <Icon name="check-circle" />
              </button>
            </div>
          </>
        )}
      </div>

      {cropSrc && <AvatarCropper src={cropSrc} onCancel={onCropCancel} onConfirm={onCropDone} />}
    </div>
  );
}
