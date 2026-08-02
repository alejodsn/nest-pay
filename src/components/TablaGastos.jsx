import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Check, X, Info } from 'lucide-react';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getWorkingDaysForMonth } from '../utils/dateUtils';

export default function TablaGastos({ mesId, perfil, datos, isAlejandro, configuracion }) {
  const [isAdding, setIsAdding] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');
  
  const [workingDays, setWorkingDays] = useState({ q1Days: 0, q2Days: 0 });

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  // Cargar días hábiles
  useEffect(() => {
    if (mesId) {
      getWorkingDaysForMonth(mesId).then(days => setWorkingDays(days));
    }
  }, [mesId]);

  // Ingresos Fijos Totales
  const totalIngresosFijos = useMemo(() => {
    const ingresos = datos?.ingresos || [];
    return ingresos.filter(i => i.fijo).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  }, [datos?.ingresos]);

  // Cálculos de Inmutables
  const inmutables = useMemo(() => {
    const tarifaTransporte = isAlejandro ? (configuracion?.tarifa_integrado || 0) : (configuracion?.tarifa_metro || 0);
    
    return [
      { id: 'diezmo', nombre: 'Diezmo (10%)', valorQ1: (totalIngresosFijos * 0.1) / 2, valorQ2: (totalIngresosFijos * 0.1) / 2, inmutable: true },
      { id: 'salud', nombre: 'Salud (4%)', valorQ1: (totalIngresosFijos * 0.04) / 2, valorQ2: (totalIngresosFijos * 0.04) / 2, inmutable: true },
      { id: 'pension', nombre: 'Pensión (4%)', valorQ1: (totalIngresosFijos * 0.04) / 2, valorQ2: (totalIngresosFijos * 0.04) / 2, inmutable: true },
      { id: 'transporte', nombre: 'Transporte (L-V)', valorQ1: workingDays.q1Days * tarifaTransporte, valorQ2: workingDays.q2Days * tarifaTransporte, inmutable: true }
    ];
  }, [totalIngresosFijos, workingDays, isAlejandro, configuracion]);

  // Estado de pagos inmutables de Firestore o por defecto
  const estadosInmutables = datos?.estado_pagos_inmutables || {
    diezmo: { q1: false, q2: false },
    salud: { q1: false, q2: false },
    pension: { q1: false, q2: false },
    transporte: { q1: false, q2: false }
  };

  const handleToggleInmutable = async (id, quincena, currentState) => {
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro 
      ? `alejandro.estado_pagos_inmutables.${id}.${quincena}` 
      : `esposa.estado_pagos_inmutables.${id}.${quincena}`;
      
    try {
      await updateDoc(docRef, { [updateField]: !currentState });
    } catch (error) {
      console.error("Error updating inmutable state", error);
    }
  };

  const handleAddVariable = async () => {
    if (!nuevoNombre || !nuevoValor) return;
    
    const newGasto = {
      id: `var_${Date.now()}`,
      nombre: nuevoNombre,
      valor: Number(nuevoValor),
      q1_pagado: false,
      q2_pagado: false
    };

    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.gastos_variables' : 'esposa.gastos_variables';
    try {
      await updateDoc(docRef, { [updateField]: arrayUnion(newGasto) });
      setIsAdding(false);
      setNuevoNombre('');
      setNuevoValor('');
    } catch (error) {
      console.error("Error adding variable gasto", error);
    }
  };

  const handleDeleteVariable = async (gasto) => {
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.gastos_variables' : 'esposa.gastos_variables';
    try {
      await updateDoc(docRef, { [updateField]: arrayRemove(gasto) });
    } catch (error) {
      console.error("Error deleting variable gasto", error);
    }
  };

  const handleToggleVariable = async (gasto, quincena, currentState) => {
    // Para actualizar un item de un array en Firestore, típicamente se remueve el viejo y se agrega el nuevo,
    // o se actualiza todo el array. Aquí actualizaremos todo el array local y lo enviaremos.
    const gastosActuales = [...(datos?.gastos_variables || [])];
    const index = gastosActuales.findIndex(g => g.id === gasto.id);
    if (index === -1) return;

    gastosActuales[index] = {
      ...gastosActuales[index],
      [quincena === 'q1' ? 'q1_pagado' : 'q2_pagado']: !currentState
    };

    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.gastos_variables' : 'esposa.gastos_variables';
    try {
      await updateDoc(docRef, { [updateField]: gastosActuales });
    } catch (error) {
      console.error("Error updating variable state", error);
    }
  };

  const gastosVariables = datos?.gastos_variables || [];
  
  // Cálculo de totales
  const totalInmutables = inmutables.reduce((sum, item) => sum + item.valorQ1 + item.valorQ2, 0);
  const totalVariables = gastosVariables.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const granTotal = totalInmutables + totalVariables;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">Gastos ({isAlejandro ? 'Alejandro' : 'Esposa'})</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 text-sm bg-rose-500 hover:bg-rose-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Variable
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 font-semibold">Ítem</th>
              <th className="px-6 py-3 font-semibold text-right">Total Mes</th>
              <th className="px-6 py-3 font-semibold text-center">Quincena 1</th>
              <th className="px-6 py-3 font-semibold text-center">Quincena 2</th>
              <th className="px-6 py-3 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            
            {/* SECCIÓN INMUTABLES */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" /> Gastos Fijos Inmutables
              </td>
            </tr>
            {inmutables.map(item => {
              const q1Pagado = estadosInmutables[item.id]?.q1 || false;
              const q2Pagado = estadosInmutables[item.id]?.q2 || false;
              
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{item.nombre}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    {formatter.format(item.valorQ1 + item.valorQ2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={q1Pagado}
                        onChange={() => handleToggleInmutable(item.id, 'q1', q1Pagado)}
                        className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                      />
                      <span className={`text-slate-600 transition-all ${q1Pagado ? 'line-through text-slate-400 opacity-50' : ''}`}>
                        {formatter.format(item.valorQ1)}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={q2Pagado}
                        onChange={() => handleToggleInmutable(item.id, 'q2', q2Pagado)}
                        className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                      />
                      <span className={`text-slate-600 transition-all ${q2Pagado ? 'line-through text-slate-400 opacity-50' : ''}`}>
                        {formatter.format(item.valorQ2)}
                      </span>
                    </label>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-slate-400 italic">Auto</span>
                  </td>
                </tr>
              );
            })}

            {/* SECCIÓN VARIABLES */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4" /> Gastos Variables
              </td>
            </tr>
            
            {gastosVariables.map(gasto => (
              <tr key={gasto.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700">
                  {gasto.nombre}
                  {gasto.nombre.toLowerCase().includes('reserva') && (
                    <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase font-bold">
                      Reserva
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-slate-800">
                  {formatter.format(gasto.valor)}
                  {gasto.nombre.toLowerCase().includes('reserva') && datos?.reserva_acumulada > 0 && (
                    <div className="text-xs text-brand-600 mt-1">
                      + {formatter.format(datos.reserva_acumulada)} (Acum)
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={gasto.q1_pagado}
                      onChange={() => handleToggleVariable(gasto, 'q1', gasto.q1_pagado)}
                      className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className={`text-slate-600 transition-all ${gasto.q1_pagado ? 'line-through text-slate-400 opacity-50' : ''}`}>
                      {formatter.format(gasto.valor / 2)}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4 text-center">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={gasto.q2_pagado}
                      onChange={() => handleToggleVariable(gasto, 'q2', gasto.q2_pagado)}
                      className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className={`text-slate-600 transition-all ${gasto.q2_pagado ? 'line-through text-slate-400 opacity-50' : ''}`}>
                      {formatter.format(gasto.valor / 2)}
                    </span>
                  </label>
                </td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => handleDeleteVariable(gasto)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

            {isAdding && (
              <tr className="bg-rose-50">
                <td className="px-6 py-4">
                  <input 
                    type="text" 
                    placeholder="Ej. Celular"
                    className="w-full border-slate-300 rounded p-1 text-sm focus:ring-rose-500 focus:border-rose-500"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number" 
                    placeholder="Valor total"
                    className="w-full border-slate-300 rounded p-1 text-sm text-right focus:ring-rose-500 focus:border-rose-500"
                    value={nuevoValor}
                    onChange={(e) => setNuevoValor(e.target.value)}
                  />
                </td>
                <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
                <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={handleAddVariable} className="p-1 text-green-600 hover:bg-green-100 rounded">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setIsAdding(false)} className="p-1 text-slate-500 hover:bg-slate-200 rounded">
                    <X className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )}

            {!gastosVariables.length && !isAdding && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">
                  No hay gastos variables registrados.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50">
            <tr>
              <td className="px-6 py-4 text-right font-bold text-slate-700">Total Gastos:</td>
              <td className="px-6 py-4 text-right font-bold text-rose-600 text-lg">
                {formatter.format(granTotal)}
              </td>
              <td colSpan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
