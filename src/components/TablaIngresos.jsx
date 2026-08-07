import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function TablaIngresos({ mesId, perfil, datos, isAlejandro }) {
  const [isAdding, setIsAdding] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoValor, setNuevoValor] = useState('');
  const [esFijo, setEsFijo] = useState(true);
  const [nuevoMensual, setNuevoMensual] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editValor, setEditValor] = useState('');
  const [editFijo, setEditFijo] = useState(true);
  const [editMensual, setEditMensual] = useState(false);

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
      fijo: esFijo
    };

    const ingresosActuales = [...(datos || []), newIngreso];
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.ingresos' : 'esposa.ingresos';
    
    try {
      await updateDoc(docRef, { [updateField]: ingresosActuales });

      if (nuevoMensual) {
        const plantillaRef = doc(db, 'plantillas', 'plantilla_base');
        await updateDoc(plantillaRef, { [updateField]: ingresosActuales });
      }

      setIsAdding(false);
      setNuevoNombre('');
      setNuevoValor('');
      setEsFijo(true);
      setNuevoMensual(false);
    } catch (error) {
      console.error("Error adding ingreso", error);
    }
  };

  const handleStartEdit = (ingreso) => {
    setEditingId(ingreso.id);
    setEditNombre(ingreso.nombre);
    setEditValor(ingreso.valor);
    setEditFijo(ingreso.fijo);
    setEditMensual(false);
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
      fijo: editFijo
    };

    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.ingresos' : 'esposa.ingresos';
    
    try {
      await updateDoc(docRef, { [updateField]: ingresosActuales });

      if (editMensual) {
        const plantillaRef = doc(db, 'plantillas', 'plantilla_base');
        await updateDoc(plantillaRef, { [updateField]: ingresosActuales });
      }

      setEditingId(null);
    } catch (error) {
      console.error("Error editing ingreso", error);
    }
  };

  const handleDelete = async (ingreso) => {
    const docRef = doc(db, 'presupuestos', mesId);
    const updateField = isAlejandro ? 'alejandro.ingresos' : 'esposa.ingresos';
    
    try {
      const ingresosActuales = (datos || []).filter(i => i.id !== ingreso.id);
      await updateDoc(docRef, { [updateField]: ingresosActuales });
    } catch (error) {
      console.error("Error deleting ingreso", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800">Ingresos ({isAlejandro ? 'Alejandro' : 'Esposa'})</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 text-sm bg-brand-500 hover:bg-brand-600 text-white py-2 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-500 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 font-semibold">Ítem</th>
              <th className="px-6 py-3 font-semibold">Fijo/Variable</th>
              <th className="px-6 py-3 font-semibold text-right">Total Mes</th>
              <th className="px-6 py-3 font-semibold text-right">Quincena 1 (50%)</th>
              <th className="px-6 py-3 font-semibold text-right">Quincena 2 (50%)</th>
              <th className="px-6 py-3 font-semibold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {datos?.map((ingreso) => {
              if (editingId === ingreso.id) {
                return (
                  <tr key={ingreso.id} className="bg-brand-50">
                    <td className="px-6 py-4">
                      <input type="text" className="w-full border-slate-300 rounded p-1 text-sm focus:ring-brand-500" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                    </td>
                    <td className="px-6 py-4">
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input type="checkbox" className="rounded text-brand-500 focus:ring-brand-500" checked={editFijo} onChange={(e) => setEditFijo(e.target.checked)} /> Fijo
                      </label>
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" className="w-full border-slate-300 rounded p-1 text-sm text-right focus:ring-brand-500" value={editValor} onChange={(e) => setEditValor(e.target.value)} />
                      <label className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 cursor-pointer">
                        <input type="checkbox" className="rounded text-brand-500 w-3 h-3" checked={editMensual} onChange={(e) => setEditMensual(e.target.checked)} /> Mensual
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                    <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={handleSaveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-slate-500 hover:bg-slate-200 rounded"><X className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={ingreso.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">{ingreso.nombre}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className={`px-2 py-1 rounded text-xs ${ingreso.fijo ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                      {ingreso.fijo ? 'Fijo' : 'Variable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    {formatter.format(ingreso.valor)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    {formatter.format(ingreso.valor / 2)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    {formatter.format(ingreso.valor / 2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleStartEdit(ingreso)} className="p-1 text-slate-400 hover:text-brand-500 transition-colors"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(ingreso)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {isAdding && (
              <tr className="bg-brand-50">
                <td className="px-6 py-4">
                  <input type="text" placeholder="Ej. Salario" className="w-full border-slate-300 rounded p-1 text-sm focus:ring-brand-500" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} />
                </td>
                <td className="px-6 py-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-500 focus:ring-brand-500" checked={esFijo} onChange={(e) => setEsFijo(e.target.checked)} /> Fijo
                  </label>
                </td>
                <td className="px-6 py-4">
                  <input type="number" placeholder="Valor total" className="w-full border-slate-300 rounded p-1 text-sm text-right focus:ring-brand-500" value={nuevoValor} onChange={(e) => setNuevoValor(e.target.value)} />
                  <label className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 cursor-pointer">
                    <input type="checkbox" className="rounded text-brand-500 w-3 h-3" checked={nuevoMensual} onChange={(e) => setNuevoMensual(e.target.checked)} /> Mensual
                  </label>
                </td>
                <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                <td className="px-6 py-4 text-right text-slate-400 text-xs">Calc...</td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button onClick={handleAdd} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setIsAdding(false)} className="p-1 text-slate-500 hover:bg-slate-200 rounded"><X className="w-4 h-4" /></button>
                </td>
              </tr>
            )}
            
            {!datos?.length && !isAdding && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-400 italic">No hay ingresos registrados aún.</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200">
            <tr>
              <td colSpan="2" className="px-6 py-4 text-right font-bold text-slate-700">Total Ingresos:</td>
              <td className="px-6 py-4 text-right font-bold text-brand-600 text-lg">
                {formatter.format(datos?.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) || 0)}
              </td>
              <td colSpan="3"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
