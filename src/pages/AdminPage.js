import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminCategories from '../components/admin/AdminCategories';
import AdminItems from '../components/admin/AdminItems';
import AdminMarmita from '../components/admin/AdminMarmita';
import AdminSchedule from '../components/admin/AdminSchedule';
import AdminDelivery from '../components/admin/AdminDelivery';
import './AdminPage.css';

const TABS = [
  { id: 'categories', label: 'Categorias' },
  { id: 'items',      label: 'Itens' },
  { id: 'marmita',    label: 'Marmitas' },
  { id: 'schedule',   label: 'Horários' },
  { id: 'delivery',   label: 'Taxa de Entrega' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('categories');
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const selectTab = (id) => { setTab(id); setMenuOpen(false); };

  return (
    <div className="admin-page">
      {/* Top bar visível só no mobile — abre/fecha a sidebar */}
      <header className="admin-mobile-bar">
        <button
          className="admin-menu-btn"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span /><span /><span />
        </button>
        <span className="admin-mobile-title">{TABS.find(t => t.id === tab)?.label}</span>
      </header>

      {/* Fundo escuro ao abrir o menu no mobile */}
      {menuOpen && <div className="admin-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-top">
          <div className="admin-logo">
            <img src="/logo-branca.jpg" alt="Bakaninha" className="admin-logo-img" />
            <span className="admin-logo-sub">Admin</span>
          </div>
          <nav className="admin-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`admin-nav-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => selectTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar-bottom">
          <div className="admin-user">
            <div className="admin-user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div className="admin-user-name">{user?.username}</div>
              <div className="admin-user-role">Administrador</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-full" onClick={handleLogout}>Sair</button>
        </div>
      </div>

      <main className="admin-content">
        <div className="admin-content-header">
          <h1 className="admin-page-title">
            {TABS.find(t => t.id === tab)?.label}
          </h1>
        </div>
        <div className="admin-content-body">
          {tab === 'categories' && <AdminCategories />}
          {tab === 'items'      && <AdminItems />}
          {tab === 'marmita'    && <AdminMarmita />}
          {tab === 'schedule'   && <AdminSchedule />}
          {tab === 'delivery'   && <AdminDelivery />}
        </div>
      </main>
    </div>
  );
}
