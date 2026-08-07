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
    tarifa_integrado: 4715,
    tarifa_metro: 3820
  },
  alejandro: {
    reserva_acumulada: 0,
    ingresos: [
      { id: "i1", nombre: "Salario", valor: 3000000, fijo: true },
      { id: "i2", nombre: "Aux. Trans.", valor: 249095, fijo: true },
      { id: "i3", nombre: "Milenio", valor: 1034000, fijo: true }
    ],
    gastos_fijos: [
      { id: "f1", nombre: "Mercado", valor: 1500000, q1_pagado: false, q2_pagado: false },
      { id: "f2", nombre: "Internet+Datos", valor: 120000, q1_pagado: false, q2_pagado: false },
      { id: "f3", nombre: "Crédito Camilo", valor: 300000, q1_pagado: false, q2_pagado: false },
      { id: "f4", nombre: "Corte Mateo", valor: 60000, q1_pagado: false, q2_pagado: false },
      { id: "f5", nombre: "Transportes Domingo", valor: 120000, q1_pagado: false, q2_pagado: false },
      { id: "f6", nombre: "Alkomprar iPhone", valor: 77000, q1_pagado: false, q2_pagado: false },
      { id: "f7", nombre: "Google One", valor: 65000, q1_pagado: false, q2_pagado: false },
      { id: "f8", nombre: "iCloud", valor: 15000, q1_pagado: false, q2_pagado: false },
      { id: "f9", nombre: "Adobe", valor: 65000, q1_pagado: false, q2_pagado: false }
      { id: "f10", nombre: "Davivienda", valor: 0, q1_pagado: false, q2_pagado: false }
      { id: "f11", nombre: "Remodelación", valor: 0, q1_pagado: false, q2_pagado: false }
    ],
    gastos_variables: [],
    reserva: { nombre: "Reserva Mensual", valor: 200000, q1_pagado: false, q2_pagado: false },
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
    ingresos: [
      { id: "i1", nombre: "Salario", valor: 3700000, fijo: true }
    ],
    gastos_fijos: [
      { id: "e1", nombre: "Crédito Milenio", valor: 460000, q1_pagado: false, q2_pagado: false },
      { id: "e2", nombre: "Deducciones Milenio", valor: 214000, q1_pagado: false, q2_pagado: false },
      { id: "e3", nombre: "Celular claro", valor: 50000, q1_pagado: false, q2_pagado: false },
      { id: "e4", nombre: "Emi Blanca", valor: 70000, q1_pagado: false, q2_pagado: false },
      { id: "e5", nombre: "Natillera", valor: 65000, q1_pagado: false, q2_pagado: false },
      { id: "e6", nombre: "Uñas", valor: 60000, q1_pagado: false, q2_pagado: false },
      { id: "e7", nombre: "Leche Mateo", valor: 75000, q1_pagado: false, q2_pagado: false },
      { id: "e8", nombre: "Arriendo", valor: 700000, q1_pagado: false, q2_pagado: false },
      { id: "e9", nombre: "Servicios", valor: 210000, q1_pagado: false, q2_pagado: false },
      { id: "e10", nombre: "Cuidado Mateo", valor: 150000, q1_pagado: false, q2_pagado: false },
      { id: "e11", nombre: "Jardín", valor: 350000, q1_pagado: false, q2_pagado: false },
      { id: "e12", nombre: "Escuela de futbol", valor: 70000, q1_pagado: false, q2_pagado: false }
    ],
    gastos_variables: [],
    reserva: { nombre: "Reserva Mensual", valor: 50000, q1_pagado: false, q2_pagado: false },
    estado_pagos_inmutables: {
      diezmo: { q1: false, q2: false },
      salud: { q1: false, q2: false },
      pension: { q1: false, q2: false },
      transporte: { q1: false, q2: false }
    }
  }
};

export default function App() {
  const [perfilActivo, setPerfilActivo] = useState('alejandro');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'presupuestos', DEFAULT_MONTH);
    
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
              className={`flex items-center gap-2 px-5 py-1.5 rounded-md font-bold text-sm transition-all ${
                isAle ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <UserCircle2 className="w-5 h-5" /> Alejandro
            </button>
            <button
              onClick={() => setPerfilActivo('esposa')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-md font-bold text-sm transition-all ${
                !isAle ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'
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
