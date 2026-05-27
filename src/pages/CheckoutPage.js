import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api, { API_URL } from '../utils/api';
import './CheckoutPage.css';

const PAYMENT_OPTIONS = ['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Pix'];

export default function CheckoutPage({ scheduleStatus }) {
  const { items, total, clear, removeItem, updateQty } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [orderType, setOrderType]   = useState('delivery'); // delivery | local
  const [name, setName]             = useState('');
  const [phone, setPhone]           = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress]       = useState('');
  const [reference, setReference]   = useState('');
  const [table, setTable]           = useState('');
  const [payment, setPayment]       = useState('');
  const [observation, setObservation] = useState('');
  const [changeFor, setChangeFor]   = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    if (items.length === 0) navigate('/', { replace: true });
  }, [items.length, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim())    { showToast('Informe o seu nome', 'error'); return; }
    if (!phone.trim())   { showToast('Informe um telefone para contato', 'error'); return; }
    if (!payment)        { showToast('Selecione a forma de pagamento', 'error'); return; }
    if (orderType === 'delivery' && !address.trim())      { showToast('Informe o endereço', 'error'); return; }
    if (orderType === 'delivery' && !neighborhood.trim()) { showToast('Informe o bairro', 'error'); return; }
    if (orderType === 'local' && !table.trim())           { showToast('Informe a mesa', 'error'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/orders/whatsapp', {
        type: orderType,
        name,
        phone,
        address: orderType === 'delivery'
          ? [address, neighborhood && `Bairro: ${neighborhood}`, reference && `Ref: ${reference}`]
              .filter(Boolean).join(' — ')
          : '',
        table,
        payment,
        observation: [
          observation,
          payment === 'Dinheiro' && changeFor ? `Troco para R$ ${changeFor}` : '',
        ].filter(Boolean).join(' | '),
        items: items.map(i => ({
          name: i.name,
          variant: i.variant,
          price: i.price,
          qty: i.qty,
          selections: i.selections,
        })),
      });
      window.open(data.url, '_blank');
      clear();
      showToast('Pedido enviado via WhatsApp!', 'success');
      navigate('/', { replace: true });
    } catch {
      showToast('Erro ao enviar pedido', 'error');
    }
    setLoading(false);
  };

  const blocked = scheduleStatus && !scheduleStatus.open;

  return (
    <div className="checkout-page">
      <div className="checkout-shell">
        <div className="checkout-back">
          <Link to="/" className="checkout-back-link">← Voltar ao cardápio</Link>
        </div>

        <h1 className="checkout-title">Finalizar pedido</h1>
        <p className="checkout-sub">Confira os itens e preencha os dados para enviar via WhatsApp.</p>

        {blocked && (
          <div className="closed-banner" style={{ marginBottom: 16 }}>
            <span className="closed-dot" />
            <span>{scheduleStatus.message} — Pedidos indisponíveis no momento</span>
          </div>
        )}

        <div className="checkout-grid">
          {/* ── Form ───────────────────────────────── */}
          <form className="checkout-form-card" onSubmit={handleSubmit}>
            <section className="checkout-section">
              <h2 className="checkout-section-title">Tipo de pedido</h2>
              <div className="order-type-tabs">
                <button type="button"
                  className={`type-tab ${orderType === 'delivery' ? 'active' : ''}`}
                  onClick={() => setOrderType('delivery')}>
                  Entrega
                </button>
                <button type="button"
                  className={`type-tab ${orderType === 'local' ? 'active' : ''}`}
                  onClick={() => setOrderType('local')}>
                  Comer no local
                </button>
              </div>
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section-title">Seus dados</h2>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" required
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Como você quer ser chamado" />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone *</label>
                  <input className="form-input" required type="tel"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="(38) 9 9999-9999" />
                </div>
              </div>
            </section>

            <section className="checkout-section">
              {orderType === 'delivery' ? (
                <>
                  <h2 className="checkout-section-title">Endereço de entrega</h2>
                  <div className="form-group">
                    <label className="form-label">Rua, número e complemento *</label>
                    <textarea
                      className="form-input"
                      placeholder="Ex: Rua das Flores, 123, ap 201"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      rows={2} required
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label className="form-label">Bairro / localização *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Centro, Vila Nova..."
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label className="form-label">Ponto de referência</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: em frente à padaria"
                      value={reference}
                      onChange={e => setReference(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="checkout-section-title">Comer no local</h2>
                  <div className="form-group">
                    <label className="form-label">Número da mesa *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Mesa 5"
                      value={table}
                      onChange={e => setTable(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section-title">Forma de pagamento</h2>
              <div className="payment-grid">
                {PAYMENT_OPTIONS.map(p => (
                  <button type="button" key={p}
                    className={`payment-btn ${payment === p ? 'active' : ''}`}
                    onClick={() => setPayment(p)}>
                    {p}
                  </button>
                ))}
              </div>

              {payment === 'Dinheiro' && (
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label className="form-label">Precisa de troco para?</label>
                  <input className="form-input" type="number" step="0.01"
                    value={changeFor} onChange={e => setChangeFor(e.target.value)}
                    placeholder="Ex: 100  (deixe em branco se não precisa)" />
                </div>
              )}
            </section>

            <section className="checkout-section">
              <h2 className="checkout-section-title">Observações</h2>
              <div className="form-group">
                <textarea
                  className="form-input"
                  placeholder="Alguma observação? (ex: sem cebola)"
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  rows={2}
                />
              </div>
            </section>

            <button type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading || blocked}>
              {loading ? 'Enviando...' : 'Enviar via WhatsApp'}
            </button>
          </form>

          {/* ── Order summary ──────────────────────── */}
          <aside className="checkout-summary-card">
            <h2 className="checkout-section-title">Seu pedido</h2>
            <div className="checkout-items">
              {items.map(item => (
                <div key={item.cartKey} className="checkout-item">
                  <div className="checkout-item-img">
                    {item.imageUrl
                      ? <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}`} alt={item.name} />
                      : <div className="img-placeholder-empty" />
                    }
                  </div>
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{item.name}</div>
                    {item.variant && <div className="checkout-item-variant">{item.variant}</div>}
                    {item.selections && Object.entries(item.selections).map(([g, v]) => (
                      <div key={g} className="checkout-item-selection">{g}: {Array.isArray(v) ? v.join(', ') : v}</div>
                    ))}
                    <div className="checkout-item-line">
                      <div className="qty-control">
                        <button type="button" className="qty-btn" onClick={() => updateQty(item.cartKey, -1)}>−</button>
                        <span className="qty-value">{item.qty}</span>
                        <button type="button" className="qty-btn" onClick={() => updateQty(item.cartKey, 1)}>+</button>
                      </div>
                      <div className="checkout-item-price">R$ {(item.price * item.qty).toFixed(2)}</div>
                    </div>
                  </div>
                  <button type="button" className="btn-remove" onClick={() => removeItem(item.cartKey)} title="Remover">×</button>
                </div>
              ))}
            </div>

            <div className="checkout-total">
              <span>Total</span>
              <strong>R$ {total.toFixed(2)}</strong>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
