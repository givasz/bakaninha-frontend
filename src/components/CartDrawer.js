import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { API_URL } from '../utils/api';
import './CartDrawer.css';

export default function CartDrawer({ onClose }) {
  const { items, removeItem, updateQty, total } = useCart();
  const navigate = useNavigate();

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const goToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />

      <aside className="cart-side" role="dialog" aria-label="Seu Pedido">
        <div className="cart-side-header">
          <h2 className="cart-side-title">Seu Pedido</h2>
          <button className="btn-close" onClick={onClose} aria-label="Fechar carrinho">×</button>
        </div>

        <div className="cart-side-body">
          {items.length === 0 ? (
            <div className="cart-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--gray)' }}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <p>Seu carrinho está vazio</p>
              <button className="btn btn-primary" onClick={onClose}>Ver cardápio</button>
            </div>
          ) : (
            <div className="cart-items">
              {items.map(item => (
                <div key={item.cartKey} className="cart-item animate-fade">
                  <div className="cart-item-img">
                    {item.imageUrl
                      ? <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}`} alt={item.name} />
                      : <div className="img-placeholder" />
                    }
                  </div>
                  <div className="cart-item-info">
                    <div className="cart-item-name">{item.name}</div>
                    {item.variant && <div className="cart-item-variant">{item.variant}</div>}
                    {item.selections && Object.entries(item.selections).map(([g, v]) => (
                      <div key={g} className="cart-item-selection">{g}: {Array.isArray(v) ? v.join(', ') : v}</div>
                    ))}
                    <div className="cart-item-row">
                      <div className="qty-control">
                        <button className="qty-btn" onClick={() => updateQty(item.cartKey, -1)}>−</button>
                        <span className="qty-value">{item.qty}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.cartKey, 1)}>+</button>
                      </div>
                      <div className="cart-item-price">R$ {(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  </div>
                  <button className="btn-remove" onClick={() => removeItem(item.cartKey)} title="Remover">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-side-footer">
            <div className="cart-total">
              <span>Total</span>
              <span className="total-value">R$ {total.toFixed(2)}</span>
            </div>
            <div className="cart-actions">
              <button className="btn btn-secondary" onClick={onClose}>Continuar Comprando</button>
              <button className="btn btn-primary" onClick={goToCheckout}>Finalizar Pedido</button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
