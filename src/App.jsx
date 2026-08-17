import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserCircle2, Wallet, Sun, Moon, Plus } from 'lucide-react';
import { getWorkingDaysForMonth } from './utils/dateUtils';

import BentoCard from './components/ui/BentoCard';
import TablaIngresos from './components/TablaIngresos';
import TablaGastos from './components/TablaGastos';
import ModuloMercado from './components/ModuloMercado';
import NotchedBentoCard from './components/ui/NotchedBentoCard';

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

  const [workingDays, setWorkingDays] = useState({ q1Days: 0, q2Days: 0 });

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

  useEffect(() => {
    if (mesSeleccionado) {
      getWorkingDaysForMonth(mesSeleccionado).then(days => setWorkingDays(days));
    }
  }, [mesSeleccionado]);

  const sumItems = (items = []) => items.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  const stats = useMemo(() => {
    if (!data) return { ingresosTotales: 0, gastosTotales: 0, disponibleFamiliar: 0, ale: { ingresos: 0, gastos: 0, totalTransporte: 0 }, esp: { ingresos: 0, gastos: 0, totalTransporte: 0 } };

    const calcPerfil = (perfilData, isAlejandro) => {
      if (!perfilData) return { ingresos: 0, gastos: 0, totalTransporte: 0 };

      const ingresosTotales = sumItems(perfilData.ingresos);
      const ingresosFijos = perfilData.ingresos?.filter(i => i.fijo) || [];
      const totalIngresosFijos = sumItems(ingresosFijos);

      const configuracion = data.configuracion || {};
      const tarifaTransporte = isAlejandro 
        ? (configuracion.tarifa_integrado || 4715) * 2 
        : (configuracion.tarifa_metro || 3820) * 2;
      
      const totalTransporte = (workingDays.q1Days + workingDays.q2Days) * tarifaTransporte;
      const totalDiezmo = totalIngresosFijos * 0.10;
      const totalSalud = totalIngresosFijos * 0.04;
      const totalPension = totalIngresosFijos * 0.04;
      const totalInmutables = totalDiezmo + totalSalud + totalPension + totalTransporte;

      const totalFijos = sumItems(perfilData.gastos_fijos);
      const totalVariables = sumItems(perfilData.gastos_variables);
      const totalReserva = Number(perfilData.reserva?.valor) || 0;
      
      const mercadoGastado = perfilData.mercado_tickets?.reduce((acc, t) => acc + (Number(t.valor) || 0), 0) || 0;

      const gastosTotales = totalInmutables + totalFijos + totalVariables + totalReserva + mercadoGastado;

      return { ingresos: ingresosTotales, gastos: gastosTotales, totalTransporte };
    };

    const aleStats = calcPerfil(data.alejandro, true);
    const espStats = calcPerfil(data.esposa, false);

    return {
      ingresosTotales: aleStats.ingresos + espStats.ingresos,
      gastosTotales: aleStats.gastos + espStats.gastos,
      disponibleFamiliar: (aleStats.ingresos + espStats.ingresos) - (aleStats.gastos + espStats.gastos),
      ale: aleStats,
      esp: espStats
    };
  }, [data, workingDays]);

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  if (loading) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-base transition-colors duration-300 relative overflow-hidden">
          <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-600 rounded-full mix-blend-screen filter blur-[140px] opacity-20 pointer-events-none"></div>
          <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[140px] opacity-20 pointer-events-none"></div>
          
          <div className="flex flex-col items-center gap-4 text-text-muted relative z-10">
            <div className="w-8 h-8 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium font-space">Cargando Familia Financiera...</p>
          </div>
        </div>
      </div>
    );
  }

  const isAle = perfilActivo === 'alejandro';
  const perfilData = isAle ? data?.alejandro : data?.esposa;
  const perfilStats = isAle ? stats.ale : stats.esp;
  const perfilDisponible = perfilStats.ingresos - perfilStats.gastos;

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen w-full bg-base text-text-main p-4 md:p-8 font-sans relative overflow-hidden transition-colors duration-300">
        
        {/* 1. CANVAS Y EFECTO AURORA */}
        <div className="hidden dark:block absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-violet-600 rounded-full mix-blend-screen filter blur-[140px] opacity-20 pointer-events-none"></div>
        <div className="hidden dark:block absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-600 rounded-full mix-blend-screen filter blur-[140px] opacity-20 pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto relative z-10">
          
          {/* 2. ENCABEZADO SUPERIOR DESESTRUCTURADO */}
          <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
            
            {/* Izquierda */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-emerald-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#10B981]/20">
                <Wallet className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl font-extrabold font-space text-text-main tracking-tight leading-none">Nest Pay</h1>
                <select
                  className="text-sm font-bold text-text-muted bg-transparent border-none cursor-pointer focus:ring-0 outline-none p-0 mt-1"
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                >
                  <option value={DEFAULT_MONTH} className="bg-base">Mes actual ({DEFAULT_MONTH})</option>
                  {mesesDisponibles
                    .filter(mes => mes !== DEFAULT_MONTH)
                    .map(mes => (
                      <option key={mes} value={mes} className="bg-base">{mes}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Centro */}
            <div className="flex bg-surface-hover p-1.5 rounded-full border border-border backdrop-blur-md shadow-sm">
              <button
                onClick={() => setPerfilActivo('alejandro')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${isAle ? 'bg-surface text-[#10B981] shadow-sm border border-border' : 'text-text-muted hover:text-text-main border border-transparent'}`}
              >
                <UserCircle2 className="w-5 h-5" /> Alejandro
              </button>
              <button
                onClick={() => setPerfilActivo('esposa')}
                className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all duration-300 ${!isAle ? 'bg-surface text-[#F43F5E] shadow-sm border border-border' : 'text-text-muted hover:text-text-main border border-transparent'}`}
              >
                <UserCircle2 className="w-5 h-5" /> Esposa
              </button>
            </div>

            {/* Derecha */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-3 bg-surface border border-border rounded-full text-text-muted hover:text-[#10B981] transition-all shadow-sm flex items-center justify-center group dark:backdrop-blur-md"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />}
            </button>
            
          </header>

          {/* 3. FILA HERO: MÉTRICAS GLOBALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <BentoCard title="Ingresos Totales (Familia)" badge="+" actionSlot={<span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>}>
              <p className="text-4xl font-bold text-[#10B981] font-space mt-2 tabular-nums tracking-tight">{formatter.format(stats.ingresosTotales)}</p>
            </BentoCard>
            
            <BentoCard title="Gastos Totales (Familia)" badge="-" actionSlot={<span className="w-2 h-2 rounded-full bg-[#F43F5E] shadow-[0_0_8px_#F43F5E]"></span>}>
              <p className="text-4xl font-bold text-[#F43F5E] font-space mt-2 tabular-nums tracking-tight">{formatter.format(stats.gastosTotales)}</p>
            </BentoCard>
            
            <BentoCard title="Disponible Familiar" badge="Neto" className="shadow-[0_0_30px_rgba(16,185,129,0.05)] dark:shadow-[0_0_40px_rgba(16,185,129,0.15)] border-[#10B981]/20">
              <p className="text-4xl font-bold text-text-main font-space mt-2 tabular-nums tracking-tight">{formatter.format(stats.disponibleFamiliar)}</p>
            </BentoCard>
          </div>

          {/* 4. GRID MAESTRO DE 2 COLUMNAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Columna Izquierda */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              <BentoCard 
                title="Ingresos"
                actionSlot={
                  <button className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all shadow-sm outline-none focus:outline-none focus:ring-0">
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                }
                totalLabel="TOTAL INGRESOS"
                totalAmount={formatter.format(perfilStats.ingresos)}
              >
                <TablaIngresos mesId={mesSeleccionado} isAlejandro={isAle} datos={perfilData?.ingresos} />
              </BentoCard>

              {isAle && (
                <BentoCard title="Mercado (Alejandro)">
                  <div className="-mx-2">
                    <ModuloMercado mesId={mesSeleccionado} datos={perfilData} configuracion={data?.configuracion} />
                  </div>
                </BentoCard>
              )}

              <BentoCard title="Transporte (T+1)" badge="Proyección">
                <p className="text-text-muted text-sm mt-2">Reserva estimada de transporte para el mes siguiente basada en días hábiles.</p>
                <p className="text-3xl font-bold text-text-main mt-4 font-space tabular-nums tracking-tight">{formatter.format(perfilStats.totalTransporte)}</p>
              </BentoCard>

              {/* BANNER MODULAR: Disponible Perfil */}
              <BentoCard title={`Disponible Neto (${isAle ? 'Alejandro' : 'Esposa'})`} badge="Balance" className="shadow-[0_0_30px_rgba(16,185,129,0.05)] border-[#10B981]/20 bg-gradient-to-br from-surface to-[#10B981]/5">
                <p className="text-text-muted text-sm mt-2 mb-4">Balance final tras restar obligaciones y reservas a los ingresos totales.</p>
                <p className={`text-4xl font-extrabold font-space tabular-nums tracking-tight ${perfilDisponible >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                  {formatter.format(perfilDisponible)}
                </p>
              </BentoCard>

              {/* TARJETAS OPERATIVAS (Movidas a la columna izquierda) */}
              <BentoCard title="Pendientes" badge="0 Tareas">
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                  <p className="text-sm">No hay pagos pendientes</p>
                </div>
              </BentoCard>
              
              <BentoCard 
                title="Imprevistos" 
                actionSlot={
                  <button className="flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30 hover:bg-[#F43F5E]/25 shadow-sm transition-all outline-none focus:outline-none focus:ring-0">
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                }
              >
                <div className="flex flex-col items-center justify-center py-8 text-text-muted">
                  <p className="text-sm">Sin imprevistos registrados</p>
                </div>
              </BentoCard>
              
              <BentoCard title="Ahorros" badge="Meta">
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Progreso Global</span>
                    <span className="font-bold text-text-main tabular-nums tracking-tight">0%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-hover border border-border/40 rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] w-0"></div>
                  </div>
                </div>
              </BentoCard>

            </div>

            {/* Columna Derecha */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <BentoCard 
                title="Gastos Fijos & Obligaciones"
                actionSlot={
                  <button className="flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-500 border border-rose-500/30 hover:bg-rose-500/25 transition-all shadow-sm outline-none focus:outline-none focus:ring-0">
                    <Plus className="w-4 h-4" /> Agregar
                  </button>
                }
                totalLabel="TOTAL GASTOS"
                totalAmount={formatter.format(perfilStats.gastos)}
              >
                <TablaGastos mesId={mesSeleccionado} isAlejandro={isAle} datos={perfilData} configuracion={data?.configuracion} />
              </BentoCard>
            </div>
            
          </div>

        </div>
      </div>
    </div>
  );
}
