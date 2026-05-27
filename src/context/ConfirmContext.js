import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((opts) => {
    // accept either a string or an options object
    const config = typeof opts === 'string' ? { message: opts } : (opts || {});
    return new Promise((resolve) => {
      setDialog({
        title:       config.title       ?? 'Tem certeza?',
        message:     config.message     ?? '',
        confirmText: config.confirmText ?? 'Confirmar',
        cancelText:  config.cancelText  ?? 'Cancelar',
        danger:      config.danger      ?? false,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback((value) => {
    setDialog(cur => {
      if (cur) cur.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose(false);
      if (e.key === 'Enter')  handleClose(true);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, handleClose]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && (
        <div className="overlay center" onClick={e => e.target === e.currentTarget && handleClose(false)}>
          <div className="modal rounded confirm-modal" role="alertdialog" aria-modal="true">
            <div className="confirm-body">
              <h2 className="confirm-title">{dialog.title}</h2>
              {dialog.message && <p className="confirm-message">{dialog.message}</p>}
            </div>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => handleClose(false)} autoFocus>
                {dialog.cancelText}
              </button>
              <button
                className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`}
                onClick={() => handleClose(true)}
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext).confirm;
