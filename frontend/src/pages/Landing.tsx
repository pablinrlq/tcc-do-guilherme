/** Landing page pública de apresentação da plataforma (rota /). */
import { Link, Navigate } from 'react-router-dom';
import { Icon } from '../components/ui/Icon';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';

const CATEGORIES: Array<[string, string]> = [
  ['music-note-beamed', 'Música'],
  ['translate', 'Idiomas'],
  ['cpu', 'Tecnologia'],
  ['scissors', 'Artesanato'],
  ['egg-fried', 'Culinária'],
  ['camera', 'Fotografia'],
  ['graph-up-arrow', 'Negócios'],
  ['palette', 'Design'],
  ['trophy', 'Esportes'],
  ['heart-pulse', 'Bem-estar'],
];

const STEPS: Array<[string, string, string]> = [
  ['person-badge', 'Crie seu perfil', 'Cadastre-se e conte um pouco sobre você, sua cidade e seus interesses.'],
  ['mortarboard', 'Cadastre habilidades', 'Informe o que você sabe ensinar e o que deseja aprender.'],
  ['lightning-charge', 'Receba matches', 'Nosso algoritmo encontra pessoas compatíveis com você.'],
  ['arrow-left-right', 'Troque conhecimento', 'Combine uma troca direta ou pague a aula com moedas internas.'],
];

const FEATURES: Array<[string, string, string]> = [
  ['lightning-charge-fill', 'Match inteligente', 'Algoritmo que calcula a compatibilidade de 0 a 100 priorizando trocas recíprocas.'],
  ['grid-1x2-fill', 'Feed social', 'Descubra pessoas e habilidades em um feed dinâmico ordenado por afinidade.'],
  ['coin', 'Moedas internas', 'Sem habilidade para trocar? Use SkillCoins para pagar por uma aula.'],
  ['star-fill', 'Avaliações e reputação', 'Avalie cada troca e construa uma reputação confiável na comunidade.'],
  ['chat-dots-fill', 'Chat integrado', 'Converse e combine os detalhes da aula após o aceite da solicitação.'],
  ['search', 'Busca avançada', 'Filtre por habilidade, categoria, modalidade, cidade, nível e muito mais.'],
];

