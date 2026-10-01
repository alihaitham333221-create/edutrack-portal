import React from 'react';

export default function StatCard({ title, value, icon, color = '#4f46e5' }) {
  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{
          background: `${color}15`,
          color: color,
        }}
      >
        {icon}
      </div>
      <div>
        <div className="stat-val">{value}</div>
        <div className="stat-lbl">{title}</div>
      </div>
    </div>
  );
}
