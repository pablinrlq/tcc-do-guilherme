/** App shell: cabeçalho, navegação inferior e área de conteúdo (layout route). */
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../hooks/useRealtime';
import { useTheme } from '../hooks/useTheme';

const NAV_ITEMS = [
  { key: 'feed', icon: 'house-door-fill', label: 'Feed', path: '/feed', fab: false },
  { key: 'search', icon: 'search', label: 'Buscar', path: '/search', fab: false },
  { key: 'requests', icon: 'arrow-left-right', label: 'Trocas', path: '/requests', fab: true },
  { key: 'wallet', icon: 'wallet2', label: 'Carteira', path: '/wallet', fab: false },
  { key: 'profile', icon: 'person-circle', label: 'Perfil', path: '/profile/me', fab: false },
];

export function AppLayout() {
  const navigate = useNavigate();
  const { unread, refreshUnread } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread]);

  // Badge de notificações atualiza ao vivo via WebSocket
  useRealtime('notification:new', () => refreshUnread());

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Link className="app-header__logo" to="/feed">
            <span className="logo-mark">
              <i className="bi bi-arrow-left-right"></i>
            </span>
            <span className="logo-text">
              Skill<span>Ex</span>
            </span>
          </Link>
          <div className="app-header__actions">
            <button className="icon-btn" data-action="theme" title="Alternar tema" onClick={toggleTheme}>
              <i className={`bi bi-${theme === 'dark' ? 'sun' : 'moon-stars'}`}></i>
            </button>
            <button
              className="icon-btn"
              data-action="notifications"
              title="Notificações"
              onClick={() => navigate('/notifications')}
            >
              <i className="bi bi-bell"></i>
              <span className={`badge-dot${unread > 0 ? '' : ' hidden'}`} data-unread>
                {unread > 99 ? '99+' : unread}
              </span>
            </button>
            <button
              className="icon-btn"
              data-action="settings"
              title="Configurações"
              onClick={() => navigate('/settings')}
            >
              <i className="bi bi-gear"></i>
            </button>
          </div>
        </div>
      </header>
      <main id="view" className="app-content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        <div className="bottom-nav__inner">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              data-nav={item.key}
              className={({ isActive }) =>
                `nav-item${item.fab ? ' nav-fab' : ''}${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">
                <i className={`bi bi-${item.icon}`}></i>
              </span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
