import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';
import './Navbar.css';

export default function Navbar({ scheduleStatus }) {
  const { count } = useCart();
  const location = useLocation();
  const [cartOpen, setCartOpen] = useState(false);

  const onCheckout = location.pathname === '/checkout';

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <img src="/logo-branca.jpg" alt="Bakaninha" className="navbar-logo" />
        </Link>

        <div className="navbar-center">
          {scheduleStatus && (
            <span className={`pill ${scheduleStatus.open ? 'pill-open' : 'pill-closed'}`}>
              <span className="status-dot" />
              {scheduleStatus.message}
            </span>
          )}
        </div>

        <div className="navbar-actions">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Cardápio</Link>
          <Link to="/marmita" className={`nav-link ${location.pathname === '/marmita' ? 'active' : ''}`}>Marmita</Link>

          {!onCheckout && (
            <button className="btn-cart" onClick={() => setCartOpen(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              Pedido
              {count > 0 && <span className="badge">{count}</span>}
            </button>
          )}
        </div>
      </nav>

      {cartOpen && !onCheckout && <CartDrawer onClose={() => setCartOpen(false)} />}
    </>
  );
}
