export const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export const DAY_NAMES_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

export const formatDateFr = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(date);
};

export const getMonthGrid = (year: number, month: number) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  // Adjust for Monday start if desired, but let's stick to Sun=0 for simplicity or adjust visually
  // French calendars usually start on Monday.
  // Let's make Monday index 0.
  const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const grid: { date: Date; isCurrentMonth: boolean }[] = [];

  // Previous month days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = adjustedStartDay - 1; i >= 0; i--) {
    grid.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    grid.push({
      date: new Date(year, month, i),
      isCurrentMonth: true
    });
  }

  // Next month days to fill 42 cells (6 rows * 7 cols)
  const remainingCells = 42 - grid.length;
  for (let i = 1; i <= remainingCells; i++) {
    grid.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false
    });
  }

  return grid;
};

export const toISODateLocal = (date: Date): string => {
    const offset = date.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, -1);
    return localISOTime.slice(0, 10); // YYYY-MM-DD
}