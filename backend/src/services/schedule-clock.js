const scheduleClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Novosibirsk",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

// Existing UTC deployments store the calendar date and time from the
// schedule directly in scheduledAt. Preserve that representation for deduplication.
export function scheduleNow(instant = new Date()) {
  const { year, month, day, hour, minute, second } = Object.fromEntries(
    scheduleClock.formatToParts(instant).map(({ type, value }) => [type, value])
  );
  return new Date(Date.UTC(
    Number(year), Number(month) - 1, Number(day),
    Number(hour), Number(minute), Number(second), instant.getUTCMilliseconds()
  ));
}

export function dateKey(day) {
  return day.toISOString().slice(0, 10);
}

export function startOfScheduleDay(day) {
  const start = new Date(day);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function startOfScheduleWeek(day) {
  const start = startOfScheduleDay(day);
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  return start;
}

export function todayRange(day = scheduleNow()) {
  const start = startOfScheduleDay(day);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { gte: start, lt: end };
}
