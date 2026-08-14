import React, { useMemo, useState, useEffect } from 'react';
import { Wallet, TrendingDown } from 'lucide-react';
import { getWorkingDaysForMonth } from '../utils/dateUtils';

export default function ResumenGlobal({ data, mesSeleccionado }) {
  const [workingDays, setWorkingDays] = useState({ q1Days: 0, q2Days: 0 });

  useEffect(() => {
    if (mesSeleccionado) {
      getWorkingDaysForMonth(mesSeleccionado).then(days => setWorkingDays(days));
    }
  }, [mesSeleccionado]);

  const sumItems = (items = []) => items.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  const stats = useMemo(() => {
    if (!data) return { ingresosTotales: 0, gastosTotales: 0 };

    const calcPerfil = (perfilData, isAlejandro) => {
      if (!perfilData) return { ingresos: 0, gastos: 0 };

      const ingresosTotales = sumItems(perfilData.ingresos);
      
      const ingresosFijos = perfilData.ingresos?.filter(i => i.fijo) || [];
      const totalIngresosFijos = sumItems(ingresosFijos);

      // Inmutables
      const configuracion = data.configuracion || {};
      const tarifaTransporte = isAlejandro 
        ? (configuracion.tarifa_integrado || 4715) * 2 
        : (configuracion.tarifa_metro || 3820) * 2;
      
      const totalTransporte = (workingDays.q1Days + workingDays.q2Days) * tarifaTransporte;
      const totalDiezmo = totalIngresosFijos * 0.10;
      const totalSalud = totalIngresosFijos * 0.04;
      const totalPension = totalIngresosFijos * 0.04;
      const totalInmutables = totalDiezmo + totalSalud + totalPension + totalTransporte;

      // Gastos Fijos, Variables y Reservas
      const totalFijos = sumItems(perfilData.gastos_fijos);
      const totalVariables = sumItems(perfilData.gastos_variables);
      const totalReserva = Number(perfilData.reserva?.valor) || 0;
      
      // Mercado Tickets (solo si aplica)
      const mercadoGastado = perfilData.mercado_tickets?.reduce((acc, t) => acc + (Number(t.valor) || 0), 0) || 0;

      const gastosTotales = totalInmutables + totalFijos + totalVariables + totalReserva + mercadoGastado;

      return { ingresos: ingresosTotales, gastos: gastosTotales };
    };

    const aleStats = calcPerfil(data.alejandro, true);
    const espStats = calcPerfil(data.esposa, false);

    return {
      ingresosTotales: aleStats.ingresos + espStats.ingresos,
      gastosTotales: aleStats.gastos + espStats.gastos
    };
  }, [data, workingDays]);

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  return (
    <div className="bg-white dark:bg-transparent rounded-xl shadow-sm border border-slate-200 dark:border-transparent p-4 flex flex-col md:flex-row gap-6 justify-around items-center">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 dark:bg-emerald-400/10 text-green-600 dark:text-emerald-400 rounded-lg">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Ingresos Totales (Familia)</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatter.format(stats.ingresosTotales)}</p>
        </div>
      </div>

      <div className="hidden md:block w-px h-12 bg-slate-200 dark:bg-white/10"></div>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-rose-100 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 rounded-lg">
          <TrendingDown className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gastos Totales</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatter.format(stats.gastosTotales)}</p>
        </div>
      </div>
    </div>
  );
}
