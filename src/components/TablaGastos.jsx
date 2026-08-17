import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Check, X, Info, Edit2 } from 'lucide-react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getWorkingDaysForMonth } from '../utils/dateUtils';
import BentoCard from './ui/BentoCard';

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
      await updateDoc(docRef, {
        [updateField]: arrayRemove(itemToDelete)
      });
  
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

  const FilaGasto = ({ item, valorCalculado, q1_pagado, q2_pagado, onToggleQ1, onToggleQ2, onDelete, onEdit, isAuto, isReserva }) => {
    if (editingId === item.id) {
      return (
        <tr className="bg-white/[0.02] border-b border-white/[0.04]">
          <td className="py-3">
            <input type="text" className="w-full border border-white/[0.06] bg-transparent text-white/90 rounded p-1 text-sm outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
          </td>
          <td className="py-3">
            <input type="number" className="w-full border border-white/[0.06] bg-transparent text-white/95 rounded p-1 text-sm text-right tabular-nums font-space font-semibold tracking-tight outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={editValor} onChange={(e) => setEditValor(e.target.value)} />
          </td>
          <td className="py-3 text-center text-white/40 text-xs">Calc...</td>
          <td className="py-3 text-center text-white/40 text-xs">Calc...</td>
          <td className="py-3">
            <div className="flex items-center justify-end gap-3">
              <label className="flex items-center gap-1 text-[11px] font-medium text-white/60 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="cursor-pointer accent-emerald-500 rounded outline-none w-4 h-4 border border-white/20 bg-white/5 transition-all" 
                  checked={editMensual} 
                  onChange={(e) => setEditMensual(e.target.checked)} 
                /> Fijo
              </label>
              <div className="flex gap-1">
                <button onClick={handleSaveEdit} className="p-1 text-[#F43F5E] hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-1 text-white/40 hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><X className="w-4 h-4" /></button>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr className="hover:bg-white/[0.02] transition-colors duration-150 border-b border-white/[0.04]">
        <td className="py-3 text-white/90 font-sans text-sm">
          {item.nombre}
          {isReserva && <span className="ml-2 text-[10px] bg-[#10B981]/10 text-[#10B981] px-2 py-0.5 rounded-full uppercase font-bold border border-transparent">Reserva</span>}
        </td>
        <td className="py-3 text-right font-space font-semibold text-white/95 tabular-nums">
          {formatter.format(valorCalculado || item.valor)}
        </td>
        <td className="py-3 text-center">
          <label className="inline-flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={q1_pagado} onChange={onToggleQ1} className="cursor-pointer accent-emerald-500 rounded outline-none w-4 h-4 border border-white/20 bg-white/5 transition-all" />
            <span className={`transition-all font-space font-semibold tabular-nums ${q1_pagado ? 'line-through opacity-50 text-[#10B981]' : 'text-white/60'}`}>
              {formatter.format(item.valorQ1 || (item.valor / 2))}
            </span>
          </label>
        </td>
        <td className="py-3 text-center">
          <label className="inline-flex items-center gap-2 cursor-pointer group">
            <input type="checkbox" checked={q2_pagado} onChange={onToggleQ2} className="cursor-pointer accent-emerald-500 rounded outline-none w-4 h-4 border border-white/20 bg-white/5 transition-all" />
            <span className={`transition-all font-space font-semibold tabular-nums ${q2_pagado ? 'line-through opacity-50 text-[#10B981]' : 'text-white/60'}`}>
              {formatter.format(item.valorQ2 || (item.valor / 2))}
            </span>
          </label>
        </td>
        <td className="py-3">
          {isAuto || isReserva ? <span className="text-xs text-white/40 italic block text-right font-medium">Auto</span> : (
            <div className="flex items-center justify-end gap-2">
              {onEdit && <button onClick={onEdit} className="text-white/40 hover:text-white/90 transition-colors p-1 rounded-lg hover:bg-white/[0.04] outline-none focus:outline-none focus:ring-0"><Edit2 className="w-4 h-4" /></button>}
              {onDelete && <button onClick={onDelete} className="text-white/40 hover:text-[#F43F5E] transition-colors p-1 rounded-lg hover:bg-white/[0.04] outline-none focus:outline-none focus:ring-0"><Trash2 className="w-4 h-4" /></button>}
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <>
      <BentoCard 
        title="Gastos Fijos & Obligaciones"
        actionSlot={
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25 transition-all shadow-sm outline-none focus:outline-none focus:ring-0"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        }
        totalLabel="TOTAL GASTOS"
        totalAmount={formatter.format(granTotal)}
      >
        <div className="w-full overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] text-white/40 font-medium text-[11px] tracking-wider pb-2">
              <th className="py-3 font-medium">Ítem</th>
              <th className="py-3 font-medium text-right">Total Mes</th>
              <th className="py-3 font-medium text-center">Quincena 1</th>
              <th className="py-3 font-medium text-center">Quincena 2</th>
              <th className="py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">

            {/* SECCIÓN 1: INMUTABLES */}
            <tr className="border-b border-white/[0.04]">
              <td colSpan="5" className="pt-6 pb-2 text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Obligaciones de Ley</td>
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
            <tr className="border-b border-white/[0.04]">
              <td colSpan="5" className="pt-6 pb-2 text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Gastos Fijos</td>
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
            <tr className="border-b border-white/[0.04]">
              <td colSpan="5" className="pt-6 pb-2 text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Gastos Variables (Mes en curso)</td>
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
              <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                <td className="py-3"><input type="text" placeholder="Ej. Regalo" className="w-full border border-white/[0.06] bg-transparent text-white/90 rounded p-1 text-sm outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} /></td>
                <td className="py-3">
                  <input type="number" placeholder="Valor" className="w-full border border-white/[0.06] bg-transparent text-white/95 rounded p-1 text-sm text-right font-space font-semibold tabular-nums outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} />
                </td>
                <td className="py-3 text-center text-white/40 text-xs">Calc...</td>
                <td className="py-3 text-center text-white/40 text-xs">Calc...</td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-3">
                    <label className="flex items-center gap-1 text-[11px] font-medium text-white/60 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="cursor-pointer accent-emerald-500 rounded outline-none w-4 h-4 border border-white/20 bg-white/5 transition-all" 
                        checked={nuevoMensual} 
                        onChange={(e) => setNuevoMensual(e.target.checked)} 
                      /> Fijo
                    </label>
                    <div className="flex gap-1">
                      <button onClick={handleAddVariable} className="p-1 text-[#F43F5E] hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setIsAdding(false)} className="p-1 text-white/40 hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!gastosVariables.length && !isAdding && (
              <tr><td colSpan="5" className="py-8 text-center text-white/40 italic border-b border-white/[0.04]">No hay imprevistos registrados este mes.</td></tr>
            )}

            {/* SECCIÓN 4: RESERVA */}
            <tr className="border-b border-white/[0.04]">
              <td colSpan="5" className="pt-6 pb-2 text-[11px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Ahorro</td>
            </tr>
            <FilaGasto
              item={reserva}
              q1_pagado={reserva.q1_pagado} q2_pagado={reserva.q2_pagado}
              onToggleQ1={() => handleToggleReserva('q1', reserva.q1_pagado)}
              onToggleQ2={() => handleToggleReserva('q2', reserva.q2_pagado)}
              isReserva={true}
            />

          </tbody>
        </table>
      </div>
      </BentoCard>

      {/* Modal de Eliminación Inteligente */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="bg-surface border border-white/[0.07] backdrop-blur-2xl rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white/95 mb-2">Eliminar Gasto</h3>
              <p className="text-white/70">
                ¿Cómo deseas eliminar <strong className="text-white/95">{itemToDelete.nombre}</strong> por <strong className="tabular-nums text-white/95">{formatter.format(itemToDelete.valor)}</strong>?
              </p>
            </div>
            <div className="bg-white/[0.02] px-6 py-4 flex flex-col gap-3 border-t border-white/[0.04]">
              <button 
                onClick={() => confirmDelete('solo_mes')}
                className="w-full bg-white/[0.06] hover:bg-white/[0.1] text-white/95 font-semibold py-2.5 rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"
              >
                Solo este mes
              </button>
              <button 
                onClick={() => confirmDelete('futuros')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"
              >
                Este mes y futuros
              </button>
              <button 
                onClick={() => {
                  setItemToDelete(null);
                  setDeleteTargetArray('');
                }}
                className="w-full text-white/40 hover:text-white/90 font-medium py-2 transition-colors mt-1 outline-none focus:outline-none focus:ring-0"
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
