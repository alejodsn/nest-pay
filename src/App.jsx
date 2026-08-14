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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-300 relative overflow-hidden">
          {/* Auras de fondo (Glassmorphism) */}
          <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
          <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
          
          <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400 relative z-10">
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
      <div className="min-h-screen w-full px-4 py-8 bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-300 font-sans selection:bg-brand-500/30 relative overflow-hidden">
        {/* Auras de fondo (Glassmorphism) */}
        <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
        <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto">
          {/* Header Unificado / Floating Bar */}
          <header className="mb-8 bg-white/70 dark:bg-white/5 backdrop-blur-xl dark:backdrop-blur-2xl p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 dark:border-white/10 relative flex flex-col gap-6 transition-all duration-300 z-10">
            
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
                  <div className="flex bg-slate-100/80 dark:bg-white/5 dark:backdrop-blur-md p-1.5 rounded-2xl w-max border border-slate-200/50 dark:border-white/10">
                    <button
                      onClick={() => setPerfilActivo('alejandro')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${isAle ? 'bg-white dark:bg-white/10 text-brand-600 dark:text-emerald-400 shadow-sm border border-slate-200/50 dark:border-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white border border-transparent'
                        }`}
                    >
                      <UserCircle2 className="w-5 h-5" /> Alejandro
                    </button>
                    <button
                      onClick={() => setPerfilActivo('esposa')}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${!isAle ? 'bg-white dark:bg-white/10 text-rose-500 dark:text-rose-400 shadow-sm border border-slate-200/50 dark:border-white/10' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white border border-transparent'
                        }`}
                    >
                      <UserCircle2 className="w-5 h-5" /> Esposa
                    </button>
                  </div>

                  <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-3.5 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-white hover:border-brand-500/30 dark:hover:border-white/20 transition-all shadow-sm flex items-center justify-center group dark:backdrop-blur-md"
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
                  <option value={DEFAULT_MONTH} className="text-base dark:bg-[#0B0F19]">Mes en curso ({DEFAULT_MONTH})</option>
                  {mesesDisponibles
                    .filter(mes => mes !== DEFAULT_MONTH)
                    .map(mes => (
                      <option key={mes} value={mes} className="text-base dark:bg-[#0B0F19]">{mes}</option>
                    ))}
                </select>
              </div>

              {/* Columna Derecha */}
              <div className="flex flex-col items-end gap-3 w-full xl:w-auto">
                <p className="text-sm font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                  Presupuesto {mesSeleccionado.split('-')[0]}
                </p>
                <div className="w-full xl:w-auto bg-white/40 dark:bg-white/5 rounded-2xl p-1 shadow-sm border border-white/50 dark:border-white/10 backdrop-blur-sm dark:backdrop-blur-2xl">
                  <ResumenGlobal data={data} mesSeleccionado={mesSeleccionado} />
                </div>
              </div>
            </div>

          </header>

          {/* Contenido Dinámico - Bento Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-fade-in relative z-0">
            
            {/* Columna Izquierda */}
            <div className="xl:col-span-5 flex flex-col gap-8">
              <div className="rounded-[2.5rem] bg-white/60 dark:bg-white/5 backdrop-blur-xl dark:backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 transition-all duration-300">
                <TablaIngresos
                  mesId={mesSeleccionado}
                  isAlejandro={isAle}
                  datos={perfilData?.ingresos}
                />
              </div>

              {isAle && (
                <div className="rounded-[2.5rem] bg-white/60 dark:bg-white/5 backdrop-blur-xl dark:backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 transition-all duration-300">
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
              <div className="rounded-[2.5rem] bg-white/60 dark:bg-white/5 backdrop-blur-xl dark:backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6 h-full transition-all duration-300">
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
