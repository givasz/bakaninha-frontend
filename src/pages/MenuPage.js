import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { API_URL } from '../utils/api';
import ItemModal from '../components/ItemModal';
import './MenuPage.css';

const MARMITA_CAT_ID = '__marmita__';

// Banner por categoria — palavra-chave de imagem (loremflickr, sem API key).
// Categorias não mapeadas caem no fallback 'food'.
const BANNER_KEYWORDS = {
  'pratos a la carte': 'steak',
  'file bovino': 'steak',
  'files de frango a': 'chicken',
  'file de frango': 'chicken',
  'grelhados a mineira bakaninha': 'barbecue',
  'massas': 'pasta',
  'pizzas': 'pizza',
  'porcoes aperitivas': 'fries',
  'porcoes': 'fries',
  'guarnicoes': 'rice',
  'saladas': 'salad',
  'sucos': 'juice',
  'cervejas 600 ml': 'beer',
  'cervejas': 'beer',
  'bebidas destiladas (dose)': 'whiskey',
  'bebidas destiladas': 'whiskey',
};

const normalizeName = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

function bannerUrl(name, keywordOverride) {
  const key = normalizeName(name);
  const kw = keywordOverride || BANNER_KEYWORDS[key] || 'food';
  // lock estável (mesma imagem em todo reload) a partir do nome
  let lock = 0;
  for (let i = 0; i < key.length; i++) lock = (lock + key.charCodeAt(i)) % 997;
  return `https://loremflickr.com/1200/320/${kw}?lock=${lock || 1}`;
}

function CategoryBanner({ title, keyword }) {
  return (
    <div className="cat-banner">
      <img src={bannerUrl(title, keyword)} alt="" loading="lazy" />
      <div className="cat-banner-overlay" />
      <h2 className="cat-banner-title">{title}</h2>
    </div>
  );
}

