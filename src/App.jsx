import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserCircle2, PiggyBank } from 'lucide-react';

import ResumenGlobal from './components/ResumenGlobal';
import TablaIngresos from './components/TablaIngresos';
import TablaGastos from './components/TablaGastos';
import ModuloMercado from './components/ModuloMercado';

const DEFAULT_MONTH = '2026-08';

const INITIAL_DATA = {
  mes: DEFAULT_MONTH,
  configuracion: {
    presupuesto_mercado: 1500000,
    tarifa_integrado: 10000,
    tarifa_metro: 3600
  },
  alejandro: {
    reserva_acumulada: 0,
    ingresos: [{ id: "1", nombre: "Salario", valor: 3000000, fijo: true }],
    gastos_variables: [{ id: "g1", nombre: "Reserva Mensual", valor: 50000, q1_pagado: false, q2_pagado: false }],
    mercado_tickets: [],
    estado_pagos_inmutables: {
      diezmo: { q1: false, q2: false },
      salud: { q1: false, q2: false },
      pension: { q1: false, q2: false },
      transporte: { q1: false, q2: false }
    }
  },
  esposa: {
    reserva_acumulada: 0,
    ingresos: [{ id: "2", nombre: "Salario", valor: 2000000, fijo: true }],
    gastos_variables: [{ id: "g2", nombre: "Celular", valor: 45000, q1_pagado: false, q2_pagado: false }],
    estado_pagos_inmutables: {
      diezmo: { q1: false, q2: false },
      salud: { q1: false, q2: false },
      pension: { q1: false, q2: false },
      transporte: { q1: false, q2: false }
    }
  }
};

export default function App() {
  const [perfilActivo, setPerfilActivo] = useState('alejandro'); // 'alejandro' | 'esposa'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicializar o escuchar el documento
    const docRef = doc(db, 'presupuestos', DEFAULT_MONTH);
    
    // Función para inicializar si no existe
    const initDoc = async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          await setDoc(docRef, INITIAL_DATA);
        }
      } catch (err) {
        console.error("Error validando/creando documento inicial:", err);
      }
    };

    initDoc().then(() => {
      // Suscribirse a cambios
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
          <p className="text-xs text-slate-400">Verifica que .env.local tenga tus credenciales</p>
        </div>
      </div>
    );
  }

  const isAle = perfilActivo === 'alejandro';
  const perfilData = isAle ? data?.alejandro : data?.esposa;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Fijo */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <PiggyBank className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Familia Financiera</h1>
            <p className="text-sm font-medium text-slate-500">Presupuesto: Agosto 2026</p>
          </div>
        </div>
      </header>

      {/* Resumen Global */}
      <ResumenGlobal data={data} />

      {/* Selector de Perfiles */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1 shadow-inner">
          <button
            onClick={() => setPerfilActivo('alejandro')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
              isAle ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCircle2 className="w-5 h-5" /> Alejandro
          </button>
          <button
            onClick={() => setPerfilActivo('esposa')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${
              !isAle ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserCircle2 className="w-5 h-5" /> Esposa
          </button>
        </div>
      </div>

      {/* Contenido Dinámico por Perfil */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
        
        {/* Columna Izquierda: Ingresos y Mercado (Si es Ale) */}
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

        {/* Columna Derecha: Gastos */}
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
