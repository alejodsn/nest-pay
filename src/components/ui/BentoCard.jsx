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
    <div className={`bg-surface border border-border backdrop-blur-2xl rounded-3xl p-6 shadow-2xl transition-all duration-300 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="text-xl font-bold font-space text-text-main flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border uppercase tracking-wider font-semibold">
              {badge}
            </span>
          )}
        </h2>
        {actionSlot && (
          <div className="flex justify-end">
            {actionSlot}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative z-0">
        {children}
      </div>

      {/* Footer */}
      {footerSlot && (
        <div className="mt-6 flex justify-start relative z-10">
          <div className="rounded-2xl bg-white/5 border border-border/40 px-4 py-2 text-sm font-semibold flex items-center justify-between w-full md:w-auto gap-8 shadow-sm backdrop-blur-sm">
            {footerSlot}
          </div>
        </div>
      )}
    </div>
  );
}
