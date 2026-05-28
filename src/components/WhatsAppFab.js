import React from 'react';
import { useLocation } from 'react-router-dom';
import './WhatsAppFab.css';

const WHATSAPP_NUMBER = process.env.REACT_APP_WHATSAPP_NUMBER || '553838411604';
const MESSAGE = 'Olá! Vim pelo cardápio online da Bakaninha.';

export default function WhatsAppFab() {
  const location = useLocation();

  // Não mostra no checkout (já tem botão de enviar) nem nas rotas admin
  const hidden =
    location.pathname === '/checkout' ||
    location.pathname.startsWith('/painel') ||
    location.pathname.startsWith('/adm');

  if (hidden) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      className="wa-fab"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      title="Falar no WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="30" height="30" fill="currentColor" aria-hidden="true">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.13 6.74 3.05 9.38L1.05 31.4l6.21-1.98A15.9 15.9 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.32 22.6c-.387 1.092-1.922 1.998-3.146 2.262-.838.178-1.932.32-5.616-1.206-4.71-1.95-7.744-6.736-7.98-7.046-.226-.31-1.904-2.536-1.904-4.838 0-2.302 1.17-3.434 1.642-3.904.387-.387.998-.564 1.586-.564.19 0 .362.01.516.018.45.02.676.046.972.752.368.886 1.262 3.188 1.37 3.42.11.232.22.546.04.856-.168.32-.316.46-.55.74-.234.28-.456.494-.69.796-.214.27-.456.56-.196 1.01.26.44 1.156 1.906 2.48 3.086 1.71 1.524 3.118 2 3.624 2.21.378.156.83.12 1.108-.18.352-.386.788-1.026 1.232-1.658.314-.452.71-.508 1.126-.352.424.146 2.704 1.276 3.168 1.508.464.232.772.346.886.54.112.192.112 1.11-.276 2.202Z"/>
      </svg>
    </a>
  );
}
