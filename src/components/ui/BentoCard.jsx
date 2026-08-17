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
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold font-space text-text-main flex items-center gap-2">
            {title}
            {badge && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-hover text-text-muted border border-border uppercase tracking-wider font-semibold">
                {badge}
              </span>
            )}
          </h2>
        </div>
        {actionSlot && (
          <div>
            {actionSlot}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Footer */}
      {footerSlot && (
        <div className="mt-6 pt-4 border-t border-border">
          {footerSlot}
        </div>
      )}
    </div>
  );
}
