import { useState } from 'react';
import { Icon } from './Icon';
import { api, ApiError } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const REPORT_TYPE_LABELS: Record<string, string> = {
  INAPPROPRIATE_CONTENT: 'Conteúdo inapropriado',
  HARASSMENT: 'Assédio ou abuso',
  SCAM: 'Golpe ou fraude',
  FAKE_PROFILE: 'Perfil falso',
  SPAM: 'Spam',
  OTHER: 'Outro',
};

interface ReportModalProps {
  targetId?: string;
  targetName?: string;
  requestId?: string;
  onClose: () => void;
}

export function ReportModal({ targetId, targetName, requestId, onClose }: ReportModalProps) {
  const { toast } = useToast();
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setLoading(true);
    try {
      await api.post('/reports', { targetId, requestId, type, description });
      toast('Denúncia enviada. Nossa equipe irá analisar em breve.', 'success');
      onClose();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Erro ao enviar denúncia', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <div className="sheet__handle" />
        <div className="sheet__title">
          <Icon name="flag-fill" /> Denunciar{targetName ? ` ${targetName}` : ''}
        </div>
        <p className="muted" style={{ fontSize: '.88rem', marginBottom: 16 }}>
          Sua denúncia é anônima e será analisada pela nossa equipe.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label">Motivo</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            >
              <option value="">Selecione um motivo...</option>
              {Object.entries(REPORT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label">Descrição</label>
            <textarea
              className="input"
              rows={4}
              placeholder="Descreva o problema com mais detalhes (mínimo 10 caracteres)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              minLength={10}
              maxLength={1000}
              required
              style={{ resize: 'vertical' }}
            />
            <div className="muted" style={{ fontSize: '.75rem', textAlign: 'right' }}>
              {description.length}/1000
            </div>
          </div>
          <div className="row gap-8">
            <button
              type="button"
              className="btn btn--ghost full"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--danger full"
              disabled={loading || !type || description.length < 10}
            >
              {loading ? 'Enviando...' : 'Enviar denúncia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