export function Landing() {
  const { status, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Paridade com o boot antigo: usuário autenticado vai direto para o app
  if (status === 'loading') {
    return (
      <div className="auth-screen">
        <Spinner />
      </div>
    );
  }
  if (status === 'authed') {
    return <Navigate to={user!.onboardingCompleted ? '/feed' : '/onboarding'} replace />;
  }

  const scrollTo = (e: React.MouseEvent, id: string) => {
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const heroCta = (
    <>
      <Link className="btn btn--primary lp-cta-lg" to="/register">
        <Icon name="rocket-takeoff" /> Começar grátis
      </Link>
      <Link className="btn btn--outline lp-cta-lg" to="/login">
        Já tenho conta
      </Link>
    </>
  );

  return (
    <div className="lp">
      {/* Navbar */}
      <header className="lp-nav">
        <div className="lp-nav__inner">
          <Link className="lp-nav__logo" to="/">
            <span className="logo-mark">
              <i className="bi bi-arrow-left-right"></i>
            </span>
            <span>
              Skill<span className="lp-accent">Ex</span>
            </span>
          </Link>
          <nav className="lp-nav__links lp-hide-sm">
            <a href="#lp-how" onClick={(e) => scrollTo(e, 'lp-how')}>
              Como funciona
            </a>
            <a href="#lp-features" onClick={(e) => scrollTo(e, 'lp-features')}>
              Recursos
            </a>
            <a href="#lp-cats" onClick={(e) => scrollTo(e, 'lp-cats')}>
              Categorias
            </a>
          </nav>
          <div className="lp-nav__actions">
            <button className="icon-btn" id="lp-theme" title="Alternar tema" onClick={toggleTheme}>
              <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon-stars'}`}></i>
            </button>
            <Link className="btn btn--ghost btn--sm lp-hide-sm" to="/login">
              Entrar
            </Link>
            <Link className="btn btn--primary btn--sm" to="/register">
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero">
        <div className="lp-hero__bg" aria-hidden="true"></div>
        <div className="lp-hero__content">
          <span className="lp-badge">
            <Icon name="stars" /> Plataforma de troca de habilidades
          </span>
          <h1 className="lp-hero__title">
            Ensine o que você <span className="lp-accent">sabe</span>.
            <br />
            Aprenda o que você <span className="lp-accent">ama</span>.
          </h1>
          <p className="lp-hero__subtitle">
            A SkillEx conecta pessoas com conhecimentos complementares. Troque habilidades
            diretamente ou pague com moedas internas — tudo em uma comunidade colaborativa.
          </p>
          <div className="lp-hero__cta">{heroCta}</div>
          <div className="lp-hero__trust">
            <Icon name="shield-check" /> Gratuito para começar · <Icon name="people" /> Comunidade
            colaborativa
          </div>
        </div>

        {/* Visual: exemplo de match recíproco */}
        <div className="lp-hero__visual" aria-hidden="true">
          <div className="lp-orb">
            <article className="lp-orb__card lp-orb__card--a">
              <img className="avatar avatar--md" src="https://i.pravatar.cc/120?u=ana" alt="" />
              <div>
                <strong>Ana</strong>
                <div className="lp-orb__skills">
                  <span className="skill-badge skill-badge--teach">
                    <Icon name="mortarboard-fill" /> Violino
                  </span>
                  <span className="skill-badge skill-badge--learn">
                    <Icon name="book-half" /> Tricô
                  </span>
                </div>
              </div>
            </article>

            <div className="lp-orb__link">
              <span className="match-badge match-badge--perfect">
                <Icon name="lightning-charge-fill" /> Match 100
              </span>
              <span className="lp-orb__arrows">
                <Icon name="arrow-left-right" />
              </span>
            </div>

            <article className="lp-orb__card lp-orb__card--b">
              <img className="avatar avatar--md" src="https://i.pravatar.cc/120?u=bruno" alt="" />
              <div>
                <strong>Bruno</strong>
                <div className="lp-orb__skills">
                  <span className="skill-badge skill-badge--teach">
                    <Icon name="mortarboard-fill" /> Tricô
                  </span>
                  <span className="skill-badge skill-badge--learn">
                    <Icon name="book-half" /> Violino
                  </span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="lp-section" id="lp-how">
        <div className="lp-section__head">
          <span className="lp-eyebrow">Simples e rápido</span>
          <h2 className="lp-section__title">Como funciona</h2>
          <p className="lp-section__subtitle">Em quatro passos você já está trocando conhecimento.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map(([ic, title, desc], i) => (
            <div className="lp-step" key={ic}>
              <div className="lp-step__num">{i + 1}</div>
              <div className="lp-step__icon">
                <Icon name={ic} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recursos */}
      <section className="lp-section lp-section--alt" id="lp-features">
        <div className="lp-section__head">
          <span className="lp-eyebrow">Tudo o que você precisa</span>
          <h2 className="lp-section__title">Recursos da plataforma</h2>
          <p className="lp-section__subtitle">
            Ferramentas pensadas para uma troca de habilidades fluida e segura.
          </p>
        </div>
        <div className="lp-features">
          {FEATURES.map(([ic, title, desc]) => (
            <div className="lp-feature" key={ic}>
              <div className="lp-feature__icon">
                <Icon name={ic} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section className="lp-section" id="lp-cats">
        <div className="lp-section__head">
          <span className="lp-eyebrow">Para todos os gostos</span>
          <h2 className="lp-section__title">Explore categorias</h2>
          <p className="lp-section__subtitle">
            De música a tecnologia, há sempre algo novo para aprender.
          </p>
        </div>
        <div className="lp-cats">
          {CATEGORIES.map(([ic, name]) => (
            <span className="lp-cat" key={name}>
              <Icon name={ic} /> {name}
            </span>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="lp-cta-band">
        <div className="lp-cta-band__inner">
          <h2>Pronto para trocar habilidades?</h2>
          <p>Junte-se à comunidade e comece a ensinar e aprender hoje mesmo.</p>
          <div className="lp-hero__cta">{heroCta}</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <Link className="lp-nav__logo" to="/">
              <span className="logo-mark">
                <i className="bi bi-arrow-left-right"></i>
              </span>
              <span>
                Skill<span className="lp-accent">Ex</span>
              </span>
            </Link>
            <p>Plataforma social de troca de habilidades. Projeto acadêmico de TCC.</p>
          </div>
          <div className="lp-footer__cols">
            <div className="lp-footer__col">
              <h4>Produto</h4>
              <a href="#lp-how" onClick={(e) => scrollTo(e, 'lp-how')}>
                Como funciona
              </a>
              <a href="#lp-features" onClick={(e) => scrollTo(e, 'lp-features')}>
                Recursos
              </a>
              <a href="#lp-cats" onClick={(e) => scrollTo(e, 'lp-cats')}>
                Categorias
              </a>
            </div>
            <div className="lp-footer__col">
              <h4>Conta</h4>
              <Link to="/login">Entrar</Link>
              <Link to="/register">Criar conta</Link>
            </div>
            <div className="lp-footer__col">
              <h4>Legal</h4>
              <Link to="/privacy">Política de Privacidade</Link>
              <Link to="/terms">Termos de Uso</Link>
            </div>
          </div>
        </div>
        <div className="lp-footer__bottom">
          <span>© {new Date().getFullYear()} SkillEx. Todos os direitos reservados.</span>
          <span className="lp-footer__legal">
            <Link to="/privacy">Privacidade</Link>
            <span>·</span>
            <Link to="/terms">Termos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
