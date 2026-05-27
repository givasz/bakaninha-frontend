import React, { useState, useEffect } from 'react';
import api, { API_URL } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function AdminMarmita() {
  const [tab, setTab] = useState('items'); // items | groups | sizes
  const [sizes, setSizes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sr, gr, ir] = await Promise.all([
        api.get('/marmita/sizes'),
        api.get('/marmita/item-groups'),
        api.get('/marmita/items'),
      ]);
      setSizes(sr.data);
      setGroups(gr.data);
      setItems(ir.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  if (loading) return <div style={{padding:40,display:'flex',justifyContent:'center'}}><div className="spinner"/></div>;

  return (
    <div className="marmita-admin-v2">
      <div className="marmita-admin-tabs">
        <button className={`marmita-admin-tab ${tab==='items'?'active':''}`} onClick={()=>setTab('items')}>
          Itens <span className="tab-count">{items.length}</span>
        </button>
        <button className={`marmita-admin-tab ${tab==='groups'?'active':''}`} onClick={()=>setTab('groups')}>
          Grupos <span className="tab-count">{groups.length}</span>
        </button>
        <button className={`marmita-admin-tab ${tab==='sizes'?'active':''}`} onClick={()=>setTab('sizes')}>
          Tamanhos <span className="tab-count">{sizes.length}</span>
        </button>
      </div>

      {tab === 'items'  && <ItemsTab  items={items}  groups={groups} sizes={sizes} reload={loadAll} showToast={showToast} />}
      {tab === 'groups' && <GroupsTab groups={groups} sizes={sizes}  reload={loadAll} showToast={showToast} />}
      {tab === 'sizes'  && <SizesTab  sizes={sizes}                    reload={loadAll} showToast={showToast} />}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   ITEMS TAB — global items grouped by their itemGroup
   ────────────────────────────────────────────────────────── */
function ItemsTab({ items, groups, sizes, reload, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('');
  const confirm = useConfirm();

  const openNew = (presetGroupId) => {
    setEditing({
      _new: true,
      name: '', imageUrl: '', extraPrice: 0, active: true,
      itemGroupId: presetGroupId || (groups[0]?.id || ''),
      allowedSizes: [],
    });
    setShowForm(true);
  };
  const openEdit = (it) => {
    let allowed = [];
    try { allowed = JSON.parse(it.allowedSizesJson || '[]'); } catch {}
    setEditing({
      _new: false,
      id: it.id,
      name: it.name, imageUrl: it.imageUrl || '',
      extraPrice: it.extraPrice, active: it.active,
      itemGroupId: it.itemGroupId,
      allowedSizes: allowed,
    });
    setShowForm(true);
  };

  const handleToggle = async (it) => {
    try {
      await api.put(`/marmita/items/${it.id}`, { active: !it.active });
      reload();
    } catch { showToast('Erro ao alternar', 'error'); }
  };

  const handleDelete = async (it) => {
    const ok = await confirm({
      title: 'Remover item',
      message: `Tem certeza que deseja remover "${it.name}"? Ele sai de todos os tamanhos.`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/marmita/items/${it.id}`);
      showToast('Item removido', 'success'); reload();
    } catch { showToast('Erro ao remover', 'error'); }
  };

  if (groups.length === 0) {
    return (
      <div className="marmita-admin-empty marmita-admin-empty-cta">
        <p style={{marginBottom:12}}>
          Para cadastrar itens você precisa primeiro de pelo menos um <strong>grupo</strong> (ex.: Proteína).
        </p>
        <p style={{fontSize:13,color:'var(--gray)'}}>Abra a aba <strong>Grupos</strong> e crie um.</p>
      </div>
    );
  }

  const filterText = filter.trim().toLowerCase();
  const visibleItems = filterText
    ? items.filter(i => i.name.toLowerCase().includes(filterText))
    : items;

  const sortedGroups = [...groups].sort((a,b) => (a.order - b.order) || a.name.localeCompare(b.name));
  const grouped = sortedGroups.map(g => ({
    ...g,
    _items: visibleItems.filter(i => i.itemGroupId === g.id),
  })).filter(g => g._items.length > 0 || !filterText);

  return (
    <>
      <div className="admin-toolbar">
        <div style={{display:'flex',alignItems:'center',gap:12,flex:1,flexWrap:'wrap'}}>
          <p style={{color:'var(--gray)',fontSize:14,margin:0}}>{items.length} item(s) globais</p>
          <input
            className="form-input"
            placeholder="Filtrar pelo nome..."
            value={filter}
            onChange={e=>setFilter(e.target.value)}
            style={{maxWidth:280}}
          />
        </div>
        <button className="btn btn-primary" onClick={() => openNew()}>+ Novo Item</button>
      </div>

      {grouped.length === 0 && (
        <div className="marmita-admin-empty">
          <p>Nenhum item encontrado.</p>
        </div>
      )}

      {grouped.map(g => (
        <div key={g.id} className="marmita-admin-group">
          <div className="marmita-admin-group-header">
            <div className="marmita-admin-group-meta">
              <span className="marmita-admin-group-name">{g.name}</span>
              <span className="marmita-admin-group-pill">{g._items.length} {g._items.length === 1 ? 'item' : 'itens'}</span>
              <span className="marmita-admin-group-pill">
                em {g.sizeGroups?.length || 0} tamanho(s)
              </span>
            </div>
            <button className="btn btn-primary marmita-admin-mini-btn" onClick={() => openNew(g.id)}>
              + Item nesse grupo
            </button>
          </div>

          <div className="marmita-admin-items">
            {g._items.length === 0 ? (
              <div className="marmita-admin-empty marmita-admin-empty-small">
                <p>Sem itens neste grupo.</p>
              </div>
            ) : g._items.map(it => {
              const imgSrc = it.imageUrl
                ? (it.imageUrl.startsWith('http') ? it.imageUrl : `${API_URL}${it.imageUrl}`)
                : null;
              let allowed = [];
              try { allowed = JSON.parse(it.allowedSizesJson || '[]'); } catch {}
              const sizeLabel = allowed.length === 0
                ? 'Em todos os tamanhos'
                : `Só em ${allowed.map(id => sizes.find(s => s.id === id)?.name).filter(Boolean).join(', ')}`;

              return (
                <div key={it.id} className="marmita-admin-item">
                  <div className="marmita-admin-item-img">
                    {imgSrc ? <img src={imgSrc} alt={it.name} /> : <div className="img-placeholder-empty" />}
                  </div>
                  <div className="marmita-admin-item-info">
                    <div>
                      <span className="marmita-admin-item-name">{it.name}</span>
                      {it.extraPrice > 0 && <span className="marmita-admin-item-extra">+R$ {Number(it.extraPrice).toFixed(2)}</span>}
                      {!it.active && <span className="inactive-tag" style={{marginLeft:8}}>Inativo</span>}
                    </div>
                    <div className="marmita-admin-item-meta">{sizeLabel}</div>
                  </div>
                  <div className="marmita-admin-item-actions">
                    <label className={`active-toggle ${it.active ? 'on' : 'off'}`} title={it.active ? 'Clique para desativar' : 'Clique para ativar'}>
                      <span className="active-toggle-label">{it.active ? 'Ativo' : 'Inativo'}</span>
                      <span className="switch">
                        <input type="checkbox" checked={it.active} onChange={()=>handleToggle(it)} />
                        <span className="slider" />
                      </span>
                    </label>
                    <button className="btn btn-secondary marmita-admin-mini-btn" onClick={()=>openEdit(it)}>Editar</button>
                    <button className="btn btn-danger marmita-admin-mini-btn" onClick={()=>handleDelete(it)}>Excluir</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showForm && (
        <ItemFormModal
          editing={editing}
          groups={groups}
          sizes={sizes}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); reload(); }}
          showToast={showToast}
        />
      )}
    </>
  );
}

function ItemFormModal({ editing, groups, sizes, onClose, onSaved, showToast }) {
  const [form, setForm] = useState(editing);
  const [uploading, setUploading] = useState(false);

  const toggleSize = (id) => {
    setForm(f => {
      const has = f.allowedSizes.includes(id);
      return { ...f, allowedSizes: has ? f.allowedSizes.filter(x => x !== id) : [...f.allowedSizes, id] };
    });
  };

  const handleImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post('/upload/image', fd);
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch { showToast('Erro ao enviar imagem', 'error'); }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      imageUrl: form.imageUrl || null,
      extraPrice: +form.extraPrice || 0,
      active: form.active,
      itemGroupId: +form.itemGroupId,
      allowedSizes: form.allowedSizes,
    };
    try {
      if (form._new) await api.post('/marmita/items', payload);
      else            await api.put(`/marmita/items/${form.id}`, payload);
      showToast('Item salvo', 'success');
      onSaved();
    } catch { showToast('Erro ao salvar', 'error'); }
  };

  return (
    <div className="overlay center" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal rounded" style={{maxWidth:480}}>
        <div className="modal-header">
          <h2>{form._new ? 'Novo Item da Marmita' : 'Editar Item'}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label className="form-label">Nome *</label>
            <input className="form-input" required autoFocus value={form.name}
              onChange={e=>setForm({...form, name:e.target.value})}
              placeholder="Ex: Picanha, Frango Grelhado" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Grupo *</label>
              <select className="form-input" required value={form.itemGroupId}
                onChange={e=>setForm({...form, itemGroupId:+e.target.value})}>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Preço extra (R$)</label>
              <input type="number" step="0.01" className="form-input" value={form.extraPrice}
                onChange={e=>setForm({...form, extraPrice:e.target.value})}
                placeholder="0 = sem adicional" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Aparecer nos tamanhos</label>
            <p style={{fontSize:12,color:'var(--gray)',marginBottom:6}}>
              Não marcar nenhum = aparece em <strong>todos</strong> os tamanhos.
            </p>
            <div className="size-chip-row">
              {sizes.map(s => {
                const on = form.allowedSizes.includes(s.id);
                return (
                  <button key={s.id} type="button"
                    className={`size-chip ${on ? 'on' : ''}`}
                    onClick={() => toggleSize(s.id)}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Foto</label>
            {form.imageUrl ? (
              <div className="img-upload-preview">
                <img src={form.imageUrl.startsWith('http') ? form.imageUrl : `${API_URL}${form.imageUrl}`} alt="preview"/>
                <button type="button" className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}}
                  onClick={()=>setForm({...form, imageUrl:''})}>Remover</button>
              </div>
            ) : (
              <div className="img-upload-area">
                <input type="file" accept="image/*" onChange={handleImage}/>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--gray)', marginBottom: 6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div style={{fontSize:13,color:'var(--gray)'}}>{uploading?'Enviando...':'Clique para enviar'}</div>
              </div>
            )}
          </div>

          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <label className="switch">
              <input type="checkbox" checked={form.active}
                onChange={e=>setForm({...form, active:e.target.checked})}/>
              <span className="slider"/>
            </label>
            <span style={{fontSize:14,color:'var(--gray-light)'}}>Ativo</span>
          </div>

          <div className="admin-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   GROUPS TAB — global groups + per-size config (sizeGroups)
   ────────────────────────────────────────────────────────── */
function GroupsTab({ groups, sizes, reload, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const confirm = useConfirm();

  const openNew  = () => { setEditing({ _new: true, name:'', order: 0 }); setShowForm(true); };
  const openEdit = (g) => { setEditing({ _new: false, id: g.id, name: g.name, order: g.order }); setShowForm(true); };

  const saveGroup = async (e) => {
    e.preventDefault();
    try {
      if (editing._new) await api.post('/marmita/item-groups', { name: editing.name, order: +editing.order });
      else               await api.put(`/marmita/item-groups/${editing.id}`, { name: editing.name, order: +editing.order });
      showToast('Grupo salvo', 'success');
      setShowForm(false); reload();
    } catch { showToast('Erro ao salvar', 'error'); }
  };

  const deleteGroup = async (g) => {
    const ok = await confirm({
      title: 'Remover grupo',
      message: `Remover o grupo "${g.name}"? Todos os itens dele também serão excluídos.`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/marmita/item-groups/${g.id}`);
      showToast('Grupo removido', 'success'); reload();
    } catch { showToast('Erro ao remover', 'error'); }
  };

  const handleSizeToggle = async (group, size, currentSg) => {
    // attaching → upsert with defaults; detaching → delete
    if (currentSg) {
      try {
        await api.delete(`/marmita/size-groups/${size.id}/${group.id}`);
        reload();
      } catch { showToast('Erro ao desvincular', 'error'); }
    } else {
      try {
        await api.post('/marmita/size-groups', {
          marmitaSizeId: size.id, itemGroupId: group.id,
          maxChoices: 1, required: true, order: group.order || 0,
        });
        reload();
      } catch { showToast('Erro ao vincular', 'error'); }
    }
  };

  const updateSizeGroup = async (group, size, currentSg, patch) => {
    try {
      await api.post('/marmita/size-groups', {
        marmitaSizeId: size.id, itemGroupId: group.id,
        maxChoices: currentSg?.maxChoices ?? 1,
        required: currentSg?.required ?? true,
        order: currentSg?.order ?? 0,
        ...patch,
      });
      reload();
    } catch { showToast('Erro ao atualizar', 'error'); }
  };

  const sortedGroups = [...groups].sort((a,b) => (a.order - b.order) || a.name.localeCompare(b.name));

  return (
    <>
      <div className="admin-toolbar">
        <p style={{color:'var(--gray)',fontSize:14,margin:0}}>
          Grupos globais. Defina em quais tamanhos cada grupo aparece e o limite máximo de escolhas.
        </p>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Grupo</button>
      </div>

      {sortedGroups.length === 0 && (
        <div className="marmita-admin-empty">
          <p>Nenhum grupo cadastrado. Clique em <strong>+ Novo Grupo</strong>.</p>
        </div>
      )}

      {sortedGroups.map(g => (
        <div key={g.id} className="marmita-admin-group">
          <div className="marmita-admin-group-header">
            <div className="marmita-admin-group-meta">
              <span className="marmita-admin-group-name">{g.name}</span>
              <span className="marmita-admin-group-pill">{g.items?.length || 0} itens</span>
            </div>
            <div className="marmita-admin-group-actions">
              <button className="btn btn-secondary marmita-admin-mini-btn" onClick={()=>openEdit(g)}>Editar</button>
              <button className="btn btn-danger marmita-admin-mini-btn" onClick={()=>deleteGroup(g)}>Excluir</button>
            </div>
          </div>
          <div className="size-config-grid">
            {sizes.map(s => {
              const sg = g.sizeGroups?.find(x => x.marmitaSizeId === s.id);
              const linked = !!sg;
              return (
                <div key={s.id} className={`size-config-card ${linked ? 'linked' : ''}`}>
                  <div className="size-config-head">
                    <span className="size-config-name">Tamanho {s.name}</span>
                    <label className="switch">
                      <input type="checkbox" checked={linked} onChange={() => handleSizeToggle(g, s, sg)} />
                      <span className="slider" />
                    </label>
                  </div>
                  {linked && (
                    <div className="size-config-body">
                      <label className="size-config-row">
                        <span>Máx. escolhas</span>
                        <input type="number" min="1" value={sg.maxChoices}
                          onChange={e=>updateSizeGroup(g, s, sg, { maxChoices: +e.target.value || 1 })}
                          className="form-input" style={{maxWidth:72,padding:'6px 8px'}} />
                      </label>
                      <label className="size-config-row">
                        <span>Ordem</span>
                        <input type="number" value={sg.order}
                          onChange={e=>updateSizeGroup(g, s, sg, { order: +e.target.value || 0 })}
                          className="form-input" style={{maxWidth:72,padding:'6px 8px'}} />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {showForm && (
        <div className="overlay center" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal rounded" style={{maxWidth:420}}>
            <div className="modal-header">
              <h2>{editing._new ? 'Novo Grupo' : 'Editar Grupo'}</h2>
              <button className="btn-close" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <form onSubmit={saveGroup} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nome do grupo *</label>
                <input className="form-input" required autoFocus value={editing.name}
                  onChange={e=>setEditing({...editing, name:e.target.value})}
                  placeholder="Ex: Proteína, Arroz, Acompanhamento" />
              </div>
              <div className="form-group">
                <label className="form-label">Ordem de exibição</label>
                <input type="number" className="form-input" value={editing.order}
                  onChange={e=>setEditing({...editing, order:e.target.value})}/>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   SIZES TAB — basic CRUD for marmita sizes
   ────────────────────────────────────────────────────────── */
function SizesTab({ sizes, reload, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const confirm = useConfirm();

  const openNew  = () => { setEditing({ _new: true, name:'', price:'', order:0, active:true }); setShowForm(true); };
  const openEdit = (s) => { setEditing({ _new: false, id:s.id, name:s.name, price:s.price, order:s.order, active:s.active }); setShowForm(true); };

  const handleToggle = async (s) => {
    await api.put(`/marmita/sizes/${s.id}`, { active: !s.active });
    reload();
  };

  const handleDelete = async (s) => {
    const ok = await confirm({
      title: 'Remover tamanho',
      message: `Remover o tamanho "${s.name}"? Os vínculos com grupos desse tamanho também serão apagados.`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;
    await api.delete(`/marmita/sizes/${s.id}`);
    showToast('Tamanho removido', 'success'); reload();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { name: editing.name, price: +editing.price, order: +editing.order, active: editing.active };
    try {
      if (editing._new) await api.post('/marmita/sizes', payload);
      else               await api.put(`/marmita/sizes/${editing.id}`, payload);
      showToast('Tamanho salvo', 'success');
      setShowForm(false); reload();
    } catch { showToast('Erro ao salvar', 'error'); }
  };

  return (
    <>
      <div className="admin-toolbar">
        <p style={{color:'var(--gray)',fontSize:14,margin:0}}>{sizes.length} tamanho(s) de marmita</p>
        <button className="btn btn-primary" onClick={openNew}>+ Novo Tamanho</button>
      </div>

      <div className="admin-list">
        {sizes.map(s => (
          <div key={s.id} className="admin-list-item">
            <div className="admin-list-item-info">
              <div className="admin-list-item-name">Marmita {s.name}</div>
              <div className="admin-list-item-sub">R$ {Number(s.price).toFixed(2)} · ordem {s.order}</div>
            </div>
            <div className="admin-list-item-actions">
              <label className={`active-toggle ${s.active ? 'on' : 'off'}`} title={s.active ? 'Clique para desativar' : 'Clique para ativar'}>
                <span className="active-toggle-label">{s.active ? 'Ativo' : 'Inativo'}</span>
                <span className="switch">
                  <input type="checkbox" checked={s.active} onChange={() => handleToggle(s)}/>
                  <span className="slider"/>
                </span>
              </label>
              <button className="btn btn-secondary" style={{padding:'8px 14px',fontSize:13}} onClick={() => openEdit(s)}>Editar</button>
              <button className="btn btn-danger" style={{padding:'8px 14px',fontSize:13}} onClick={() => handleDelete(s)}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="overlay center" onClick={e=>e.target===e.currentTarget&&setShowForm(false)}>
          <div className="modal rounded" style={{maxWidth:420}}>
            <div className="modal-header">
              <h2>{editing._new ? 'Novo Tamanho' : 'Editar Tamanho'}</h2>
              <button className="btn-close" onClick={()=>setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" required autoFocus value={editing.name}
                  onChange={e=>setEditing({...editing, name:e.target.value})}
                  placeholder="Ex: P, M, G, GG" />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Preço base (R$) *</label>
                  <input type="number" step="0.01" className="form-input" required value={editing.price}
                    onChange={e=>setEditing({...editing, price:e.target.value})}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Ordem</label>
                  <input type="number" className="form-input" value={editing.order}
                    onChange={e=>setEditing({...editing, order:e.target.value})}/>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <label className="switch">
                  <input type="checkbox" checked={editing.active}
                    onChange={e=>setEditing({...editing, active:e.target.checked})}/>
                  <span className="slider"/>
                </label>
                <span style={{fontSize:14,color:'var(--gray-light)'}}>Ativo</span>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
