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

  // Atualização otimista + PUT. `patch` pode conter { open } ou { intervals }.
  const save = async (id, patch) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    try {
      await api.put(`/schedule/${id}`, patch);
      showToast('Horário salvo', 'success');
    } catch { showToast('Erro ao salvar', 'error'); load(); }
  };

  const getIntervals = (s) => (s.intervals?.length ? s.intervals : [{ open: s.openTime || '11:00', close: s.closeTime || '22:00' }]);

  const changeInterval = (s, idx, field, value) => {
    const intervals = getIntervals(s).map((iv, i) => i === idx ? { ...iv, [field]: value } : iv);
    save(s.id, { intervals });
  };
  const addInterval = (s) => {
    const intervals = [...getIntervals(s), { open: '18:00', close: '22:00' }];
    save(s.id, { intervals });
  };
  const removeInterval = (s, idx) => {
    const intervals = getIntervals(s).filter((_, i) => i !== idx);
    save(s.id, { intervals });
  };

  if (loading) return <div style={{padding:40,display:'flex',justifyContent:'center'}}><div className="spinner"/></div>;

  return (
    <div className="admin-section">
      <p style={{fontSize:14,color:'var(--gray)',marginBottom:4}}>
        Configure os horários de funcionamento. Adicione mais de um intervalo por dia
        (ex.: 10:30–14:00 e 18:00–23:00). O cardápio exibe o status em tempo real.
      </p>
      <div style={{background:'rgba(232,101,10,0.08)',border:'1px solid rgba(232,101,10,0.3)',borderRadius:'var(--radius-sm)',padding:'10px 16px',fontSize:13,color:'var(--orange)',marginBottom:16}}>
        Horários no fuso de Brasília (UTC-3)
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {schedules.map(s => {
          const intervals = getIntervals(s);
          return (
            <div key={s.id} className="admin-list-item sched-row" style={{alignItems:'flex-start',gap:16,flexWrap:'wrap'}}>
              <div className="sched-day">
                <div style={{fontWeight:700,fontSize:15}}>{DAY_NAMES[s.dayOfWeek]}</div>
              </div>

              <div className="sched-toggle" style={{display:'flex',alignItems:'center',gap:10}}>
                <label className="switch" title={s.open?'Aberto':'Fechado'}>
                  <input type="checkbox" checked={s.open} onChange={e => save(s.id,{ open:e.target.checked })}/>
                  <span className="slider"/>
                </label>
                <span style={{fontSize:13,color:s.open?'var(--success)':'var(--gray)',fontWeight:700,minWidth:60}}>
                  {s.open ? 'Aberto' : 'Fechado'}
                </span>
              </div>

              {s.open && (
                <div className="sched-intervals" style={{display:'flex',flexDirection:'column',gap:8,flex:1,minWidth:0}}>
                  {intervals.map((iv, idx) => {
                    const invalid = iv.open && iv.close && iv.close <= iv.open;
                    return (
                      <div key={idx} style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                        <label style={{fontSize:12,color:'var(--gray)',fontWeight:700}}>Abre</label>
                        <input
                          type="time" className="form-input" style={{width:120,padding:'8px 10px'}}
                          value={iv.open}
                          onChange={e => changeInterval(s, idx, 'open', e.target.value)}
                        />
                        <label style={{fontSize:12,color:'var(--gray)',fontWeight:700}}>Fecha</label>
                        <input
                          type="time" className="form-input" style={{width:120,padding:'8px 10px'}}
                          value={iv.close}
                          onChange={e => changeInterval(s, idx, 'close', e.target.value)}
                        />
                        {intervals.length > 1 && (
                          <button
                            className="btn btn-danger"
                            style={{padding:'6px 12px',fontSize:13}}
                            onClick={() => removeInterval(s, idx)}
                            title="Remover intervalo"
                          >×</button>
                        )}
                        {invalid && (
                          <span style={{fontSize:12,color:'var(--danger)',fontWeight:700}}>
                            Fecha deve ser depois de abre
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div>
                    <button
                      className="btn btn-secondary"
                      style={{padding:'6px 12px',fontSize:13}}
                      onClick={() => addInterval(s)}
                    >+ Adicionar intervalo</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
