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
    <div
      className={`
        relative w-full
        bg-surface
        backdrop-blur-xl
        rounded-3xl
        border border-border
        shadow-xl
        transition-all duration-300
        ${className}
      `}
    >
      {hasAction && (
        <>
          {/* NOTCH SUPERIOR DERECHO */}
          <div
            className="
              absolute
              top-[-1px]
              right-[-1px]
              z-30
              flex
              items-start
              justify-end
              bg-base
              rounded-bl-[28px]
              pl-5
              pb-5
              pr-4
              pt-4
            "
          >
            {/* Curva superior izquierda de la muesca */}
            <div className="absolute top-0 left-[-20px] w-5 h-5 pointer-events-none overflow-hidden" aria-hidden="true">
              <div className="absolute inset-0 bg-base" style={{ clipPath: 'path("M20 0 A20 20 0 0 0 0 20 L20 20 Z")' }} />
            </div>

            {/* Curva inferior derecha de la muesca */}
            <div className="absolute bottom-[-20px] right-0 w-5 h-5 pointer-events-none overflow-hidden" aria-hidden="true">
              <div className="absolute inset-0 bg-base" style={{ clipPath: 'path("M0 0 L0 20 A20 20 0 0 0 20 0 Z")' }} />
            </div>

            {/* Acción / botón */}
            <div className="relative z-10 flex items-start justify-end w-fit">
              {action ? (
                action
              ) : (
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
          </div>
        </>
      )}

      {/* CUERPO DE LA TARJETA */}
      <div className="relative z-20 flex flex-col h-full pt-6">
        <div className="px-6 pb-4">
          <h2 className="font-sans font-bold text-lg text-text-main flex items-center gap-2">
            {title}
          </h2>
        </div>

        <div className="w-full overflow-hidden flex-1 px-6">
          {children}
        </div>

        {(totalAmount || totalLabel) && (
          <div className="px-6 pb-6 pt-6 mt-4 flex justify-between items-end border-t border-border">
            <div className="flex flex-col justify-end">
              {totalLabel && (
                <span className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">
                  {totalLabel}
                </span>
              )}
            </div>
            {totalAmount && (
              <div className="flex flex-col justify-end">
                <span className="text-xl md:text-2xl font-bold text-brand-emerald font-sans tracking-tight tabular-nums">
                  {totalAmount}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
