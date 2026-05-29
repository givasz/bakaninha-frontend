import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { API_URL } from '../utils/api';
import './ItemModal.css';

export default function ItemModal({ item, onClose }) {
  const { addItem, openCart } = useCart();

  const variants = item.variants || (item.variantsJson ? JSON.parse(item.variantsJson) : []);
  const hasVariants = variants.length > 0;

  const [selectedVariant, setSelectedVariant] = useState(hasVariants ? variants[0] : null);
  const price = selectedVariant ? selectedVariant.price : item.basePrice;

  const handleAdd = () => {
    const cartKey = `${item.id}-${selectedVariant?.name || 'default'}-${Date.now()}`;
    addItem({
      cartKey,
      id: item.id,
      name: item.name,
      variant: selectedVariant?.name,
      price,
      imageUrl: item.imageUrl,
    });
    onClose();
    openCart();
  };

  const imgSrc = item.imageUrl
    ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}`)
    : null;

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="item-modal modal animate-slide">
        <div className="item-modal-image">
          {imgSrc
            ? <img src={imgSrc} alt={item.name} />
            : <div className="img-placeholder item-img-placeholder" />
          }
          <button className="item-modal-close btn-close" onClick={onClose}>×</button>
        </div>

        <div className="item-modal-body">
          <h2 className="item-modal-name">{item.name}</h2>
          {item.description && (
            <p className="item-modal-desc">{item.description}</p>
          )}

          {hasVariants && (
            <div className="variant-section">
              <div className="variant-label">Escolha o tamanho</div>
              <div className="variant-options">
                {variants.map(v => (
                  <button
                    key={v.name}
                    className={`variant-btn ${selectedVariant?.name === v.name ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <span className="variant-name">{v.name}</span>
                    <span className="variant-price">R$ {Number(v.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="item-modal-footer">
            <div className="item-modal-price">
              R$ <strong>{Number(price).toFixed(2)}</strong>
            </div>
            <button className="btn btn-primary btn-lg" onClick={handleAdd}>
              Adicionar ao Pedido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
