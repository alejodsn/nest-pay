import React from 'react';
import { Plus } from 'lucide-react';

export default function NotchedBentoCard({
  title,
  actionLabel = "+ Agregar",
  onAction,
  action, // Permite pasar un nodo de acción personalizado
  totalAmount,
  totalLabel = "TOTAL",
  children,
  className = ''
}) {
  const hasAction = Boolean(onAction || action);

  return (
    <div className={`relative w-full bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl rounded-3xl border border-white/[0.07] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 ${className}`}>
      
      {/* 1. NOTCH DINÁMICO CSS (Esquina Superior Derecha) */}
      {/* Usamos bg-base para enmascarar la esquina y crear el hueco flotante de forma nativa */}
      {hasAction && (
        <div className="absolute top-[-1px] right-[-1px] bg-base rounded-bl-[28px] pl-5 pb-5 pr-4 pt-4 z-30">
          
          {/* Curva cóncava izquierda (Unión entre el top de la tarjeta y el notch) */}
          <div className="absolute top-0 -left-5 w-5 h-5 pointer-events-none">
            <div className="w-full h-full bg-base rounded-br-2xl"></div>
            {/* Nota: Usamos rounded-br-2xl invertido con un pseudo-truco de CSS nativo para lograr la curva cóncava perfecta */}
            <div className="absolute inset-0 bg-base" style={{ clipPath: 'path("M0,0 L20,0 L20,20 A20,20 0 0,0 0,0 Z")' }}></div>
          </div>
          
          {/* Curva cóncava inferior (Unión entre el right de la tarjeta y el notch) */}
          <div className="absolute -bottom-5 right-0 w-5 h-5 pointer-events-none">
            <div className="w-full h-full bg-base rounded-tl-2xl"></div>
            <div className="absolute inset-0 bg-base" style={{ clipPath: 'path("M20,20 L20,0 A20,20 0 0,0 0,20 Z")' }}></div>
          </div>
          
          {/* Contenedor del Botón (Fluido w-fit) */}
          <div className="relative z-10 flex items-start justify-end w-fit">
            {action ? action : (
              <button 
                onClick={onAction}
                className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 shrink-0 rounded-full text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] outline-none focus:outline-none"
              >
                <Plus className="w-4 h-4" /> {actionLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. CUERPO DE LA TARJETA */}
      <div className="relative z-20 flex flex-col h-full pt-6">
        
        {/* Cabecera */}
        <div className="px-6 pb-4">
          <h2 className="font-sans font-bold text-lg text-white/95 flex items-center gap-2">
            {title}
          </h2>
        </div>

        {/* Contenedor Interno Limpio para las Tablas */}
        <div className="w-full overflow-hidden flex-1 px-6">
          {children}
        </div>

        {/* 3. BASE INFERIOR (Total Libre sin Caja Falsa) */}
        {(totalAmount || totalLabel) && (
          <div className="px-6 pb-6 pt-6 mt-4 flex justify-between items-end border-t border-white/[0.04]">
            
            {/* Etiqueta Izquierda */}
            <div className="flex flex-col justify-end">
              {totalLabel && (
                <span className="text-xs uppercase tracking-wider text-white/40 font-semibold mb-1">
                  {totalLabel}
                </span>
              )}
            </div>
            
            {/* Cifra Tipográfica Pura Derecha */}
            <div className="flex flex-col justify-end">
              {totalAmount && (
                <span className="text-xl md:text-2xl font-bold text-emerald-400 font-sans tracking-tight tabular-nums">
                  {totalAmount}
                </span>
              )}
            </div>
            
          </div>
        )}
      </div>

    </div>
  );
}
