/** Layout compartilhado para documentos legais (Privacidade e Termos). */
import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { useTheme } from '../hooks/useTheme';

export interface LegalSection {
  title: string;
  body: ReactNode;
}

const UPDATED = '5 de junho de 2026';

export function LegalLayout({
  title,
  subtitle,
  sections,
}: {
  title: string;
  subtitle: string;
  sections: LegalSection[];
}) {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollTo = (e: React.MouseEvent, id: string) => {
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="legal">
      <header className="legal__nav">
        <div className="legal__nav-inner">
          <Link className="lp-nav__logo" to="/">
            <span className="logo-mark">
              <i className="bi bi-arrow-left-right"></i>
            </span>
            <span>
              Skill<span className="lp-accent">Ex</span>
            </span>
          </Link>
          <div className="lp-nav__actions">
            <button className="icon-btn" id="legal-theme" title="Alternar tema" onClick={toggleTheme}>
              <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon-stars'}`}></i>
            </button>
            <Link className="btn btn--ghost btn--sm" to="/">
              <Icon name="arrow-left" /> Início
            </Link>
          </div>
        </div>
      </header>

      <main className="legal__main">
        <Link className="legal__back" to="/">
          <Icon name="arrow-left" /> Voltar para a página inicial
        </Link>
        <h1 className="legal__title">{title}</h1>
        <p className="legal__subtitle">{subtitle}</p>
        <p className="legal__updated">
          <Icon name="clock-history" /> Última atualização: {UPDATED}
        </p>

        <div className="legal__notice">
          <Icon name="info-circle" /> Este documento faz parte de um projeto acadêmico (TCC) com
          finalidade educacional e de demonstração. Não representa um serviço comercial em operação.
        </div>

        <nav className="legal__toc">
          <strong>Conteúdo</strong>
          {sections.map((s, i) => (
            <a key={i} href={`#sec-${i + 1}`} onClick={(e) => scrollTo(e, `sec-${i + 1}`)}>
              {i + 1}. {s.title}
            </a>
          ))}
        </nav>

        <article className="legal__content">
          {sections.map((s, i) => (
            <section key={i} className="legal__section" id={`sec-${i + 1}`}>
              <h2>
                {i + 1}. {s.title}
              </h2>
              {s.body}
            </section>
          ))}
        </article>

        <div className="legal__footer-links">
          <Link to="/privacy">Política de Privacidade</Link>
          <span>·</span>
          <Link to="/terms">Termos de Uso</Link>
        </div>
      </main>
    </div>
  );
}
