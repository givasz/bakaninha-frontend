import React from 'react';
import './Watermark.css';

export default function Watermark() {
  return (
    <a
      className="watermark"
      href="https://agilizesite.com.br"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Desenvolvido por Agilize Seu Site"
    >
      <div className="watermark__left">
        <svg className="watermark__logo" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <polygon points="12,2 22,20 2,20" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>
          <line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
        <span className="watermark__text">
          <span className="watermark__dev">desenvolvido por</span>
          <span className="watermark__brand">Agilize <em>Seu Site</em></span>
        </span>
      </div>
      <div className="watermark__right">
        <span className="watermark__cta">quer um site assim?</span>
        <span className="watermark__url">agilizesite.com.br →</span>
      </div>
    </a>
  );
}
