import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserCircle2, PiggyBank } from 'lucide-react';

import ResumenGlobal from './components/ResumenGlobal';
import TablaIngresos from './components/TablaIngresos';
import TablaGastos from './components/TablaGastos';
import ModuloMercado from './components/ModuloMercado';

import { DEFAULT_MONTH, TEMPLATE_DATA } from './config/defaultTemplate';

export default function App() {
  const [perfilActivo, setPerfilActivo] = useState('alejandro');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'presupuestos', DEFAULT_MONTH);
    const plantillaRef = doc(db, 'plantillas', 'plantilla_base');

    const initDoc = async () => {
      try {
        const docSnap = await getDoc(docRef);

        // Si el mes NO existe en Firebase
        if (!docSnap.exists()) {
          const plantillaSnap = await getDoc(plantillaRef);
          let baseData;

          // Verificamos si la plantilla está vacía o solo tiene datos de prueba
          if (!plantillaSnap.exists() || !plantillaSnap.data().alejandro) {
            console.log("Inyectando configuración inicial en la colección plantillas...");
            await setDoc(plantillaRef, TEMPLATE_DATA);
            baseData = TEMPLATE_DATA;
          } else {
            baseData = plantillaSnap.data();
          }

          // Creamos el mes actual usando la base
          await setDoc(docRef, {
            ...baseData,
            mes: DEFAULT_MONTH
          });
        }
      } catch (err) {
        console.error("Error validando/creando documento inicial:", err);
      }
    };

    initDoc().then(() => {
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data());
        }
        setLoading(false);
      });

      return () => unsubscribe();
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Cargando Familia Financiera...</p>
        </div>
      </div>
    );
  }

  const isAle = perfilActivo === 'alejandro';
  const perfilData = isAle ? data?.alejandro : data?.esposa;

  return (
    <div className="w-full px-4 py-6">

      {/* Header Unificado */}
      <header className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
              <PiggyBank className="w-6 h-6" />
            </div>

            <select
              className="text-xl font-extrabold text-slate-800 bg-transparent border-none cursor-pointer focus:ring-0 outline-none"
              value={DEFAULT_MONTH}
              onChange={(e) => {
                console.log("Cargar mes:", e.target.value);
              }}
            >
              <option value="2026-07">Julio 2026</option>
              <option value="2026-08">Agosto 2026 (Actual)</option>
              <option value="2026-09">Septiembre 2026</option>
            </select>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setPerfilActivo('alejandro')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-md font-bold text-sm transition-all ${isAle ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <UserCircle2 className="w-5 h-5" /> Alejandro
            </button>
            <button
              onClick={() => setPerfilActivo('esposa')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-md font-bold text-sm transition-all ${!isAle ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <UserCircle2 className="w-5 h-5" /> Esposa
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 w-full xl:w-auto">
          <ResumenGlobal data={data} />
        </div>
      </header>

      {/* Contenido Dinámico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">

        <div className="lg:col-span-5 flex flex-col gap-6">
          <TablaIngresos
            mesId={DEFAULT_MONTH}
            isAlejandro={isAle}
            datos={perfilData?.ingresos}
          />

          {isAle && (
            <ModuloMercado
              mesId={DEFAULT_MONTH}
              datos={perfilData}
              configuracion={data?.configuracion}
            />
          )}
        </div>

        <div className="lg:col-span-7">
          <TablaGastos
            mesId={DEFAULT_MONTH}
            isAlejandro={isAle}
            datos={perfilData}
            configuracion={data?.configuracion}
          />
        </div>

      </div>
    </div>
  );
}
