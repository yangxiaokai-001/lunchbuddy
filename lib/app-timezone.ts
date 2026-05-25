export const APP_TIMEZONE = "Asia/Shanghai";
const APP_OFFSET_MINUTES = 8 * 60;

function readParts(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "0"),
    month: Number(parts.find((part) => part.type === "month")?.value ?? "0"),
    day: Number(parts.find((part) => part.type === "day")?.value ?? "0"),
  };
}

function shanghaiMidnightToUtc(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day, 0, -APP_OFFSET_MINUTES, 0, 0));
}

export function getAppDateParts(date: Date) {
  const raw = readParts(date);
  return {
    year: `${raw.year}`,
    month: `${raw.month}`.padStart(2, "0"),
    day: `${raw.day}`.padStart(2, "0"),
  };
}

export function startOfAppDay(baseDate = new Date()) {
  const { year, month, day } = readParts(baseDate);
  return shanghaiMidnightToUtc(year, month, day);
}

export function startOfAppMonth(baseDate = new Date()) {
  const { year, month } = readParts(baseDate);
  return shanghaiMidnightToUtc(year, month, 1);
}

export function addAppMonths(baseDate: Date, delta: number) {
  const { year, month } = readParts(baseDate);
  const shifted = new Date(year, month - 1 + delta, 1);
  return shanghaiMidnightToUtc(
    shifted.getFullYear(),
    shifted.getMonth() + 1,
    1,
  );
}

export function parseClockTimeInAppDay(timeValue: string, appDayStart: Date) {
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(appDayStart.getTime() + (hours * 60 + minutes) * 60 * 1000);
}
