import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Check, X, Info, Edit2 } from 'lucide-react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getWorkingDaysForMonth } from '../utils/dateUtils';

export default function TablaGastos({ mesId, perfil, datos, isAlejandro, configuracion }) {
  const [isAdding, setIsAdding] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');
  const [nuevoMensual, setNuevoMensual] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingTipo, setEditingTipo] = useState(''); 
  const [editNombre, setEditNombre] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editMensual, setEditMensual] = useState(false);

  const [workingDays, setWorkingDays] = useState({ q1Days: 0, q2Days: 0 });
  
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteTargetArray, setDeleteTargetArray] = useState('');

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

  const totalIngresos = useMemo(() => {
    const ingresos = datos?.ingresos || [];
    return ingresos.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  }, [datos?.ingresos]);

  const totalIngresosFijos = useMemo(() => {
    const ingresos = datos?.ingresos || [];
    return ingresos.filter(i => i.fijo).reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  }, [datos?.ingresos]);

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

  const handleToggleGasto = async (gasto, tipoArray, quincena, currentState) => {
    const arrayActual = tipoArray === 'gastos_fijos' ? [...gastosFijos] : [...gastosVariables];
    const index = arrayActual.findIndex(g => g.id === gasto.id);
    if (index === -1) return;

    arrayActual[index] = { ...arrayActual[index], [quincena === 'q1' ? 'q1_pagado' : 'q2_pagado']: !currentState };
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? `alejandro.${tipoArray}` : `esposa.${tipoArray}`;
    try {
      await updateDoc(docRef, { [updateField]: arrayActual });
    } catch (error) {
      console.error("Error updating gasto state", error);
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
    
    const arrayActual = [...gastosVariables, newGasto];
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.gastos_variables' : 'esposa.gastos_variables';
    
    try {
      await updateDoc(docRef, { [updateField]: arrayActual });
      
      if (nuevoMensual) {
        const plantillaRef = doc(db, 'plantillas', 'plantilla_base');
        await updateDoc(plantillaRef, { [updateField]: arrayActual });
      }

      setIsAdding(false);
      setNuevoNombre('');
      setNuevoValor('');
      setNuevoMensual(false);
    } catch (error) {
      console.error("Error adding variable gasto", error);
    }
  };

  const handleDeleteClick = (gasto, tipoArray) => {
    setItemToDelete(gasto);
    setDeleteTargetArray(tipoArray);
  };

  const confirmDelete = async (mode) => {
    if (!itemToDelete || !deleteTargetArray) return;
  
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? `alejandro.${deleteTargetArray}` : `esposa.${deleteTargetArray}`;
    
    try {
      // Eliminar de mes actual
      await updateDoc(docRef, {
        [updateField]: arrayRemove(itemToDelete)
      });
  
      // Eliminar de plantilla si corresponde
      if (mode === 'futuros') {
        const plantillaRef = doc(db, 'plantillas', 'plantilla_base');
        await updateDoc(plantillaRef, {
          [updateField]: arrayRemove(itemToDelete)
        });
      }
    } catch (error) {
      console.error("Error deleting gasto", error);
    } finally {
      setItemToDelete(null);
      setDeleteTargetArray('');
    }
  };

  const handleStartEdit = (gasto, tipoArray) => {
    setEditingId(gasto.id);
    setEditingTipo(tipoArray);
    setEditNombre(gasto.nombre);
    setEditValor(gasto.valor);
    setEditMensual(tipoArray === 'gastos_fijos'); 
  };

  const handleSaveEdit = async () => {
    if (!editNombre || !editValor) return;

    const arrayActual = editingTipo === 'gastos_fijos' ? [...gastosFijos] : [...gastosVariables];
    const index = arrayActual.findIndex(g => g.id === editingId);
    if (index === -1) return;

    arrayActual[index] = { ...arrayActual[index], nombre: editNombre, valor: Number(editValor) };

    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? `alejandro.${editingTipo}` : `esposa.${editingTipo}`;

    try {
      await updateDoc(docRef, { [updateField]: arrayActual });

      if (editMensual) {
        const plantillaRef = doc(db, 'plantillas', 'plantilla_base');
        await updateDoc(plantillaRef, { [updateField]: arrayActual });
      }

      setEditingId(null);
    } catch (error) {
      console.error("Error saving edit", error);
    }
  };

  const totalInmutables = inmutables.reduce((sum, item) => sum + item.valorQ1 + item.valorQ2, 0);
  const totalFijos = gastosFijos.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const totalVariables = gastosVariables.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  const granTotal = totalInmutables + totalFijos + totalVariables + (Number(reserva.valor) || 0);
  const disponible = totalIngresos - granTotal;

  const FilaGasto = ({ item, valorCalculado, q1_pagado, q2_pagado, onToggleQ1, onToggleQ2, onDelete, onEdit, isAuto, isReserva }) => {
    if (editingId === item.id) {
      return (
        <tr className="bg-rose-50 dark:bg-rose-500/10">
          <td className="px-6 py-4">
            <input type="text" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm focus:ring-rose-500" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
          </td>
          <td className="px-6 py-4">
            <input type="number" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm text-right focus:ring-rose-500" value={editValor} onChange={(e) => setEditValor(e.target.value)} />
          </td>
          <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
          <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
          <td className="px-6 py-4">
            <div className="flex items-center justify-end gap-3">
              <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded text-rose-500 dark:bg-[#0B0F19] w-3.5 h-3.5 border-slate-300 dark:border-white/20" 
                  checked={editMensual} 
                  onChange={(e) => setEditMensual(e.target.checked)} 
                /> Fijo cada mes
              </label>
              <div className="flex gap-1">
                <button onClick={handleSaveEdit} className="p-1 text-green-600 dark:text-emerald-400 hover:bg-green-100 dark:hover:bg-emerald-500/20 rounded"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
          {item.nombre}
          {isReserva && <span className="ml-2 text-[10px] bg-brand-100 dark:bg-emerald-500/20 text-brand-700 dark:text-emerald-400 px-2 py-0.5 rounded-full uppercase font-bold border dark:border-emerald-500/50">Reserva</span>}
        </td>
        <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-white">
          {formatter.format(valorCalculado || item.valor)}
        </td>
        <td className="px-6 py-4 text-center">
          <label className="inline-flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={q1_pagado} onChange={onToggleQ1} className="w-5 h-5 rounded border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] text-rose-500 focus:ring-rose-500 cursor-pointer" />
            <span className={`text-slate-600 dark:text-slate-400 transition-all ${q1_pagado ? 'line-through text-slate-400 dark:text-slate-500 opacity-50' : ''}`}>
              {formatter.format(item.valorQ1 || (item.valor / 2))}
            </span>
          </label>
        </td>
        <td className="px-6 py-4 text-center">
          <label className="inline-flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={q2_pagado} onChange={onToggleQ2} className="w-5 h-5 rounded border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] text-rose-500 focus:ring-rose-500 cursor-pointer" />
            <span className={`text-slate-600 dark:text-slate-400 transition-all ${q2_pagado ? 'line-through text-slate-400 dark:text-slate-500 opacity-50' : ''}`}>
              {formatter.format(item.valorQ2 || (item.valor / 2))}
            </span>
          </label>
        </td>
        <td className="px-6 py-4">
          {isAuto || isReserva ? <span className="text-xs text-slate-400 italic block text-right">Auto</span> : (
            <div className="flex items-center justify-end gap-2">
              {onEdit && <button onClick={onEdit} className="p-1 text-slate-400 hover:text-brand-500 dark:hover:text-emerald-400 transition-colors"><Edit2 className="w-4 h-4" /></button>}
              {onDelete && <button onClick={onDelete} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className="bg-white dark:bg-transparent rounded-xl shadow-sm border border-slate-200 dark:border-transparent overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Gastos ({isAlejandro ? 'Alejandro' : 'Esposa'})</h2>
          <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 text-sm bg-rose-500 dark:bg-rose-500/20 hover:bg-rose-600 dark:hover:bg-rose-500/30 text-white dark:text-rose-400 dark:border dark:border-rose-500/50 py-2 px-4 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> Imprevisto Mensual
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Ítem</th>
                <th className="px-6 py-3 font-semibold text-right">Total Mes</th>
                <th className="px-6 py-3 font-semibold text-center">Quincena 1</th>
                <th className="px-6 py-3 font-semibold text-center">Quincena 2</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">

              {/* SECCIÓN 1: INMUTABLES */}
              <tr className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10">
                <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Obligaciones de Ley</td>
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
              <tr className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10">
                <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Gastos Fijos</td>
              </tr>
              {gastosFijos.map(gasto => (
                <FilaGasto
                  key={gasto.id} item={gasto}
                  q1_pagado={gasto.q1_pagado} q2_pagado={gasto.q2_pagado}
                  onToggleQ1={() => handleToggleGasto(gasto, 'gastos_fijos', 'q1', gasto.q1_pagado)}
                  onToggleQ2={() => handleToggleGasto(gasto, 'gastos_fijos', 'q2', gasto.q2_pagado)}
                  onEdit={() => handleStartEdit(gasto, 'gastos_fijos')}
                  onDelete={() => handleDeleteClick(gasto, 'gastos_fijos')}
                />
              ))}

              {/* SECCIÓN 3: VARIABLES */}
              <tr className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10">
                <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Gastos Variables (Mes en curso)</td>
              </tr>
              {gastosVariables.map(gasto => (
                <FilaGasto
                  key={gasto.id} item={gasto}
                  q1_pagado={gasto.q1_pagado} q2_pagado={gasto.q2_pagado}
                  onToggleQ1={() => handleToggleGasto(gasto, 'gastos_variables', 'q1', gasto.q1_pagado)}
                  onToggleQ2={() => handleToggleGasto(gasto, 'gastos_variables', 'q2', gasto.q2_pagado)}
                  onEdit={() => handleStartEdit(gasto, 'gastos_variables')}
                  onDelete={() => handleDeleteClick(gasto, 'gastos_variables')}
                />
              ))}

              {isAdding && (
                <tr className="bg-rose-50 dark:bg-rose-500/10">
                  <td className="px-6 py-4"><input type="text" placeholder="Ej. Regalo" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm focus:ring-rose-500" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} /></td>
                  <td className="px-6 py-4">
                    <input type="number" placeholder="Valor" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm text-right focus:ring-rose-500" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} />
                  </td>
                  <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
                  <td className="px-6 py-4 text-center text-slate-400 text-xs">Calc...</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-rose-500 dark:bg-[#0B0F19] w-3.5 h-3.5 border-slate-300 dark:border-white/20" 
                          checked={nuevoMensual} 
                          onChange={(e) => setNuevoMensual(e.target.checked)} 
                        /> Fijo cada mes
                      </label>
                      <div className="flex gap-1">
                        <button onClick={handleAddVariable} className="p-1 text-green-600 dark:text-emerald-400 hover:bg-green-100 dark:hover:bg-emerald-500/20 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsAdding(false)} className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {!gastosVariables.length && !isAdding && (
                <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-400 italic">No hay imprevistos registrados este mes.</td></tr>
              )}

              {/* SECCIÓN 4: RESERVA */}
              <tr className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10">
                <td colSpan="5" className="px-6 py-2 text-xs font-bold text-slate-400 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2"><Info className="w-4 h-4" /> Ahorro</td>
              </tr>
              <FilaGasto
                item={reserva}
                q1_pagado={reserva.q1_pagado} q2_pagado={reserva.q2_pagado}
                onToggleQ1={() => handleToggleReserva('q1', reserva.q1_pagado)}
                onToggleQ2={() => handleToggleReserva('q2', reserva.q2_pagado)}
                isReserva={true}
              />

            </tbody>

            {/* FOOTER DISPONIBLE */}
            <tfoot className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10">
              <tr>
                <td colSpan="5" className="px-6 py-6">
                  <div className="flex flex-col sm:flex-row justify-end items-end sm:items-center gap-8">
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Total Gastos</span>
                      <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                        {formatter.format(granTotal)}
                      </span>
                    </div>
                    <div className="h-10 w-px bg-slate-300 dark:bg-white/10 hidden sm:block"></div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">Disponible</span>
                      <span className={`text-2xl font-black ${disponible >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
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

      {/* Modal de Eliminación Inteligente */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-slate-900/80 backdrop-blur-sm dark:backdrop-blur-md p-4">
          <div className="bg-white dark:bg-[#0B0F19]/90 dark:backdrop-blur-2xl dark:border dark:border-white/10 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Eliminar Gasto</h3>
              <p className="text-slate-600 dark:text-slate-300">
                ¿Cómo deseas eliminar <strong>{itemToDelete.nombre}</strong> por <strong>{formatter.format(itemToDelete.valor)}</strong>?
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 px-6 py-4 flex flex-col gap-3">
              <button 
                onClick={() => confirmDelete('solo_mes')}
                className="w-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Solo este mes
              </button>
              <button 
                onClick={() => confirmDelete('futuros')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                Este mes y futuros
              </button>
              <button 
                onClick={() => {
                  setItemToDelete(null);
                  setDeleteTargetArray('');
                }}
                className="w-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white font-medium py-2 transition-colors mt-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
