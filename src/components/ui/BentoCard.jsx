import React from 'react';

export default function BentoCard({ 
  title, 
  badge, 
  actionSlot, 
  totalAmount,
  totalLabel,
  children, 
  className = '' 
}) {
  return (
    <div className={`relative w-full bg-surface border border-border rounded-3xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between z-0 ${className}`}>
      
      {/* CAPA DE CRISTAL AISLADA: Mata el resplandor fantasma de Chrome aislando el backdrop-blur */}
      <div className="absolute inset-0 -z-10 backdrop-blur-xl rounded-3xl overflow-hidden pointer-events-none"></div>

      {/* Cabecera */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="font-sans font-bold text-lg text-text-main tracking-tight flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border uppercase tracking-wider font-semibold">
              {badge}
            </span>
          )}
        </h2>
        
        {actionSlot && (
          <div>
            {actionSlot}
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div className="w-full flex-1 relative z-10">
        {children}
      </div>

      {/* Pie / Footer */}
      {(totalAmount || totalLabel) && (
        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between relative z-10">
          <div className="text-xs uppercase tracking-wider text-text-muted font-semibold">
            {totalLabel}
          </div>
          <div className="text-xl font-bold text-brand-emerald font-sans tabular-nums">
            {totalAmount}
          </div>
        </div>
      )}
    </div>
  );
}
