import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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

  return (
    <>
      <div className="bg-white dark:bg-transparent rounded-xl shadow-sm border border-slate-200 dark:border-transparent overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Ingresos ({isAlejandro ? 'Alejandro' : 'Esposa'})</h2>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 text-sm bg-brand-500 dark:bg-emerald-500/20 hover:bg-brand-600 dark:hover:bg-emerald-500/30 text-white dark:text-emerald-400 dark:border dark:border-emerald-500/50 py-2 px-4 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-3 font-semibold">Ítem</th>
                <th className="px-6 py-3 font-semibold text-right">Total Mes</th>
                <th className="px-6 py-3 font-semibold text-right">Quincena 1 (50%)</th>
                <th className="px-6 py-3 font-semibold text-right">Quincena 2 (50%)</th>
                <th className="px-6 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-sm">
              {datos?.map((ingreso) => {
                if (editingId === ingreso.id) {
                  return (
                    <tr key={ingreso.id} className="bg-brand-50 dark:bg-emerald-500/10">
                      <td className="px-6 py-4">
                        <input type="text" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm focus:ring-brand-500 dark:focus:ring-emerald-500" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                      </td>
                      <td className="px-6 py-4">
                        <input type="number" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm text-right focus:ring-brand-500 dark:focus:ring-emerald-500" value={editValor} onChange={(e) => setEditValor(e.target.value)} />
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                      <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="rounded text-brand-500 dark:text-emerald-500 focus:ring-brand-500 dark:focus:ring-emerald-500 dark:bg-[#0B0F19] w-3.5 h-3.5 border-slate-300 dark:border-white/20" 
                              checked={editFijoCadaMes} 
                              onChange={(e) => setEditFijoCadaMes(e.target.checked)} 
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
                  <tr key={ingreso.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{ingreso.nombre}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-800 dark:text-white">
                      {formatter.format(ingreso.valor)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                      {formatter.format(ingreso.valor / 2)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                      {formatter.format(ingreso.valor / 2)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleStartEdit(ingreso)} className="p-1 text-slate-400 hover:text-brand-500 dark:hover:text-emerald-400 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setItemToDelete(ingreso)} className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {isAdding && (
                <tr className="bg-brand-50 dark:bg-emerald-500/10">
                  <td className="px-6 py-4">
                    <input type="text" placeholder="Ej. Salario" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm focus:ring-brand-500 dark:focus:ring-emerald-500" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                  </td>
                  <td className="px-6 py-4">
                    <input type="number" placeholder="Valor total" className="w-full border-slate-300 dark:border-white/20 dark:bg-[#0B0F19] dark:text-white rounded p-1 text-sm text-right focus:ring-brand-500 dark:focus:ring-emerald-500" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} />
                  </td>
                  <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                  <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <label className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-brand-500 dark:text-emerald-500 dark:bg-[#0B0F19] w-3.5 h-3.5 border-slate-300 dark:border-white/20" 
                          checked={nuevoFijoCadaMes} 
                          onChange={(e) => setNuevoFijoCadaMes(e.target.checked)} 
                        /> Fijo cada mes
                      </label>
                      <div className="flex gap-1">
                        <button onClick={handleAdd} className="p-1 text-green-600 dark:text-emerald-400 hover:bg-green-100 dark:hover:bg-emerald-500/20 rounded"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsAdding(false)} className="p-1 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              
              {!datos?.length && !isAdding && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400 italic">No hay ingresos registrados aún.</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-white/5 border-t-2 border-slate-200 dark:border-white/10">
              <tr>
                <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-white">Total Ingresos:</td>
                <td className="px-6 py-4 text-right font-bold text-brand-600 dark:text-emerald-400 text-lg">
                  {formatter.format(datos?.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) || 0)}
                </td>
                <td colSpan="3"></td>
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
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Eliminar Ingreso</h3>
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
                onClick={() => setItemToDelete(null)}
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
