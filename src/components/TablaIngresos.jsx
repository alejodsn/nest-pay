import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import BentoCard from './ui/BentoCard';

export default function TablaIngresos({ mesId, perfil, datos, isAlejandro }) {
  const [isAdding, setIsAdding] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');
  const [nuevoFijoCadaMes, setNuevoFijoCadaMes] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editFijoCadaMes, setEditFijoCadaMes] = useState(true);

  const [itemToDelete, setItemToDelete] = useState(null);

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  const handleAdd = async () => {
    if (!nuevoNombre || !nuevoValor) return;
    
    const newIngreso = {
      id: `i_${Date.now()}`,
      nombre: nuevoNombre,
      valor: Number(nuevoValor),
      fijo: nuevoFijoCadaMes
    };

    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.ingresos' : 'esposa.ingresos';
    
    try {
      const ingresosActuales = [...(datos || []), newIngreso];
      await updateDoc(docRef, { [updateField]: ingresosActuales });

      if (nuevoFijoCadaMes) {
        const plantillaRef = doc(db, 'plantillas', 'plantilla_base');
        await updateDoc(plantillaRef, { [updateField]: ingresosActuales });
      }

      setIsAdding(false);
      setNuevoNombre('');
      setNuevoValor('');
      setNuevoFijoCadaMes(true);
    } catch (error) {
      console.error("Error adding ingreso", error);
    }
  };

  const handleStartEdit = (ingreso) => {
    setEditingId(ingreso.id);
    setEditNombre(ingreso.nombre);
    setEditValor(ingreso.valor);
    setEditFijoCadaMes(ingreso.fijo);
  };

  const handleSaveEdit = async () => {
    if (!editNombre || !editValor) return;

    const ingresosActuales = [...(datos || [])];
    const index = ingresosActuales.findIndex(i => i.id === editingId);
    if (index === -1) return;

    ingresosActuales[index] = {
      ...ingresosActuales[index],
      nombre: editNombre,
      valor: Number(editValor),
      fijo: editFijoCadaMes
    };

    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.ingresos' : 'esposa.ingresos';
    
    try {
      await updateDoc(docRef, { [updateField]: ingresosActuales });

      if (editFijoCadaMes) {
        const plantillaRef = doc(db, 'plantillas', 'plantilla_base');
        await updateDoc(plantillaRef, { [updateField]: ingresosActuales });
      }

      setEditingId(null);
    } catch (error) {
      console.error("Error editing ingreso", error);
    }
  };

  const confirmDelete = async (mode) => {
    if (!itemToDelete) return;
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.ingresos' : 'esposa.ingresos';
    
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
      console.error("Error deleting ingreso", error);
    } finally {
      setItemToDelete(null);
    }
  };

  const totalCalculado = datos?.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) || 0;

  return (
    <>
      <BentoCard 
        title="Ingresos"
        actionSlot={
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25 shadow-sm transition-all outline-none focus:outline-none focus:ring-0"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        }
        footerSlot={
          <>
            <span className="uppercase tracking-wider text-[11px] text-white/40">Total Ingresos</span>
            <span className="font-space font-semibold text-white/95 tabular-nums">{formatter.format(totalCalculado)}</span>
          </>
        }
      >
        <div className="w-full overflow-hidden -mx-2 px-2 pb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/40 font-medium text-[11px] tracking-wider pb-2">
                <th className="px-2 py-3 font-medium">Ítem</th>
                <th className="px-2 py-3 font-medium text-right">Total Mes</th>
                <th className="px-2 py-3 font-medium text-right">Quincena 1 (50%)</th>
                <th className="px-2 py-3 font-medium text-right">Quincena 2 (50%)</th>
                <th className="px-2 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {datos?.map((ingreso) => {
                if (editingId === ingreso.id) {
                  return (
                    <tr key={ingreso.id} className="bg-white/[0.02] border-b border-white/[0.04]">
                      <td className="px-2 py-3">
                        <input type="text" className="w-full border border-white/[0.06] bg-transparent text-white/90 rounded p-1 text-sm outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                      </td>
                      <td className="px-2 py-3">
                        <input type="number" className="w-full border border-white/[0.06] bg-transparent text-white/95 rounded p-1 text-sm text-right font-space font-semibold tabular-nums outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={editValor} onChange={(e) => setEditValor(e.target.value)} />
                      </td>
                      <td className="px-2 py-3 text-right text-white/40 text-xs">Calc...</td>
                      <td className="px-2 py-3 text-right text-white/40 text-xs">Calc...</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <label className="flex items-center gap-1 text-[11px] font-medium text-white/60 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="accent-[#10B981] w-4 h-4 outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 border border-white/20 bg-white/5 rounded transition-all cursor-pointer" 
                              checked={editFijoCadaMes} 
                              onChange={(e) => setEditFijoCadaMes(e.target.checked)} 
                            /> Fijo
                          </label>
                          <div className="flex gap-1">
                            <button onClick={handleSaveEdit} className="p-1 text-[#10B981] hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-white/40 hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={ingreso.id} className="hover:bg-white/[0.02] transition-colors duration-150 border-b border-white/[0.04]">
                    <td className="px-2 py-3 text-white/90 font-sans text-sm">{ingreso.nombre}</td>
                    <td className="px-2 py-3 text-right font-space font-semibold text-white/95 tabular-nums">
                      {formatter.format(ingreso.valor)}
                    </td>
                    <td className="px-2 py-3 text-right font-space font-semibold text-white/60 tabular-nums">
                      {formatter.format(ingreso.valor / 2)}
                    </td>
                    <td className="px-2 py-3 text-right font-space font-semibold text-white/60 tabular-nums">
                      {formatter.format(ingreso.valor / 2)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleStartEdit(ingreso)} className="text-white/40 hover:text-white/90 transition-colors p-1 rounded-lg hover:bg-white/[0.04] outline-none focus:outline-none focus:ring-0"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setItemToDelete(ingreso)} className="text-white/40 hover:text-[#F43F5E] transition-colors p-1 rounded-lg hover:bg-white/[0.04] outline-none focus:outline-none focus:ring-0"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {isAdding && (
                <tr className="bg-white/[0.02] border-b border-white/[0.04]">
                  <td className="px-2 py-3">
                    <input type="text" placeholder="Ej. Salario" className="w-full border border-white/[0.06] bg-transparent text-white/90 rounded p-1 text-sm outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                  </td>
                  <td className="px-2 py-3">
                    <input type="number" placeholder="Valor total" className="w-full border border-white/[0.06] bg-transparent text-white/95 rounded p-1 text-sm text-right font-space font-semibold tabular-nums outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 transition-all" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} />
                  </td>
                  <td className="px-2 py-3 text-right text-white/40 text-xs">Calc...</td>
                  <td className="px-2 py-3 text-right text-white/40 text-xs">Calc...</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <label className="flex items-center gap-1 text-[11px] font-medium text-white/60 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="accent-[#10B981] w-4 h-4 outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 border border-white/20 bg-white/5 rounded transition-all cursor-pointer" 
                          checked={nuevoFijoCadaMes} 
                          onChange={(e) => setNuevoFijoCadaMes(e.target.checked)} 
                        /> Fijo
                      </label>
                      <div className="flex gap-1">
                        <button onClick={handleAdd} className="p-1 text-[#10B981] hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsAdding(false)} className="p-1 text-white/40 hover:bg-white/[0.04] rounded-lg transition-colors outline-none focus:outline-none focus:ring-0"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {!datos?.length && !isAdding && (
                <tr>
                  <td colSpan="5" className="px-2 py-8 text-center text-white/40 italic border-b border-white/[0.04]">No hay ingresos registrados aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BentoCard>

      {/* Modal de Eliminación Inteligente */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4">
          <div className="bg-surface border border-white/[0.07] backdrop-blur-2xl rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white/95 mb-2">Eliminar Ingreso</h3>
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
                onClick={() => setItemToDelete(null)}
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
