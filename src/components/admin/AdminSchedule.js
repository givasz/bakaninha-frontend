import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';

const DAY_NAMES = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

export default function AdminSchedule() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.get('/schedule').then(r => setSchedules(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleUpdate = async (id, field, value) => {
    const updated = schedules.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSchedules(updated);
    try {
      await api.put(`/schedule/${id}`, { [field]: value });
      showToast('Horário salvo', 'success');
    } catch { showToast('Erro ao salvar', 'error'); load(); }
  };

  if (loading) return <div style={{padding:40,display:'flex',justifyContent:'center'}}><div className="spinner"/></div>;

  return (
    <div className="admin-section">
      <p style={{fontSize:14,color:'var(--gray)',marginBottom:4}}>
        Configure os horários de funcionamento. O cardápio exibirá o status em tempo real.
      </p>
      <div style={{background:'rgba(232,101,10,0.08)',border:'1px solid rgba(232,101,10,0.3)',borderRadius:'var(--radius-sm)',padding:'10px 16px',fontSize:13,color:'var(--orange)',marginBottom:16}}>
        Horários no fuso de Brasília (UTC-3)
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {schedules.map(s => (
          <div key={s.id} className="admin-list-item" style={{alignItems:'center',gap:16,flexWrap:'wrap'}}>
            <div style={{width:140,flexShrink:0}}>
              <div style={{fontWeight:700,fontSize:15}}>{DAY_NAMES[s.dayOfWeek]}</div>
            </div>

            <label className="switch" title={s.open?'Aberto':'Fechado'}>
              <input type="checkbox" checked={s.open} onChange={e => handleUpdate(s.id,'open',e.target.checked)}/>
              <span className="slider"/>
            </label>
            <span style={{fontSize:13,color:s.open?'var(--success)':'var(--gray)',fontWeight:700,minWidth:60}}>
              {s.open ? 'Aberto' : 'Fechado'}
            </span>

            {s.open && (
              <>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <label style={{fontSize:12,color:'var(--gray)',fontWeight:700}}>Abre</label>
                  <input
                    type="time" className="form-input" style={{width:110,padding:'8px 10px'}}
                    value={s.openTime}
                    onChange={e => handleUpdate(s.id,'openTime',e.target.value)}
                  />
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <label style={{fontSize:12,color:'var(--gray)',fontWeight:700}}>Fecha</label>
                  <input
                    type="time" className="form-input" style={{width:110,padding:'8px 10px'}}
                    value={s.closeTime}
                    onChange={e => handleUpdate(s.id,'closeTime',e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
