(() => {
  const pad = (value) => String(value).padStart(2, '0');

  const toIsoDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) return '';
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
    }
    const value = new Date(date);
    if (Number.isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  };

  const addDays = (date, amount) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
  };

  const expandEventDates = (event) => {
    const start = toIsoDate(event.start);
    const endRaw = toIsoDate(event.end);
    if (!start) return [];
    if (!endRaw || start === endRaw) return [start];
    const startDate = new Date(start);
    const endDate = new Date(endRaw);
    const dates = [];
    const last = event.allDay ? addDays(endDate, -1) : endDate;
    let cursor = new Date(startDate);
    while (cursor <= last) {
      dates.push(toIsoDate(cursor));
      cursor = addDays(cursor, 1);
    }
    return dates;
  };


  const buildEventDateMap = (events) => {
    const map = new Map();
    (events || []).forEach((event) => {
      const dates = expandEventDates(event);
      dates.forEach((dateKey) => {
        const bucket = map.get(dateKey) || [];
        bucket.push(event);
        map.set(dateKey, bucket);
      });
    });
    return map;
  };

  const getWeekStart = (date) => {
    const value = new Date(date);
    const day = (value.getDay() + 6) % 7;
    value.setDate(value.getDate() - day);
    return value;
  };

  const buildWeekModel = (date, events) => {
    const base = getWeekStart(date);
    const map = buildEventDateMap(events);
    const days = [];
    for (let i = 0; i < 7; i += 1) {
      const dayDate = addDays(base, i);
      const key = toIsoDate(dayDate);
      days.push({
        date: key,
        label: dayDate.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'short' }),
        events: map.get(key) || []
      });
    }
    return days;
  };

  const buildDayModel = (date, events) => {
    const key = toIsoDate(date);
    const map = buildEventDateMap(events);
    return {
      date: key,
      label: new Date(key).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
      events: map.get(key) || []
    };
  };

  const buildMonthCells = (viewDate, events) => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const map = buildEventDateMap(events);
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const dayNumber = i - startOffset + 1;
      let cellDate = new Date(year, month, dayNumber);
      let isOutside = false;
      if (dayNumber <= 0) {
        cellDate = new Date(year, month - 1, daysInPrev + dayNumber);
        isOutside = true;
      } else if (dayNumber > daysInMonth) {
        cellDate = new Date(year, month + 1, dayNumber - daysInMonth);
        isOutside = true;
      }
      const key = toIsoDate(cellDate);
      cells.push({
        date: key,
        isOutside,
        dayNumber: cellDate.getDate(),
        events: map.get(key) || []
      });
    }
    return cells;
  };

  const api = {
    toIsoDate,
    expandEventDates,
    buildEventDateMap,
    buildWeekModel,
    buildDayModel,
    buildMonthCells
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    window.CalendarUtils = api;
  }
})();
