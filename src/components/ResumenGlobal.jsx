import React, { useMemo } from 'react';
import { Wallet, TrendingDown, PiggyBank } from 'lucide-react';

export default function ResumenGlobal({ data }) {
  const sumItems = (items = []) => items.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);

  const stats = useMemo(() => {
    if (!data) return { ingresosTotales: 0, gastosTotales: 0 };

    const ingresosAlejandro = sumItems(data.alejandro?.ingresos);
    const ingresosEsposa = sumItems(data.esposa?.ingresos);
    
    // Inmutables (aproximación basada en fijos)
    const fijosAle = data.alejandro?.ingresos?.filter(i => i.fijo) || [];
    const fijosEsp = data.esposa?.ingresos?.filter(i => i.fijo) || [];
    const baseAle = sumItems(fijosAle);
    const baseEsp = sumItems(fijosEsp);
    
    // Para simplificar el resumen global, el gasto total solo sumará variables.
    // Los inmutables varían por transporte, que es asíncrono y se calcula en TablaGastos. 
    // Para mantener el resumen ágil, sumamos los fijos estándar y variables.
    const inmutablesFijosAle = (baseAle * 0.1) + (baseAle * 0.04) + (baseAle * 0.04);
    const inmutablesFijosEsp = (baseEsp * 0.1) + (baseEsp * 0.04) + (baseEsp * 0.04);

    const gastosVariablesAle = sumItems(data.alejandro?.gastos_variables);
    const gastosVariablesEsp = sumItems(data.esposa?.gastos_variables);

    const mercadoGastado = data.alejandro?.mercado_tickets?.reduce((acc, t) => acc + (Number(t.valor) || 0), 0) || 0;

    // Nota: El transporte requiere un cálculo asíncrono que no está disponible instantáneamente aquí.
    // Para ser precisos tendríamos que pasar los valores calculados de transporte a este componente.
    // De momento, sumaremos los gastos conocidos.
    const ingresosTotales = ingresosAlejandro + ingresosEsposa;
    const gastosTotales = inmutablesFijosAle + inmutablesFijosEsp + gastosVariablesAle + gastosVariablesEsp + mercadoGastado;

    return { ingresosTotales, gastosTotales };
  }, [data]);

  const formatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row gap-4 justify-around items-center">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Ingresos Totales (Familia)</p>
          <p className="text-2xl font-bold text-slate-800">{formatter.format(stats.ingresosTotales)}</p>
        </div>
      </div>

      <div className="hidden md:block w-px h-12 bg-slate-200"></div>

      <div className="flex items-center gap-3">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
          <TrendingDown className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 font-medium">Gastos Totales (Aprox sin Transporte)</p>
          <p className="text-2xl font-bold text-slate-800">{formatter.format(stats.gastosTotales)}</p>
        </div>
      </div>
    </div>
  );
}
