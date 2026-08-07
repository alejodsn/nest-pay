// Función que lee el reloj del sistema y genera el formato "YYYY-MM"
const getCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  // Se suma 1 porque en JavaScript los meses van de 0 (Enero) a 11 (Diciembre)
  // El padStart asegura que meses como Septiembre (9) queden como "09"
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Exportamos el mes dinámico en lugar de dejarlo quemado
export const DEFAULT_MONTH = getCurrentMonth();

// Esta variable ahora funciona solo como un "salvavidas" inicial.
// Una vez que se inyecte en Firebase, la app dejará de usar esto y leerá directo de la BD.
export const TEMPLATE_DATA = {
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
      { id: "f9", nombre: "Adobe", valor: 65000, q1_pagado: false, q2_pagado: false },
      { id: "f10", nombre: "Davivienda", valor: 0, q1_pagado: false, q2_pagado: false },
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
