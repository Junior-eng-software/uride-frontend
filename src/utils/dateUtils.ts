export function localDatetimeToIso(datetimeLocal: string): string {
  const date = new Date(datetimeLocal);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offsetMs);
  const offsetSign = date.getTimezoneOffset() > 0 ? "-" : "+";
  const offsetHours = String(Math.floor(Math.abs(date.getTimezoneOffset()) / 60)).padStart(2, "0");
  const offsetMinutes = String(Math.abs(date.getTimezoneOffset()) % 60).padStart(2, "0");
  return `${localDate.toISOString().slice(0, 19)}${offsetSign}${offsetHours}:${offsetMinutes}`;
}