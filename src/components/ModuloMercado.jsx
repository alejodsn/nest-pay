import React, { useState, useMemo } from 'react';
import { ShoppingCart, Plus, Calendar, Store } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getMonthProgress } from '../utils/dateUtils';

export default function ModuloMercado({ mesId, datos, configuracion }) {
  const [isAdding, setIsAdding] = useState(false);
  const [fecha, setFecha] = useState('');
  const [establecimiento, setEstablecimiento] = useState('');
  const [valor, setValor] = useState('');

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  const presupuestoTotal = configuracion?.presupuesto_mercado || 0;
  const tickets = datos?.mercado_tickets || [];
  
  const totalGastado = useMemo(() => {
    return tickets.reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
  }, [tickets]);

  const restante = presupuestoTotal - totalGastado;
  
  const porcentajeGastado = presupuestoTotal > 0 ? (totalGastado / presupuestoTotal) * 100 : 0;
  const progresoMes = getMonthProgress(mesId); 

  let barraColor = 'bg-[#10B981]';
  if (porcentajeGastado > progresoMes + 20 || porcentajeGastado > 100) {
    barraColor = 'bg-[#F43F5E]';
  } else if (porcentajeGastado > progresoMes + 10) {
    barraColor = 'bg-orange-500';
  }

  const handleAddTicket = async (e) => {
    e.preventDefault();
    if (!fecha || !establecimiento || !valor) return;

    const newTicket = {
      id: `m_${Date.now()}`,
      fecha,
      establecimiento,
      valor: Number(valor)
    };

    const docRef = doc(db, 'presupuestos', mesId);
    try {
      await updateDoc(docRef, {
        'alejandro.mercado_tickets': arrayUnion(newTicket)
      });
      setIsAdding(false);
      setFecha('');
      setEstablecimiento('');
      setValor('');
    } catch (error) {
      console.error("Error adding ticket", error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center gap-4 w-full mb-4">
        <div></div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="whitespace-nowrap px-3.5 py-1.5 shrink-0 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Registrar Ticket
        </button>
      </div>

      <div className="px-2">
        {/* Termómetro de Presupuesto */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-white/90 font-sans text-sm font-semibold">Progreso del Presupuesto</span>
            <span className="font-space font-semibold text-white/95 tabular-nums">{porcentajeGastado.toFixed(1)}%</span>
          </div>
          <div className="h-2.5 w-full bg-white/5 border border-white/[0.06] rounded-full overflow-hidden relative">
            <div 
              className={`h-full ${barraColor} transition-all duration-500`}
              style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
            ></div>
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
              style={{ left: `${progresoMes}%` }}
              title="Día actual del mes"
            ></div>
          </div>
          <div className="flex justify-between mt-4">
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-0.5">Gastado</p>
              <p className="text-xl font-space font-semibold text-white/95 tabular-nums">{formatter.format(totalGastado)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-0.5">Restante</p>
              <p className={`text-xl font-space font-semibold tabular-nums ${restante < 0 ? 'text-[#F43F5E]' : 'text-[#10B981]'}`}>
                {formatter.format(restante)}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario para agregar */}
        {isAdding && (
          <form onSubmit={handleAddTicket} className="bg-white/[0.02] p-5 rounded-2xl border border-white/[0.04] mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end transition-all">
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-1.5">Fecha</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                <input 
                  type="date" 
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/[0.04] bg-transparent text-white/90 focus:ring-[#10B981] focus:border-[#10B981] text-sm font-medium outline-none"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-1.5">Establecimiento</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
                <input 
                  type="text" 
                  required
                  placeholder="Ej. D1, Exito"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/[0.04] bg-transparent text-white/90 focus:ring-[#10B981] focus:border-[#10B981] text-sm font-medium outline-none"
                  value={establecimiento}
                  onChange={(e) => setEstablecimiento(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-1.5">Valor</label>
              <input 
                type="number" 
                required
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-white/[0.04] bg-transparent focus:ring-[#10B981] focus:border-[#10B981] text-right font-space font-semibold text-white/95 tabular-nums outline-none"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="flex gap-2 h-10">
              <button type="submit" className="flex-1 bg-[#10B981] text-white rounded-xl text-sm font-bold hover:bg-[#10B981]/90 transition-colors shadow-sm outline-none">
                Guardar
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 bg-white/[0.04] text-white/90 rounded-xl hover:bg-white/[0.08] transition-colors font-medium text-sm outline-none border border-white/[0.04]">
                X
              </button>
            </div>
          </form>
        )}

        {/* Lista de Tickets */}
        <div>
          <h3 className="text-[11px] font-medium text-white/40 uppercase tracking-wider mb-4 border-b border-white/[0.06] pb-2">Historial de Compras</h3>
          <div className="space-y-1">
            {tickets.map(ticket => (
              <div key={ticket.id} className="flex justify-between items-center py-3 px-2 hover:bg-white/[0.02] rounded-xl border border-transparent transition-colors duration-150">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/[0.02] border border-white/[0.04] rounded-full flex items-center justify-center text-white/40">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white/90 font-sans text-sm font-semibold">{ticket.establecimiento}</p>
                    <p className="text-xs text-white/40">{ticket.fecha}</p>
                  </div>
                </div>
                <div className="font-space font-semibold text-white/95 tabular-nums">
                  {formatter.format(ticket.valor)}
                </div>
              </div>
            ))}
            
            {!tickets.length && (
              <p className="text-center text-white/40 text-sm italic py-6">No hay compras registradas este mes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
