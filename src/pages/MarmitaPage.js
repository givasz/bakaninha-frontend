import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import './MarmitaPage.css';

const sizeLabel = (name) => (name || '').trim() || 'Único';
const marmitaName = (name) => `Marmita ${(name || '').trim()}`.trim();

export default function MarmitaPage({ scheduleStatus }) {
  const [sizes, setSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeDetail, setSizeDetail] = useState(null);
  const [choices, setChoices] = useState({}); // groupId -> [itemName]
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { addItem, openCart } = useCart();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.get('/marmita/sizes/active')
      .then(r => {
        setSizes(r.data);
        if (r.data.length) {
          // Abre já na marmita clicada no cardápio (?size=ID); senão, a primeira.
          const wanted = searchParams.get('size');
          const initial = (wanted && r.data.find(s => String(s.id) === wanted)) || r.data[0];
          handleSelectSize(initial);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectSize = async (size) => {
    setSelectedSize(size);
    setChoices({});
    setSearch('');
    setLoadingDetail(true);
    try {
      const r = await api.get(`/marmita/sizes/${size.id}`);
      setSizeDetail(r.data);
    } catch {
      setSizeDetail(null);
    }
    setLoadingDetail(false);
  };

  const toggleChoice = (group, itemName, extraPrice) => {
    setChoices(prev => {
      const current = prev[group.id] || [];
      const exists = current.find(c => c.name === itemName);
      if (exists) {
        return { ...prev, [group.id]: current.filter(c => c.name !== itemName) };
      }
      if (current.length >= group.maxChoices) {
        // Replace last if max 1, else ignore
        if (group.maxChoices === 1) {
          return { ...prev, [group.id]: [{ name: itemName, extraPrice }] };
        }
        showToast(`Máximo de ${group.maxChoices} escolha(s) para ${group.name}`, 'error');
        return prev;
      }
      return { ...prev, [group.id]: [...current, { name: itemName, extraPrice }] };
    });
  };

  const isChosen = (groupId, itemName) => {
    return (choices[groupId] || []).some(c => c.name === itemName);
  };

  // Marmita não tem mínimo obrigatório — todos os grupos são opcionais.
  // O cliente pode pular qualquer grupo; só limitamos o máximo via maxChoices.
  const isValid = () => !!sizeDetail?.groups?.length;

  const totalExtra = Object.values(choices).flat().reduce((s, c) => s + (c.extraPrice || 0), 0);
  const totalPrice = selectedSize ? selectedSize.price + totalExtra : 0;

  const handleAddToCart = () => {
    if (!isValid()) {
      showToast('Selecione um tamanho de marmita', 'error');
      return;
    }
    const selections = {};
    if (sizeDetail?.groups) {
      sizeDetail.groups.forEach(g => {
        if (choices[g.id]?.length) {
          selections[g.name] = choices[g.id].map(c => c.name);
        }
      });
    }
    const cartKey = `marmita-${selectedSize.id}-${Date.now()}`;
    addItem({
      cartKey,
      name: marmitaName(selectedSize.name),
      price: totalPrice,
      selections,
    });
    setChoices({});
    openCart();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (sizes.length === 0) return (
    <div className="marmita-empty">
      <h2>Marmitas em breve</h2>
      <p>Nenhum tamanho disponível no momento.</p>
    </div>
  );

  return (
    <div className="marmita-page">
      {/* Hero */}
      <div className="marmita-hero">
        <div className="marmita-hero-content">
          <div className="hero-tag">Monte a sua</div>
          <h1 className="hero-title">MARMITA</h1>
        </div>
        <div className="hero-pattern" />
      </div>

      <div className="marmita-layout">
        {/* Left: Size selector */}
        <div className="marmita-sizes">
          <h2 className="sizes-title">Tamanho</h2>
          {sizes.map(size => (
            <button
              key={size.id}
              className={`size-card ${selectedSize?.id === size.id ? 'active' : ''}`}
              onClick={() => handleSelectSize(size)}
            >
              <div className="size-name">{sizeLabel(size.name)}</div>
              <div className="size-price">R$ {Number(size.price).toFixed(2)}</div>
            </button>
          ))}
        </div>

        {/* Right: Customization */}
        <div className="marmita-builder">
          {selectedSize && (
            <div className="builder-header">
              <div className="builder-header-info">
                <h2 className="builder-title">{marmitaName(selectedSize.name)}</h2>
                <p className="builder-price">
                  R$ {Number(selectedSize.price).toFixed(2)}
                  {totalExtra > 0 && <span className="extra-price"> + R$ {totalExtra.toFixed(2)} extras</span>}
                </p>
              </div>
              <div className="builder-search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  placeholder="Pesquise pelo nome"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="builder-search-input"
                />
                {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer', fontSize: 16 }}>×</button>}
              </div>
            </div>
          )}

          {loadingDetail ? (
            <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
              <div className="spinner" />
            </div>
          ) : sizeDetail?.groups?.length > 0 ? (
            <div className="groups-container">
              {sizeDetail.groups
                .sort((a, b) => a.order - b.order)
                .map(group => {
                  const groupItems = (group.groupItems || []).filter(gi =>
                    gi.active && (!search || gi.name.toLowerCase().includes(search.toLowerCase()))
                  );
                  if (search && groupItems.length === 0) return null;
                  const chosen = choices[group.id] || [];

                  return (
                    <div key={group.id} className="group-section">
                      <div className="group-header">
                        <div className="group-header-left">
                          <h3 className="group-name">{group.name}</h3>
                          <p className="group-sub">
                            {group.maxChoices === 1
                              ? 'Escolha até 1 item (opcional)'
                              : `Escolha até ${group.maxChoices} itens (opcional)`
                            }
                          </p>
                        </div>
                        <div className="group-header-right">
                          <span className="chosen-count">{chosen.length}/{group.maxChoices}</span>
                        </div>
                      </div>

                      <div className="group-items">
                        {groupItems.map(gi => {
                          const selected = isChosen(group.id, gi.name);
                          const imgSrc = gi.imageUrl
                            ? (gi.imageUrl.startsWith('http') ? gi.imageUrl : `${API_URL}${gi.imageUrl}`)
                            : null;
                          return (
                            <button
                              key={gi.id}
                              className={`group-item ${selected ? 'selected' : ''}`}
                              onClick={() => toggleChoice(group, gi.name, gi.extraPrice)}
                              disabled={scheduleStatus && !scheduleStatus.open}
                            >
                              <div className="group-item-img">
                                {imgSrc
                                  ? <img src={imgSrc} alt={gi.name} />
                                  : <div className="img-placeholder" style={{ height: '100%' }} />
                                }
                              </div>
                              <div className="group-item-info">
                                <div className="group-item-name">{gi.name}</div>
                                {gi.extraPrice > 0 && (
                                  <div className="group-item-extra">+R$ {Number(gi.extraPrice).toFixed(2)}</div>
                                )}
                                <div className="group-item-max">
                                  {group.maxChoices === 1 ? 'Máx 1' : `Máx ${group.maxChoices}`}
                                </div>
                              </div>
                              <div className={`choice-radio ${selected ? 'selected' : ''}`} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray)' }}>
              Nenhum grupo configurado para este tamanho.
            </div>
          )}

          {/* Footer */}
          {selectedSize && !loadingDetail && (
            <div className="builder-footer">
              <div className="footer-total">
                <span>Total</span>
                <strong>R$ {totalPrice.toFixed(2)}</strong>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleAddToCart}
                disabled={!isValid() || (scheduleStatus && !scheduleStatus.open)}
              >
                Avançar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
