import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AdminDelivery() {
  const [fee, setFee] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    api.get('/settings')
      .then(r => setFee(String(r.data.deliveryFee ?? 0)))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/settings', { deliveryFee: +fee || 0 });
      setFee(String(data.deliveryFee));
      showToast('Taxa de entrega salva', 'success');
    } catch { showToast('Erro ao salvar', 'error'); }
    setSaving(false);
  };

  if (loading) return <div style={{padding:40,display:'flex',justifyContent:'center'}}><div className="spinner"/></div>;

  return (
    <div className="admin-section">
      <p style={{fontSize:14,color:'var(--gray)',marginBottom:16}}>
        Valor cobrado nos pedidos do tipo <strong>Entrega</strong>. Use <strong>0</strong> para entrega grátis.
        Não afeta pedidos para comer no local.
      </p>

      <form onSubmit={handleSave} className="admin-list-item" style={{alignItems:'flex-end',gap:16,flexWrap:'wrap',maxWidth:420}}>
        <div className="form-group" style={{flex:1,minWidth:160}}>
          <label className="form-label">Taxa de entrega (R$)</label>
          <input
            type="number" step="0.01" min="0" className="form-input"
            value={fee}
            onChange={e => setFee(e.target.value)}
            placeholder="0.00"
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
}
