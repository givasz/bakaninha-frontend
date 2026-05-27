import React, { useState, useEffect, useRef } from 'react';
import api, { API_URL } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const EMPTY_FORM = {
  name: '', description: '', categoryId: '', basePrice: '',
  active: true, imageUrl: '', variants: [],
};

export default function AdminItems() {
  const [items, setItems]         = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter]       = useState('');
  const [collapsed, setCollapsed] = useState({}); // categoryId -> bool
  const fileRef = useRef();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const toggleCollapsed = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/items'), api.get('/categories')])
      .then(([ir, cr]) => { setItems(ir.data); setCategories(cr.data); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (item) => {
    setEditing(item);
    let variants = [];
    try { variants = JSON.parse(item.variantsJson || '[]'); } catch {}
    setForm({
      name: item.name, description: item.description || '',
      categoryId: item.categoryId || '',
      basePrice: item.basePrice || '',
      active: item.active, imageUrl: item.imageUrl || '',
      variants,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post('/upload/image', fd);
      setForm(f => ({ ...f, imageUrl: data.url }));
      showToast('Imagem enviada!', 'success');
    } catch { showToast('Erro ao enviar imagem', 'error'); }
    setUploading(false);
  };

  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, { name: '', price: '' }] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i, field, val) =>
    setForm(f => ({ ...f, variants: f.variants.map((v, idx) => idx === i ? { ...v, [field]: val } : v) }));

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      categoryId: form.categoryId ? +form.categoryId : null,
      basePrice: +form.basePrice || 0,
      variants: form.variants.map(v => ({ name: v.name, price: +v.price })),
    };
    try {
      if (editing) await api.put(`/items/${editing.id}`, payload);
      else          await api.post('/items', payload);
      showToast(editing ? 'Item atualizado' : 'Item criado', 'success');
      setShowForm(false); load();
    } catch { showToast('Erro ao salvar', 'error'); }
  };

  const handleToggle = async (item) => {
    await api.put(`/items/${item.id}`, { active: !item.active });
    load();
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Remover item',
      message: `Tem certeza que deseja remover "${item.name}" do cardápio?`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;
    await api.delete(`/items/${item.id}`);
    showToast('Item removido', 'success');
    load();
  };

  if (loading) return <div style={{padding:40,display:'flex',justifyContent:'center'}}><div className="spinner"/></div>;

  const filterText = filter.trim().toLowerCase();
  const filteredItems = filterText
    ? items.filter(i => i.name.toLowerCase().includes(filterText))
    : items;

  // Build groups: sorted categories + uncategorized
  const sortedCats = [...categories].sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
  const groups = sortedCats
    .map(cat => ({
      id: cat.id,
      name: cat.name,
      items: filteredItems.filter(it => (it.categoryId || it.category?.id) === cat.id),
    }));
  const uncategorized = filteredItems.filter(it => !(it.categoryId || it.category?.id));
  if (uncategorized.length > 0) {
    groups.push({ id: 'none', name: 'Sem categoria', items: uncategorized });
  }
  const visibleGroups = groups.filter(g => g.items.length > 0);

  const renderItem = (item) => {
    const imgSrc = item.imageUrl
      ? (item.imageUrl.startsWith('http') ? item.imageUrl : `${API_URL}${item.imageUrl}`)
      : null;
    let variants = [];
    try { variants = JSON.parse(item.variantsJson || '[]'); } catch {}

    return (
      <div key={item.id} className="admin-list-item">
        <div className="admin-list-item-img">
          {imgSrc ? <img src={imgSrc} alt={item.name}/> : <div className="img-placeholder" style={{height:'100%'}}/>}
        </div>
        <div className="admin-list-item-info">
          <div className="admin-list-item-name">{item.name}</div>
          <div className="admin-list-item-sub">
            {variants.length > 0
              ? variants.map(v => `${v.name} R$${Number(v.price).toFixed(2)}`).join(' | ')
              : `R$ ${Number(item.basePrice).toFixed(2)}`
            }
          </div>
        </div>
        <div className="admin-list-item-actions">
          <label className={`active-toggle ${item.active ? 'on' : 'off'}`} title={item.active ? 'Clique para desativar' : 'Clique para ativar'}>
            <span className="active-toggle-label">{item.active ? 'Ativo' : 'Inativo'}</span>
            <span className="switch">
              <input type="checkbox" checked={item.active} onChange={() => handleToggle(item)}/>
              <span className="slider"/>
            </span>
          </label>
          <button className="btn btn-secondary" style={{padding:'8px 14px',fontSize:13}} onClick={() => openEdit(item)}>Editar</button>
          <button className="btn btn-danger" style={{padding:'8px 14px',fontSize:13}} onClick={() => handleDelete(item)}>Remover</button>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <div style={{display:'flex',alignItems:'center',gap:12,flex:1,flexWrap:'wrap'}}>
          <p style={{color:'var(--gray)',fontSize:14,margin:0}}>{items.length} item(s) em {sortedCats.length} categoria(s)</p>
          <input
            className="form-input"
            placeholder="Filtrar pelo nome..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{maxWidth:280}}
          />
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Item</button>
      </div>

      {visibleGroups.length === 0 && (
        <div className="marmita-admin-empty">
          <p>{filterText ? `Nenhum item encontrado para "${filter}".` : 'Nenhum item cadastrado ainda.'}</p>
        </div>
      )}

      {visibleGroups.map(group => {
        const isCollapsed = !filterText && !!collapsed[group.id];
        return (
          <div key={group.id} className="admin-cat-group">
            <button
              type="button"
              className="admin-cat-header"
              onClick={() => toggleCollapsed(group.id)}
            >
              <span className="admin-cat-name">{group.name}</span>
              <span className="admin-cat-meta">
                <span className="admin-cat-count">{group.items.length} {group.items.length === 1 ? 'item' : 'itens'}</span>
                <span className={`admin-cat-chevron ${isCollapsed ? '' : 'open'}`} aria-hidden>▾</span>
              </span>
            </button>
            {!isCollapsed && (
              <div className="admin-list">
                {group.items.map(renderItem)}
              </div>
            )}
          </div>
        );
      })}

      {showForm && (
        <div className="overlay" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editing ? 'Editar Item' : 'Novo Item'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Ex: Parmegiana Bakaninha"/>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição / Ingredientes</label>
                <textarea className="form-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Arroz, Batata Frita, Parmesão..."/>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-input" value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})}>
                    <option value="">Sem categoria</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Preço base (R$)</label>
                  <input type="number" step="0.01" className="form-input" value={form.basePrice} onChange={e=>setForm({...form,basePrice:e.target.value})} placeholder="0.00"/>
                </div>
              </div>

              {/* Variants */}
              <div className="form-group">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                  <label className="form-label" style={{margin:0}}>Versões (Completa / 1/2 / Indiv.)</label>
                  <button type="button" className="btn btn-secondary" style={{padding:'6px 12px',fontSize:12}} onClick={addVariant}>+ Versão</button>
                </div>
                <div className="variants-list">
                  {form.variants.map((v, i) => (
                    <div key={i} className="variant-row">
                      <input className="form-input" placeholder="Nome (ex: Completa)" value={v.name} onChange={e=>updateVariant(i,'name',e.target.value)}/>
                      <input type="number" step="0.01" className="form-input" placeholder="Preço" value={v.price} onChange={e=>updateVariant(i,'price',e.target.value)} style={{maxWidth:120}}/>
                      <button type="button" className="btn btn-danger" style={{padding:'10px 12px'}} onClick={()=>removeVariant(i)}>Remover</button>
                    </div>
                  ))}
                  {form.variants.length === 0 && <p style={{fontSize:13,color:'var(--gray)'}}>Sem versões — use o preço base acima.</p>}
                </div>
              </div>

              {/* Image */}
              <div className="form-group">
                <label className="form-label">Imagem</label>
                {form.imageUrl ? (
                  <div className="img-upload-preview">
                    <img src={form.imageUrl.startsWith('http') ? form.imageUrl : `${API_URL}${form.imageUrl}`} alt="preview"/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:600}}>Imagem selecionada</div>
                      <button type="button" className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12,marginTop:6}} onClick={()=>setForm({...form,imageUrl:''})}>Remover</button>
                    </div>
                  </div>
                ) : (
                  <div className="img-upload-area">
                    <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileRef}/>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--gray)', marginBottom: 6 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div style={{fontSize:14,color:'var(--gray)'}}>
                      {uploading ? 'Enviando...' : 'Clique para enviar imagem do computador'}
                    </div>
                  </div>
                )}
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:8}}>
                  <span style={{fontSize:12,color:'var(--gray)'}}>ou URL:</span>
                  <input className="form-input" style={{flex:1}} placeholder="https://..." value={form.imageUrl} onChange={e=>setForm({...form,imageUrl:e.target.value})}/>
                </div>
              </div>

              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <label className="switch"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span className="slider"/></label>
                <span style={{fontSize:14,color:'var(--gray-light)'}}>Ativo no cardápio</span>
              </div>

              <div className="admin-form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
