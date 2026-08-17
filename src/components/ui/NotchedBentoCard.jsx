import React, { useRef, useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function NotchedBentoCard({
  title,
  actionLabel = "+ Agregar",
  onAction,
  action, // Permite pasar un nodo de acción personalizado en lugar del botón por defecto
  totalAmount,
  totalLabel = "TOTAL",
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

  const hasAction = Boolean(onAction || action);
  const hasTotal = Boolean(totalAmount);
  
  // Dimensiones de las muescas (Notches) y radios
  const nwT = 145; // Ancho notch superior
  const nhT = 56;  // Alto notch superior
  const nwB = 220; // Ancho notch inferior (amplio para cifras grandes)
  const nhB = 56;  // Alto notch inferior
  const R = 24;    // Radio exterior convexo
  const r = 16;    // Radio interior cóncavo

  let path = "";
  if (size.w > 0 && size.h > 0) {
    const { w, h } = size;
    
    // Validaciones de seguridad para evitar que las muescas se solapen o rompan si el card es muy pequeño
    const canFitTop = hasAction && w > nwT + R * 2;
    const canFitBottom = hasTotal && h > (canFitTop ? nhT : 0) + nhB + R * 2 && w > nwB + R * 2;

    // Segmentos del Path
    const p0 = `M 0 ${R}`;
    const p1 = `A ${R} ${R} 0 0 1 ${R} 0`;
    
    let p2; // Borde superior y notch derecho superior
    if (canFitTop) {
      p2 = `
        L ${w - nwT - R} 0
        A ${R} ${R} 0 0 1 ${w - nwT} ${R}
        L ${w - nwT} ${nhT - r}
        A ${r} ${r} 0 0 0 ${w - nwT + r} ${nhT}
        L ${w - R} ${nhT}
        A ${R} ${R} 0 0 1 ${w} ${nhT + R}
      `.trim();
    } else {
      p2 = `
        L ${w - R} 0
        A ${R} ${R} 0 0 1 ${w} ${R}
      `.trim();
    }

    let p3; // Borde derecho y notch derecho inferior
    if (canFitBottom) {
      p3 = `
        L ${w} ${h - nhB - R}
        A ${R} ${R} 0 0 1 ${w - R} ${h - nhB}
        L ${w - nwB + r} ${h - nhB}
        A ${r} ${r} 0 0 0 ${w - nwB} ${h - nhB + r}
        L ${w - nwB} ${h - R}
        A ${R} ${R} 0 0 1 ${w - nwB - R} ${h}
      `.trim();
    } else {
      p3 = `
        L ${w} ${h - R}
        A ${R} ${R} 0 0 1 ${w - R} ${h}
      `.trim();
    }

    const p4 = `
      L ${R} ${h}
      A ${R} ${R} 0 0 1 0 ${h - R}
      Z
    `.trim();

    path = `${p0} ${p1} ${p2} ${p3} ${p4}`.replace(/\s+/g, ' ');
  }

  // Generación de la máscara vectorial
  const svgMask = path ? `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}"><path d="${path}" fill="black"/></svg>`)}")` : 'none';

  return (
    <div className="relative w-full" ref={containerRef}>
      
      {/* 1. SATÉLITE SUPERIOR: Botón de Acción */}
      {hasAction && (
        <div 
          className="absolute top-0 right-0 z-30 flex items-start justify-end"
          style={{ width: nwT, height: nhT, paddingRight: '16px', paddingTop: '12px' }}
        >
          {action ? action : (
            <button 
              onClick={onAction}
              className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 shrink-0 rounded-full text-xs font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 hover:bg-[#10B981]/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] outline-none focus:outline-none"
            >
              <Plus className="w-4 h-4" /> {actionLabel}
            </button>
          )}
        </div>
      )}

      {/* 2. SATÉLITE INFERIOR: Total Destacado */}
      {hasTotal && (
        <div 
          className="absolute bottom-0 right-0 z-30 flex items-end justify-end"
          style={{ width: nwB, height: nhB, paddingRight: '16px', paddingBottom: '12px' }}
        >
          <div className="font-space font-bold text-base md:text-lg text-emerald-400 tabular-nums px-4 py-2 bg-emerald-400/5 border border-emerald-400/10 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.05)]">
            {totalAmount}
          </div>
        </div>
      )}

      {/* 3. CUERPO PRINCIPAL (Glassmorphism + SVG Mask) */}
      <div 
        className={`relative bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 ${className}`}
        style={{
          WebkitMaskImage: svgMask,
          maskImage: svgMask,
          WebkitMaskSize: '100% 100%',
          maskSize: '100% 100%',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          minHeight: '200px' // Altura segura
        }}
      >
        
        {/* Trazo orgánico perfecto renderizado vía SVG interno */}
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

        {/* Resplandor superior sutil */}
        <div 
          className="absolute top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60 z-20"
          style={{ left: 0, right: hasAction ? nwT : 0 }}
        ></div>

        {/* CONTENIDO INTERNO */}
        <div className="relative z-20 flex flex-col h-full">
          
          {/* Cabecera */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="font-space font-bold text-lg text-white/95 flex items-center gap-2">
              {title}
            </h2>
          </div>

          {/* Wrapper de contenido libre */}
          <div className="w-full overflow-hidden flex-1 px-6">
            {children}
          </div>

          {/* Etiqueta secundaria en la base izquierda */}
          {totalLabel && (
            <div className="px-6 pb-6 pt-4 mt-2">
              <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">{totalLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
