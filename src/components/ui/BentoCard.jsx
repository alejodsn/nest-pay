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
    <div className={`relative w-full bg-surface border border-white/[0.08] backdrop-blur-xl rounded-3xl p-6 shadow-2xl transition-all duration-300 flex flex-col justify-between ${className}`}>
      
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="font-sans font-bold text-lg text-white/95 tracking-tight flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.03] text-white/70 border border-white/[0.06] uppercase tracking-wider font-semibold">
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
      <div className="w-full flex-1">
        {children}
      </div>

      {/* Pie / Footer */}
      {(totalAmount || totalLabel) && (
        <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-white/40 font-semibold">
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
