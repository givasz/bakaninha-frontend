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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
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
                onClick={() => setTab(t.id)}
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
