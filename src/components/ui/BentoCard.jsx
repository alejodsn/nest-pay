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
    <div className={`relative bg-surface border border-border/60 backdrop-blur-2xl rounded-3xl p-6 shadow-xl transition-all duration-300 overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent ${className}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-space font-bold text-lg text-text-main flex items-center gap-2">
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

      {/* Content */}
      <div className="w-full overflow-hidden">
        {children}
      </div>

      {/* Footer */}
      {footerSlot && (
        <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-text-main">
            {footerSlot}
          </div>
        </div>
      )}
    </div>
  );
}
