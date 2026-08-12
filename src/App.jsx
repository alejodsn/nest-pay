import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserCircle2, Wallet } from 'lucide-react';

import ResumenGlobal from './components/ResumenGlobal';
import TablaIngresos from './components/TablaIngresos';
import TablaGastos from './components/TablaGastos';
import ModuloMercado from './components/ModuloMercado';

import { DEFAULT_MONTH, TEMPLATE_DATA } from './config/defaultTemplate';

export default function App() {
  const [perfilActivo, setPerfilActivo] = useState('alejandro');
  const [mesSeleccionado, setMesSeleccionado] = useState(DEFAULT_MONTH);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'presupuestos'));
        const meses = querySnapshot.docs.map(doc => doc.id);
        setMesesDisponibles(meses);
      } catch (err) {
        console.error("Error fetching meses disponibles:", err);
      }
    };
    fetchMeses();
  }, []);

  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, 'presupuestos', mesSeleccionado);
    const plantillaRef = doc(db, 'plantillas', 'plantilla_base');

    const initDoc = async () => {
      try {
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          const plantillaSnap = await getDoc(plantillaRef);
          let baseData;

          if (!plantillaSnap.exists() || !plantillaSnap.data().alejandro) {
            console.log("Inyectando configuración inicial en la colección plantillas...");
            await setDoc(plantillaRef, TEMPLATE_DATA);
            baseData = TEMPLATE_DATA;
          } else {
            baseData = plantillaSnap.data();
          }

          await setDoc(docRef, {
            ...baseData,
            mes: mesSeleccionado
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
  }, [mesSeleccionado]);

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
      <header className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200 relative flex flex-col gap-6">

        {/* Fila Superior (Top - Centrado absoluto) */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Nest Pay</h1>
        </div>

        {/* Fila Inferior (Dividida en 2 columnas, flex-between) */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mt-16 xl:mt-8 gap-4">

          {/* Columna Izquierda */}
          <div className="flex flex-col gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg w-max">
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

            <select
              className="text-xl font-extrabold text-slate-800 bg-transparent border-none cursor-pointer focus:ring-0 outline-none p-0"
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
            >
              <option value={DEFAULT_MONTH}>Mes en curso ({DEFAULT_MONTH})</option>
              {mesesDisponibles
                .filter(mes => mes !== DEFAULT_MONTH)
                .map(mes => (
                  <option key={mes} value={mes}>{mes}</option>
                ))}
            </select>
          </div>

          {/* Columna Derecha */}
          <div className="flex flex-col items-end gap-2 w-full xl:w-auto">
            <p className="text-sm font-medium text-slate-400">Presupuesto {mesSeleccionado.split('-')[0]}</p>
            <div className="w-full xl:w-auto">
              <ResumenGlobal data={data} mesSeleccionado={mesSeleccionado} />
            </div>
          </div>
        </div>

      </header>

      {/* Contenido Dinámico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">

        <div className="lg:col-span-5 flex flex-col gap-6">
          <TablaIngresos
            mesId={mesSeleccionado}
            isAlejandro={isAle}
            datos={perfilData?.ingresos}
          />

          {isAle && (
            <ModuloMercado
              mesId={mesSeleccionado}
              datos={perfilData}
              configuracion={data?.configuracion}
            />
          )}
        </div>

        <div className="lg:col-span-7">
          <TablaGastos
            mesId={mesSeleccionado}
            isAlejandro={isAle}
            datos={perfilData}
            configuracion={data?.configuracion}
          />
        </div>

      </div>
    </div>
  );
}