export default function MenuPage({ scheduleStatus }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [marmitaSizes, setMarmitaSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState('');
  const categoryRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/categories/active'),
      api.get('/items/active'),
      api.get('/marmita/sizes/active'),
    ])
      .then(([catRes, itemRes, mRes]) => {
        setCategories(catRes.data);
        setItems(itemRes.data);
        const sizes = mRes.data || [];
        setMarmitaSizes(sizes);
        if (sizes.length > 0) setActiveCategory(MARMITA_CAT_ID);
        else if (catRes.data.length > 0) setActiveCategory(catRes.data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const scrollToCategory = (catId) => {
    setActiveCategory(catId);
    categoryRefs.current[catId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getItemsByCategory = (catId) =>
    items.filter(i => i.categoryId === catId || i.category?.id === catId)
         .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const allFiltered = search
    ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  const hasMarmitas = marmitaSizes.length > 0;

  return (
    <div className="menu-page">
      {/* Hero */}
      <div className="menu-hero">
        <div className="menu-hero-content">
          <img src="/logo-branca.jpg" alt="Bakaninha" className="hero-logo" />
          <p className="hero-sub">Cardápio Online</p>
        </div>
        <div className="hero-pattern" />
      </div>

      {/* Closed banner */}
      {scheduleStatus && !scheduleStatus.open && (
        <div className="closed-banner">
          <span className="closed-dot" />
          <span>{scheduleStatus.message} — Pedidos indisponíveis no momento</span>
        </div>
      )}

      {/* Search */}
      <div className="menu-search-wrap">
        <div className="menu-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            className="search-input"
            placeholder="Buscar no cardápio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
        </div>
      </div>

      <div className="menu-layout">
        {/* Category sidebar */}
        {!search && (
          <aside className="category-nav">
            <div className="category-nav-title">CATEGORIAS</div>
            {hasMarmitas && (
              <button
                className={`cat-btn cat-btn-marmita ${activeCategory === MARMITA_CAT_ID ? 'active' : ''}`}
                onClick={() => scrollToCategory(MARMITA_CAT_ID)}
              >
                Marmitas
              </button>
            )}
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => scrollToCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </aside>
        )}

        {/* Items */}
        <main className="menu-main">
          {search ? (
            <>
              <div className="section-divider"><span>Resultados para "{search}"</span></div>
              <div className="items-list">
                {allFiltered.length === 0
                  ? <p style={{ color: 'var(--gray)' }}>Nenhum item encontrado.</p>
                  : allFiltered.map(item => (
                    <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} disabled={scheduleStatus && !scheduleStatus.open} />
                  ))
                }
              </div>
            </>
          ) : (
            <>
              {hasMarmitas && (
                <section
                  ref={el => categoryRefs.current[MARMITA_CAT_ID] = el}
                  className="category-section"
                >
                  <CategoryBanner title="Marmitas" keyword="lunchbox" />
                  <p className="cat-description">Monte a sua marmita escolhendo tamanho, acompanhamentos e proteína.</p>
                  <div className="items-list">
                    {marmitaSizes.map(size => (
                      <MarmitaSizeCard
                        key={size.id}
                        size={size}
                        onClick={() => navigate('/marmita')}
                        disabled={scheduleStatus && !scheduleStatus.open}
                      />
                    ))}
                  </div>
                </section>
              )}

              {categories.map(cat => {
                const catItems = getItemsByCategory(cat.id);
                if (catItems.length === 0) return null;
                return (
                  <section
                    key={cat.id}
                    ref={el => categoryRefs.current[cat.id] = el}
                    className="category-section"
                  >
                    <CategoryBanner title={cat.name} />
                    {cat.description && <p className="cat-description">{cat.description}</p>}
                    <div className="items-list">
                      {catItems.map(item => (
                        <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} disabled={scheduleStatus && !scheduleStatus.open} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </main>
      </div>

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

function ItemCard({ item, onClick, disabled }) {
  const variants = item.variants || (item.variantsJson ? JSON.parse(item.variantsJson) : []);
  const minPrice = variants.length > 0
    ? Math.min(...variants.map(v => v.price))
    : item.basePrice;
  const hasVariants = variants.length > 0;

  const imgSrc = item.imageUrl
    ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}`)
    : null;

  return (
    <div className={`item-card ${disabled ? 'disabled' : ''}`} onClick={disabled ? null : onClick}>
      <div className="item-card-body">
        <h3 className="item-card-name">{item.name}</h3>
        {item.description && <p className="item-card-desc">{item.description}</p>}
        <div className="item-card-footer">
          <div className="item-card-prices">
            {hasVariants ? (
              variants.map(v => (
                <span key={v.name} className="price-variant-tag">
                  <span className="pv-label">{v.name}</span>
                  <span className="pv-value">R$ {Number(v.price).toFixed(2)}</span>
                </span>
              ))
            ) : (
              <span className="price-tag-large">R$ {Number(minPrice).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
      <div className="item-card-image">
        {imgSrc
          ? <img src={imgSrc} alt={item.name} loading="lazy" />
          : <div className="img-placeholder-empty" />
        }
        {hasVariants && <span className="variant-badge">várias opções</span>}
      </div>
    </div>
  );
}

function MarmitaSizeCard({ size, onClick, disabled }) {
  return (
    <div className={`item-card marmita-size-card ${disabled ? 'disabled' : ''}`} onClick={disabled ? null : onClick}>
      <div className="item-card-body">
        <h3 className="item-card-name">Marmita {size.name}</h3>
        <p className="item-card-desc">
          Escolha arroz, feijão, acompanhamentos e a proteína do seu jeito.
        </p>
        <div className="item-card-footer">
          <span className="price-tag-large">R$ {Number(size.price).toFixed(2)}</span>
          <span className="marmita-cta">Montar marmita ›</span>
        </div>
      </div>
      <div className="item-card-image marmita-card-image">
        <div className="img-placeholder-empty" />
      </div>
    </div>
  );
}
