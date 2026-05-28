import React, { useState, useEffect } from 'react';
import api, { API_URL } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const EMPTY = { name: '', description: '', imageUrl: '', order: 0, active: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const imgSrc = (url) => url ? (url.startsWith('http') ? url : `${API_URL}${url}`) : null;

  const load = () => {
    setLoading(true);
    api.get('/categories').then(r => setCategories(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (cat) => { setEditing(cat); setForm({ name: cat.name, description: cat.description || '', imageUrl: cat.imageUrl || '', order: cat.order, active: cat.active }); setShowForm(true); };

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

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...form, imageUrl: form.imageUrl || null };
    try {
      if (editing) await api.put(`/categories/${editing.id}`, payload);
      else          await api.post('/categories', payload);
      showToast(editing ? 'Categoria atualizada' : 'Categoria criada', 'success');
      setShowForm(false); load();
    } catch { showToast('Erro ao salvar', 'error'); }
  };

  const handleToggle = async (cat) => {
    await api.put(`/categories/${cat.id}`, { active: !cat.active });
    load();
  };

  const handleDelete = async (cat) => {
    const ok = await confirm({
      title: 'Remover categoria',
      message: `Tem certeza que deseja remover "${cat.name}"?`,
      confirmText: 'Remover',
      danger: true,
    });
    if (!ok) return;
    await api.delete(`/categories/${cat.id}`);
    showToast('Categoria removida', 'success');
    load();
  };

  if (loading) return <div style={{padding:40,display:'flex',justifyContent:'center'}}><div className="spinner"/></div>;

  return (
    <div className="admin-section">
      <div className="admin-toolbar">
        <p style={{color:'var(--gray)',fontSize:14}}>{categories.length} categoria(s)</p>
        <button className="btn btn-primary" onClick={openNew}>+ Nova Categoria</button>
      </div>

      <div className="admin-list">
        {categories.map(cat => (
          <div key={cat.id} className="admin-list-item">
            {cat.imageUrl && (
              <div className="admin-list-item-img">
                <img src={imgSrc(cat.imageUrl)} alt={cat.name} />
              </div>
            )}
            <div className="admin-list-item-info">
              <div className="admin-list-item-name">{cat.name}</div>
              {cat.description && <div className="admin-list-item-sub">{cat.description}</div>}
            </div>
            <div className="admin-list-item-actions">
              <label className={`active-toggle ${cat.active ? 'on' : 'off'}`} title={cat.active ? 'Clique para desativar' : 'Clique para ativar'}>
                <span className="active-toggle-label">{cat.active ? 'Ativo' : 'Inativo'}</span>
                <span className="switch">
                  <input type="checkbox" checked={cat.active} onChange={() => handleToggle(cat)} />
                  <span className="slider" />
                </span>
              </label>
              <button className="btn btn-secondary" style={{padding:'8px 14px',fontSize:13}} onClick={() => openEdit(cat)}>Editar</button>
              <button className="btn btn-danger" style={{padding:'8px 14px',fontSize:13}} onClick={() => handleDelete(cat)}>Remover</button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="overlay center" onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div className="modal rounded" style={{maxWidth:480}}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required placeholder="Ex: Filé Bovino" />
              </div>
              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea className="form-input" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Descrição opcional" />
              </div>
              <div className="form-group">
                <label className="form-label">Imagem da categoria</label>
                <p style={{fontSize:12,color:'var(--gray)',marginBottom:6}}>
                  Aparece como banner no topo da categoria no cardápio. Opcional.
                </p>
                {form.imageUrl ? (
                  <div className="img-upload-preview">
                    <img src={imgSrc(form.imageUrl)} alt="preview" />
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
              <div className="form-group">
                <label className="form-label">Ordem de exibição</label>
                <input type="number" className="form-input" value={form.order} onChange={e=>setForm({...form,order:+e.target.value})} />
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <label className="switch"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/><span className="slider"/></label>
                <span style={{fontSize:14,color:'var(--gray-light)'}}>Ativa</span>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
