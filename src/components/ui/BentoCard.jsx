import React from 'react';

export default function BentoCard({ 
  title, 
  badge, 
  actionSlot, 
  footerSlot, 
  children, 
  className = '' 
}) {
  return (
    <div className={`relative border border-white/[0.07] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent ${className}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-space font-bold text-lg text-white/95 flex items-center gap-2">
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

      {/* Content */}
      <div className="w-full overflow-hidden">
        {children}
      </div>

      {/* Footer */}
      {footerSlot && (
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2 text-sm font-medium text-white/90">
            {footerSlot}
          </div>
        </div>
      )}
    </div>
  );
}
