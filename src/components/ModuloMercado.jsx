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
  
  // Lógica del termómetro
  const porcentajeGastado = presupuestoTotal > 0 ? (totalGastado / presupuestoTotal) * 100 : 0;
  const progresoMes = getMonthProgress(mesId); // Porcentaje del mes transcurrido

  // Determinar color de la barra: 
  // Verde si gastado <= progresoMes + 10% (margen)
  // Naranja si gastado <= progresoMes + 20%
  // Rojo si gastado > progresoMes + 20% o gastado > 100%
  let barraColor = 'bg-brand-500';
  if (porcentajeGastado > progresoMes + 20 || porcentajeGastado > 100) {
    barraColor = 'bg-rose-500';
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-brand-600" /> Mercado (Alejandro)
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 text-sm bg-brand-500 hover:bg-brand-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Registrar Ticket
        </button>
      </div>

      <div className="p-6">
        {/* Termómetro de Presupuesto */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-slate-700">Progreso del Presupuesto</span>
            <span className="font-medium text-slate-500">{porcentajeGastado.toFixed(1)}%</span>
          </div>
          <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden relative">
            <div 
              className={`h-full ${barraColor} transition-all duration-500`}
              style={{ width: `${Math.min(porcentajeGastado, 100)}%` }}
            ></div>
            {/* Indicador del día del mes actual */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-slate-800 z-10 opacity-30"
              style={{ left: `${progresoMes}%` }}
              title="Día actual del mes"
            ></div>
          </div>
          <div className="flex justify-between mt-3">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Gastado</p>
              <p className="text-lg font-bold text-slate-800">{formatter.format(totalGastado)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Restante</p>
              <p className={`text-lg font-bold ${restante < 0 ? 'text-rose-600' : 'text-brand-600'}`}>
                {formatter.format(restante)}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario para agregar */}
        {isAdding && (
          <form onSubmit={handleAddTicket} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fecha</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="date" 
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Establecimiento</label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Ej. D1, Exito"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  value={establecimiento}
                  onChange={(e) => setEstablecimiento(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Valor</label>
              <input 
                type="number" 
                required
                placeholder="0"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 text-sm text-right"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
                Guardar
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Lista de Tickets */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Historial de Compras</h3>
          <div className="space-y-3">
            {tickets.map(ticket => (
              <div key={ticket.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{ticket.establecimiento}</p>
                    <p className="text-xs text-slate-500">{ticket.fecha}</p>
                  </div>
                </div>
                <div className="font-bold text-slate-700">
                  {formatter.format(ticket.valor)}
                </div>
              </div>
            ))}
            
            {!tickets.length && (
              <p className="text-center text-slate-400 text-sm italic py-4">No hay compras registradas este mes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
