import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserCircle2, Wallet, Sun, Moon } from 'lucide-react';

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
  const [isDarkMode, setIsDarkMode] = useState(false);

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
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium">Cargando Familia Financiera...</p>
          </div>
        </div>
      </div>
    );
  }

  const isAle = perfilActivo === 'alejandro';
  const perfilData = isAle ? data?.alejandro : data?.esposa;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen w-full px-4 py-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-brand-500/30">
        
        <div className="max-w-[1400px] mx-auto">
          {/* Header Unificado / Floating Bar */}
          <header className="mb-8 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200/60 dark:border-slate-800/60 relative flex flex-col gap-6 transition-all duration-300 z-10">
            
            {/* Fila Superior (Top - Centrado absoluto) */}
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Wallet className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Nest Pay</h1>
            </div>

            {/* Fila Inferior (Dividida en 2 columnas, flex-between) */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mt-20 xl:mt-6 gap-6">

              {/* Columna Izquierda */}
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex bg-slate-100/80 dark:bg-slate-950/80 p-1.5 rounded-2xl w-max border border-slate-200/50 dark:border-slate-800/50">
                    <button
                      onClick={() => setPerfilActivo('alejandro')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${isAle ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/50 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                        }`}
                    >
                      <UserCircle2 className="w-5 h-5" /> Alejandro
                    </button>
                    <button
                      onClick={() => setPerfilActivo('esposa')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${!isAle ? 'bg-white dark:bg-slate-800 text-rose-500 dark:text-rose-400 shadow-sm border border-slate-200/50 dark:border-slate-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-transparent'
                        }`}
                    >
                      <UserCircle2 className="w-5 h-5" /> Esposa
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-3.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 hover:border-brand-500/30 transition-all shadow-sm flex items-center justify-center group"
                    aria-label="Toggle Dark Mode"
                  >
                    {isDarkMode ? <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />}
                  </button>
                </div>

                <select
                  className="text-2xl font-extrabold text-slate-800 dark:text-white bg-transparent border-none cursor-pointer focus:ring-0 outline-none p-0 transition-colors duration-300"
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                >
                  <option value={DEFAULT_MONTH} className="text-base dark:bg-slate-800">Mes en curso ({DEFAULT_MONTH})</option>
                  {mesesDisponibles
                    .filter(mes => mes !== DEFAULT_MONTH)
                    .map(mes => (
                      <option key={mes} value={mes} className="text-base dark:bg-slate-800">{mes}</option>
                    ))}
                </select>
              </div>

              {/* Columna Derecha */}
              <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
                <p className="text-sm font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                  Presupuesto {mesSeleccionado.split('-')[0]}
                </p>
                <div className="w-full xl:w-auto bg-white/40 dark:bg-slate-950/40 rounded-2xl p-1 shadow-sm border border-white/50 dark:border-slate-800/50 backdrop-blur-sm">
                  <ResumenGlobal data={data} mesSeleccionado={mesSeleccionado} />
                </div>
              </div>
            </div>

          </header>

          {/* Contenido Dinámico - Bento Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in relative z-0">
            
            {/* Columna Izquierda */}
            <div className="xl:col-span-5 flex flex-col gap-8">
              <div className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-6 transition-all duration-300">
                <TablaIngresos
                  mesId={mesSeleccionado}
                  isAlejandro={isAle}
                  datos={perfilData?.ingresos}
                />
              </div>

              {isAle && (
                <div className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-6 transition-all duration-300">
                  <ModuloMercado
                    mesId={mesSeleccionado}
                    datos={perfilData}
                    configuracion={data?.configuracion}
                  />
                </div>
              )}
            </div>

            {/* Columna Derecha */}
            <div className="xl:col-span-7">
              <div className="rounded-[2.5rem] bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-6 h-full transition-all duration-300">
                <TablaGastos
                  mesId={mesSeleccionado}
                  isAlejandro={isAle}
                  datos={perfilData}
                  configuracion={data?.configuracion}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
