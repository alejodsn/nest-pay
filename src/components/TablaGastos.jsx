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

  useEffect(() => {
    if (mesId) {
      getWorkingDaysForMonth(mesId).then(days => setWorkingDays(days));
    }
  }, [mesId]);

  // Cálculo de TODOS los ingresos (para el Disponible)
  const totalIngresos = useMemo(() => {
    const ingresos = datos?.ingresos || [];
    return ingresos.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  }, [datos?.ingresos]);

  // Cálculo solo de Ingresos Fijos (para la matemática de los Inmutables de Ley)
  const totalIngresosFijos = useMemo(() => {
    const ingresos = datos?.ingresos || [];
    return ingresos.filter(i => i.fijo).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  }, [datos?.ingresos]);

  // 1. Cálculos de Inmutables
  const inmutables = useMemo(() => {
    const tarifaTransporte = isAlejandro ? (configuracion?.tarifa_integrado || 4715) * 2 : (configuracion?.tarifa_metro || 3820) * 2;

    return [
      { id: 'diezmo', nombre: 'Diezmo (10%)', valorQ1: (totalIngresosFijos * 0.1) / 2, valorQ2: (totalIngresosFijos * 0.1) / 2, inmutable: true },
      { id: 'salud', nombre: 'Salud (4%)', valorQ1: (totalIngresosFijos * 0.04) / 2, valorQ2: (totalIngresosFijos * 0.04) / 2, inmutable: true },
      { id: 'pension', nombre: 'Pensión (4%)', valorQ1: (totalIngresosFijos * 0.04) / 2, valorQ2: (totalIngresosFijos * 0.04) / 2, inmutable: true },
      { id: 'transporte', nombre: 'Transporte (L-V)', valorQ1: workingDays.q1Days * tarifaTransporte, valorQ2: workingDays.q2Days * tarifaTransporte, inmutable: true }
    ];
  }, [totalIngresosFijos, workingDays, isAlejandro, configuracion]);

  const estadosInmutables = datos?.estado_pagos_inmutables || {
    diezmo: { q1: false, q2: false },
    salud: { q1: false, q2: false },
    pension: { q1: false, q2: false },
    transporte: { q1: false, q2: false }
  };

  const gastosFijos = datos?.gastos_fijos || [];
  const gastosVariables = datos?.gastos_variables || [];
  const reserva = datos?.reserva || { valor: 0, q1_pagado: false, q2_pagado: false };

  const handleToggleInmutable = async (id, quincena, currentState) => {
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? `alejandro.estado_pagos_inmutables.${id}.${quincena}` : `esposa.estado_pagos_inmutables.${id}.${quincena}`;
    try {
      await updateDoc(docRef, { [updateField]: !currentState });
    } catch (error) {
      console.error("Error updating inmutable state", error);
    }
  };

  const handleToggleFijo = async (gasto, quincena, currentState) => {
    const arrayActual = [...gastosFijos];
    const index = arrayActual.findIndex(g => g.id === gasto.id);
    if (index === -1) return;

    arrayActual[index] = { ...arrayActual[index], [quincena === 'q1' ? 'q1_pagado' : 'q2_pagado']: !currentState };
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.gastos_fijos' : 'esposa.gastos_fijos';
    try {
      await updateDoc(docRef, { [updateField]: arrayActual });
    } catch (error) {
      console.error("Error updating fijo state", error);
    }
  };

  const handleToggleVariable = async (gasto, quincena, currentState) => {
    const arrayActual = [...gastosVariables];
    const index = arrayActual.findIndex(g => g.id === gasto.id);
    if (index === -1) return;

    arrayActual[index] = { ...arrayActual[index], [quincena === 'q1' ? 'q1_pagado' : 'q2_pagado']: !currentState };
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.gastos_variables' : 'esposa.gastos_variables';
    try {
      await updateDoc(docRef, { [updateField]: arrayActual });
    } catch (error) {
      console.error("Error updating variable state", error);
    }
  };

  const handleToggleReserva = async (quincena, currentState) => {
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? `alejandro.reserva.${quincena === 'q1' ? 'q1_pagado' : 'q2_pagado'}` : `esposa.reserva.${quincena === 'q1' ? 'q1_pagado' : 'q2_pagado'}`;
    try {
      await updateDoc(docRef, { [updateField]: !currentState });
    } catch (error) {
      console.error("Error updating reserva state", error);
    }
  };

  const handleAddVariable = async () => {
    if (!nuevoNombre || !nuevoValor) return;
    const newGasto = { id: `var_${Date.now()}`, nombre: nuevoNombre, valor: Number(nuevoValor), q1_pagado: false, q2_pagado: false };
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

  // Cálculo de totales y Disponible
  const totalInmutables = inmutables.reduce((sum, item) => sum + item.valorQ1 + item.valorQ2, 0);
  const totalFijos = gastosFijos.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const totalVariables = gastosVariables.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const granTotal = totalInmutables + totalFijos + totalVariables + (Number(reserva.valor) || 0);

  // Métrica visual que solicitaste
  const disponible = totalIngresos - granTotal;

  // Componente de Fila Reutilizable
  const FilaGasto = ({ item, valorCalculado, q1_pagado, q2_pagado, onToggleQ1, onToggleQ2, onDelete, isAuto, isReserva }) => (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 font-medium text-slate-700">
        {item.nombre}
        {isReserva && <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full uppercase font-bold">Reserva</span>}
      </td>
      <td className="px-6 py-4 text-right font-semibold text-slate-800">
        {formatter.format(valorCalculado || item.valor)}
      </td>
      <td className="px-6 py-4 text-center">
        <label className="inline-flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={q1_pagado} onChange={onToggleQ1} className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer" />
          <span className={`text-slate-600 transition-all ${q1_pagado ? 'line-through text-slate-400 opacity-50' : ''}`}>
            {formatter.format(item.valorQ1 || (item.valor / 2))}
          </span>
        </label>
      </td>
      <td className="px-6 py-4 text-center">
        <label className="inline-flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={q2_pagado} onChange={onToggleQ2} className="w-5 h-5 rounded border-slate-300 text-rose-500 focus:ring-rose-500 cursor-pointer" />
          <span className={`text-slate-600 transition-all ${q2_pagado ? 'line-through text-slate-400 opacity-50' : ''}`}>
            {formatter.format(item.valorQ2 || (item.valor / 2))}
          </span>
        </label>
      </td>
      <td className="px-6 py-4 text-center">
        {isAuto ? <span className="text-xs text-slate-400 italic">Auto</span> :
          onDelete ? <button onClick={onDelete} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button> : null}
      </td>
    </tr>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">Gastos ({isAlejandro ? 'Alejandro' : 'Esposa'})</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 text-sm bg-rose-500 hover:bg-rose-600 text-white py-2 px-4 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> Imprevisto Mensual
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

            {/* SECCIÓN 1: INMUTABLES */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Obligaciones de Ley</td>
            </tr>
            {inmutables.map(item => (
              <FilaGasto
                key={item.id} item={item} valorCalculado={item.valorQ1 + item.valorQ2}
                q1_pagado={estadosInmutables[item.id]?.q1 || false}
                q2_pagado={estadosInmutables[item.id]?.q2 || false}
                onToggleQ1={() => handleToggleInmutable(item.id, 'q1', estadosInmutables[item.id]?.q1 || false)}
                onToggleQ2={() => handleToggleInmutable(item.id, 'q2', estadosInmutables[item.id]?.q2 || false)}
                isAuto={true}
              />
            ))}

            {/* SECCIÓN 2: FIJOS */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Gastos Fijos</td>
            </tr>
            {gastosFijos.map(gasto => (
              <FilaGasto
                key={gasto.id} item={gasto}
                q1_pagado={gasto.q1_pagado} q2_pagado={gasto.q2_pagado}
                onToggleQ1={() => handleToggleFijo(gasto, 'q1', gasto.q1_pagado)}
                onToggleQ2={() => handleToggleFijo(gasto, 'q2', gasto.q2_pagado)}
              />
            ))}

            {/* SECCIÓN 3: VARIABLES */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Gastos Variables (Mes en curso)</td>
            </tr>
            {gastosVariables.map(gasto => (
              <FilaGasto
                key={gasto.id} item={gasto}
                q1_pagado={gasto.q1_pagado} q2_pagado={gasto.q2_pagado}
                onToggleQ1={() => handleToggleVariable(gasto, 'q1', gasto.q1_pagado)}
                onToggleQ2={() => handleToggleVariable(gasto, 'q2', gasto.q2_pagado)}
                onDelete={() => handleDeleteVariable(gasto)}
              />
            ))}

            {isAdding && (
              <tr className="bg-rose-50">
                <td className="px-6 py-4"><input type="text" placeholder="Ej. Regalo" className="w-full border-slate-300 rounded p-1 text-sm focus:ring-rose-500" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} /></td>
                <td className="px-6 py-4"><input type="number" placeholder="Valor" className="w-full border-slate-300 rounded p-1 text-sm text-right focus:ring-rose-500" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} /></td>
                <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
                <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={handleAddVariable} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setIsAdding(false)} className="p-1 text-slate-500 hover:bg-slate-200 rounded"><X className="w-4 h-4" /></button>
                </td>
              </tr>
            )}

            {!gastosVariables.length && !isAdding && (
              <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-400 italic">No hay imprevistos registrados este mes.</td></tr>
            )}

            {/* SECCIÓN 4: RESERVA */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Ahorro</td>
            </tr>
            <FilaGasto
              item={reserva}
              q1_pagado={reserva.q1_pagado} q2_pagado={reserva.q2_pagado}
              onToggleQ1={() => handleToggleReserva('q1', reserva.q1_pagado)}
              onToggleQ2={() => handleToggleReserva('q2', reserva.q2_pagado)}
              isReserva={true}
            />

          </tbody>

          {/* NUEVO DISEÑO DEL FOOTER CON EL DISPONIBLE */}
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td colSpan="5" className="px-6 py-6">
                <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-8">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Gastos</span>
                    <span className="text-xl font-bold text-rose-600">
                      {formatter.format(granTotal)}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-slate-300 hidden sm:block"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Disponible</span>
                    <span className={`text-2xl font-black ${disponible >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                      {formatter.format(disponible)}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
