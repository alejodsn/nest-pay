import { format, getDaysInMonth, isWeekend, isSameDay, parseISO } from 'date-fns';

/**
 * Obtiene los festivos de Colombia para un año específico
 * @param {number} year - Año a consultar
 * @returns {Promise<Date[]>} - Array de objetos Date correspondientes a los festivos
 */
export async function getColombianHolidays(year) {
  try {
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/CO`);
    if (!response.ok) throw new Error('Error al obtener festivos');
    const data = await response.json();
    return data.map(holiday => parseISO(holiday.date));
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return []; // En caso de error, asume que no hay festivos para evitar romper la app
  }
}

/**
 * Calcula los días hábiles (L-V, sin festivos) en un rango de días para un mes dado
 * @param {number} year - Año
 * @param {number} month - Mes (0-11)
 * @param {number} startDay - Día de inicio
 * @param {number} endDay - Día de fin
 * @param {Date[]} holidays - Array de festivos del año
 * @returns {number} - Cantidad de días hábiles
 */
export function getWorkingDaysInRange(year, month, startDay, endDay, holidays) {
  let workingDaysCount = 0;

  for (let day = startDay; day <= endDay; day++) {
    const currentDate = new Date(year, month, day);
    
    // Es fin de semana? (Sábado o Domingo)
    const isWknd = isWeekend(currentDate);
    
    // Es festivo?
    const isHoliday = holidays.some(holiday => isSameDay(holiday, currentDate));

    if (!isWknd && !isHoliday) {
      workingDaysCount++;
    }
  }

  return workingDaysCount;
}

/**
 * Obtiene un resumen de los días hábiles de un mes específico divididos en Q1 (1-15) y Q2 (16-fin)
 * @param {string} monthStr - Cadena en formato "YYYY-MM"
 * @returns {Promise<{ q1Days: number, q2Days: number }>}
 */
export async function getWorkingDaysForMonth(monthStr) {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1; // date-fns y JS Date usan 0-index para meses

  const holidays = await getColombianHolidays(year);
  const totalDaysInMonth = getDaysInMonth(new Date(year, month));

  const q1Days = getWorkingDaysInRange(year, month, 1, 15, holidays);
  const q2Days = getWorkingDaysInRange(year, month, 16, totalDaysInMonth, holidays);

  return { q1Days, q2Days };
}

/**
 * Calcula el porcentaje transcurrido del mes actual
 * @param {string} monthStr - Cadena en formato "YYYY-MM" (ej. 2026-08)
 * @param {Date} today - Fecha actual, por defecto new Date()
 * @returns {number} - Porcentaje (0 a 100)
 */
export function getMonthProgress(monthStr, today = new Date()) {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10) - 1;

  // Si el mes actual es diferente al de "today", devolvemos 0 (si es futuro) o 100 (si es pasado)
  const currentMonthDate = new Date(year, month);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  if (year > todayYear || (year === todayYear && month > todayMonth)) {
    return 0; // Mes futuro
  }
  if (year < todayYear || (year === todayYear && month < todayMonth)) {
    return 100; // Mes pasado
  }

  const totalDays = getDaysInMonth(currentMonthDate);
  const currentDay = today.getDate();

  return (currentDay / totalDays) * 100;
}
