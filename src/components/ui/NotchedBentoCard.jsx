import React, { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function NotchedBentoCard({
  title,
  actionLabel = "Agregar",
  onAction,
  totalAmount,
  children,
  className = ''
}) {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        window.requestAnimationFrame(() => {
          setSize({
            w: entry.contentRect.width,
            h: entry.contentRect.height
          });
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const hasAction = Boolean(onAction);
  const nw = 145; // Ancho de la hendidura (notch) para alojar la píldora
  const nh = 56;  // Alto de la hendidura
  const R = 24;   // Radio exterior principal (rounded-3xl)
  const r = 16;   // Radio cóncavo interno (esquina orgánica)

  let path = "";
  if (size.w > 0 && size.h > 0) {
    const { w, h } = size;
    
    if (hasAction && w > nw + R * 2) {
      path = `
        M 0 ${R}
        A ${R} ${R} 0 0 1 ${R} 0
        L ${w - nw - R} 0
        A ${R} ${R} 0 0 1 ${w - nw} ${R}
        L ${w - nw} ${nh - r}
        A ${r} ${r} 0 0 0 ${w - nw + r} ${nh}
        L ${w - R} ${nh}
        A ${R} ${R} 0 0 1 ${w} ${nh + R}
        L ${w} ${h - R}
        A ${R} ${R} 0 0 1 ${w - R} ${h}
        L ${R} ${h}
        A ${R} ${R} 0 0 1 0 ${h - R}
        Z
      `.replace(/\s+/g, ' ').trim();
    } else {
      path = `
        M 0 ${R}
        A ${R} ${R} 0 0 1 ${R} 0
        L ${w - R} 0
        A ${R} ${R} 0 0 1 ${w} ${R}
        L ${w} ${h - R}
        A ${R} ${R} 0 0 1 ${w - R} ${h}
        L ${R} ${h}
        A ${R} ${R} 0 0 1 0 ${h - R}
        Z
      `.replace(/\s+/g, ' ').trim();
    }
  }

  // Generamos un Data URI puro con el SVG dinámico para aplicarlo como máscara CSS
  const svgMask = path ? `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}"><path d="${path}" fill="black"/></svg>`)}")` : 'none';

  return (
    <div className="relative w-full" ref={containerRef}>
      
      {/* BOTÓN SATÉLITE FLOTANTE EN LA HENDIDURA */}
      {hasAction && (
        <div 
          className="absolute top-0 right-0 z-30 flex items-start justify-end"
          style={{ width: nw, height: nh, paddingRight: '16px', paddingTop: '12px' }}
        >
          <button 
            onClick={onAction}
            className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 shrink-0 rounded-full text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] outline-none focus:outline-none"
          >
            <Plus className="w-4 h-4" /> {actionLabel}
          </button>
        </div>
      )}

      {/* CUERPO CÓNCAVO ENMASCARADO */}
      <div 
        className={`relative bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 ${className}`}
        style={{
          WebkitMaskImage: svgMask,
          maskImage: svgMask,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          minHeight: '160px' // Espacio vital para que el ResizeObserver obtenga un canvas inicial
        }}
      >
        
        {/* TRAZO ORGÁNICO PERFECTO: Dibuja la frontera sin depender del border CSS tradicional */}
        {path && (
          <svg className="absolute inset-0 pointer-events-none z-10" width="100%" height="100%">
            <path 
              d={path} 
              fill="none" 
              stroke="rgba(255,255,255,0.12)" 
              strokeWidth="2.5" 
            />
          </svg>
        )}

        {/* MICRO-BORDE DE LUZ GLASSMORPHISM (Solo en el lomo superior principal) */}
        <div 
          className="absolute top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60 z-20"
          style={{ left: 0, right: hasAction ? nw : 0 }}
        ></div>

        {/* ESTRUCTURA INTERNA */}
        <div className="relative z-20 flex flex-col h-full">
          
          <div className="px-6 pt-6 pb-4">
            <h2 className="font-space font-bold text-lg text-white/95 flex items-center gap-2">
              {title}
            </h2>
          </div>

          <div className="w-full overflow-hidden flex-1 px-6">
            {children}
          </div>

          {totalAmount !== undefined && (
            <div className="px-6 pb-6 pt-4 border-t border-white/[0.04] mt-4">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-2 text-sm font-medium text-white/90">
                <span className="uppercase tracking-wider text-[11px] text-white/40">Total</span>
                <span className="font-space font-semibold text-white/95 tabular-nums tracking-tight">{totalAmount}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
