import React from 'react';
import { Plus } from 'lucide-react';

export default function NotchedBentoCard({
  title,
  actionLabel = '+ Agregar',
  onAction,
  action,
  totalAmount,
  totalLabel = 'TOTAL',
  children,
  className = '',
}) {
  const hasAction = Boolean(onAction || action);

  return (
    <div className={`relative w-full drop-shadow-xl transition-all duration-300 flex flex-col justify-between z-0 ${className}`}>
      
      {/* ================= BACKGROUND ASSEMBLY ================= */}
      <div className="absolute inset-0 z-0 flex pointer-events-none">
        
        {/* Left Pillar (Full Height) */}
        <div className="flex-1 h-full bg-surface backdrop-blur-xl border-t border-l border-b border-border rounded-l-3xl"></div>
        
        {/* Right Pillar (Notch space + Solid bottom) */}
        <div className="w-[164px] h-full relative">
          {/* Solid Bottom Area */}
          <div className="absolute top-[100px] right-0 bottom-0 w-full bg-surface backdrop-blur-xl border-r border-b border-border rounded-br-3xl"></div>
        </div>

      </div>

      {/* ================= NOTCH EXACT GEOMETRY ================= */}
      {/* Background & Blur for the Notch curves */}
      <div 
        className="absolute top-0 right-0 w-[164px] h-[100px] bg-surface pointer-events-none z-0"
        style={{ 
          clipPath: 'path("M 0 100 L 0 0 A 24 24 0 0 1 24 24 L 24 52 A 24 24 0 0 0 48 76 L 140 76 A 24 24 0 0 1 164 100 Z")',
          backdropFilter: 'blur(24px)', 
          WebkitBackdropFilter: 'blur(24px)'
        }}
      ></div>
      
      {/* Crisp Continuous Border for the Notch */}
      <svg width="164" height="100" className="absolute top-0 right-0 pointer-events-none z-0 overflow-visible">
        <path 
          d="M 0 0 A 24 24 0 0 1 24 24 L 24 52 A 24 24 0 0 0 48 76 L 140 76 A 24 24 0 0 1 164 100" 
          fill="none" 
          stroke="var(--color-border)" 
          strokeWidth="1" 
        />
      </svg>

      {/* ================= ACTION BUTTON ================= */}
      {hasAction && (
        <div className="absolute top-0 right-0 w-[140px] h-[76px] flex items-center justify-center z-20">
          {action ? action : (
            <button
              type="button"
              onClick={onAction}
              className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 shrink-0 rounded-full text-xs font-bold bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30 hover:bg-brand-emerald/25 transition-all shadow-sm outline-none focus:outline-none"
            >
              <Plus className="w-4 h-4" />
              {actionLabel}
            </button>
          )}
        </div>
      )}

      {/* ================= CONTENT ================= */}
      <div className="relative z-10 p-6 flex flex-col justify-between h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-5 min-h-[32px]">
          <h2 className={`font-sans font-bold text-lg text-text-main flex items-center gap-2 ${hasAction ? 'pr-[116px]' : ''}`}>
            {title}
          </h2>
        </div>

        {/* Body */}
        <div className="w-full flex-1 relative z-10">
          {children}
        </div>

        {/* Footer */}
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
    </div>
  );
}
