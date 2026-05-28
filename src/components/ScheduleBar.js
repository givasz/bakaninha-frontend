import React from 'react';
import './ScheduleBar.css';

export default function ScheduleBar({ scheduleStatus }) {
  if (!scheduleStatus) return null;
  const { open, message } = scheduleStatus;

  return (
    <div className={`schedule-bar ${open ? 'open' : 'closed'}`}>
      <span className={`schedule-bar-pill ${open ? 'open' : 'closed'}`}>
        <span className="schedule-bar-dot" />
        {open ? 'ABERTO' : 'FECHADO'}
      </span>
      <span className="schedule-bar-msg">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
        </svg>
        {message}
      </span>
    </div>
  );
}
