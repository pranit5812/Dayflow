import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`glass-panel card-glow rounded-2xl p-6 transition-all duration-200 ${className}`}>
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-200/60 dark:border-slate-800/80">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
