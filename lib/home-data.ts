import { prisma } from "@/lib/prisma";
import { requireCurrentUserId } from "@/lib/auth";
import { getTodayAIDailyFeed } from "@/lib/ai-daily-feed";
import {
  addAppMonths,
  APP_TIMEZONE,
  getAppDateParts,
  parseClockTimeInAppDay,
  startOfAppDay,
  startOfAppMonth,
} from "@/lib/app-timezone";

const REQUIRED_WORK_MINUTES = 9.5 * 60;

function formatDateLabel(date: Date) {
  const { month, day } = getAppDateParts(date);
  return `${month} / ${day}`;
}

function formatShortDate(date: Date) {
  const { month, day } = getAppDateParts(date);
  return `${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  const { year, month } = getAppDateParts(date);
  return `${year}-${month}`;
}

function formatTime(date: Date | null | undefined) {
  if (!date) return "--:--";

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatMinutes(totalMinutes: number | null | undefined) {
  const safeMinutes = Math.max(0, totalMinutes ?? 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatFoodOptionLabel(option: {
  name: string;
  restaurantName: string | null;
  dishName: string | null;
}) {
  if (option.restaurantName && option.dishName) {
    return `${option.restaurantName} · ${option.dishName}`;
  }

  return option.name;
}

function formatFoodPreviewName(option: {
  name: string;
  restaurantName: string | null;
  dishName: string | null;
}) {
  return option.dishName ?? formatFoodOptionLabel(option);
}

function buildDailyFoodPreview(
  options: Array<{
    name: string;
    restaurantName: string | null;
    dishName: string | null;
  }>,
  date: Date,
  count: number,
) {
  if (options.length <= count) {
    return options.map((option) => formatFoodPreviewName(option));
  }

  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diffDays = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const startIndex = diffDays % options.length;
  const selected = [];

  for (let index = 0; index < count; index += 1) {
    selected.push(options[(startIndex + index) % options.length]);
  }

  return selected.map((option) => formatFoodPreviewName(option));
}

function formatCountdown(target: Date, now: Date) {
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours} 小时 ${minutes} 分钟`;
}

function getAttendanceSummary(params: {
  clockInAt: Date | null;
  clockOutAt: Date | null;
  workMinutes: number | null;
  overtimeMins: number | null;
  status: "NOT_STARTED" | "WORKING" | "FINISHED";
}) {
  const now = new Date();
  const { clockInAt, clockOutAt, workMinutes, overtimeMins, status } = params;

  const computedWorkMinutes =
    workMinutes ??
    (clockInAt ? Math.max(0, Math.floor((now.getTime() - clockInAt.getTime()) / 60000)) : 0);

  const effectiveOvertime =
    overtimeMins ??
    (clockInAt && clockOutAt
      ? Math.max(
          0,
          Math.floor((clockOutAt.getTime() - addMinutes(clockInAt, REQUIRED_WORK_MINUTES).getTime()) / 60000),
        )
      : 0);

  const expectedClockOutAt = clockInAt ? addMinutes(clockInAt, REQUIRED_WORK_MINUTES) : null;

  return {
    status,
    clockInLabel: formatTime(clockInAt),
    clockInAtIso: clockInAt?.toISOString() ?? null,
    clockOutAtIso: clockOutAt?.toISOString() ?? null,
    expectedClockOutLabel: formatTime(expectedClockOutAt),
    expectedClockOutAtIso: expectedClockOutAt?.toISOString() ?? null,
    workDurationLabel: formatMinutes(computedWorkMinutes),
    overtimeLabel: formatMinutes(effectiveOvertime),
  };
}

function getCountdownSummary(params: {
  clockInAt: Date | null;
  clockOutAt: Date | null;
  workStartTime: string;
  workEndTime: string;
}) {
  const now = new Date();
  const today = startOfAppDay(now);
  const startTarget = parseClockTimeInAppDay(params.workStartTime, today);
  const endTarget = parseClockTimeInAppDay(params.workEndTime, today);
  const expectedClockOutAt = params.clockInAt
    ? addMinutes(params.clockInAt, REQUIRED_WORK_MINUTES)
    : null;

  if (params.clockOutAt) {
    return {
      label: "今天辛苦了",
      value: "已完成打卡",
      targetAtIso: null,
    };
  }

  if (params.clockInAt) {
    return {
      label: "距离下班",
      value: formatCountdown(expectedClockOutAt ?? endTarget, now),
      targetAtIso: (expectedClockOutAt ?? endTarget).toISOString(),
    };
  }

  if (now < startTarget) {
    return {
      label: "距离打卡窗口开始",
      value: formatCountdown(startTarget, now),
      targetAtIso: startTarget.toISOString(),
    };
  }

  if (now < endTarget) {
    return {
      label: "距离打卡窗口结束",
      value: formatCountdown(endTarget, now),
      targetAtIso: endTarget.toISOString(),
    };
  }

  return {
    label: "建议尽快打卡",
    value: "已超过 10:00",
    targetAtIso: null,
  };
}

export async function getHomePageData() {
  const today = startOfAppDay();
  const monthStart = startOfAppMonth(today);
  const rangeStart = addAppMonths(monthStart, -3);
  const rangeEnd = addAppMonths(monthStart, 2);
  const currentUserId = await requireCurrentUserId();

  const user = await prisma.user.findUnique({
    where: {
      id: currentUserId,
    },
    include: {
      attendance: {
        where: { workDate: today },
        take: 1,
      },
      groupMembers: {
        take: 1,
        include: {
          group: {
            include: {
              members: true,
              foodOptions: {
                where: { isActive: true },
                include: {
                  hiddenByUsers: {
                    where: { userId: currentUserId },
                    select: { id: true },
                  },
                },
              },
              foodSpins: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: {
                  selectedFoodOption: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const [attendanceHistory, aiFeed] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where: {
        userId: user.id,
        workDate: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      orderBy: { workDate: "desc" },
    }),
    getTodayAIDailyFeed(),
  ]);

  const attendance = user.attendance[0] ?? null;
  const membership = user.groupMembers[0] ?? null;
  const group = membership?.group ?? null;
  const latestSpin = group?.foodSpins[0] ?? null;
  const visibleFoodOptions =
    group?.foodOptions.filter((option) => option.hiddenByUsers.length === 0) ?? [];

  return {
    user: {
      nickname: user.nickname,
      workStartTime: user.workStartTime,
      workEndTime: user.workEndTime,
      requiredWorkMinutes: REQUIRED_WORK_MINUTES,
    },
    todayLabel: formatDateLabel(today),
    countdown: getCountdownSummary({
      clockInAt: attendance?.clockInAt ?? null,
      clockOutAt: attendance?.clockOutAt ?? null,
      workStartTime: user.workStartTime,
      workEndTime: user.workEndTime,
    }),
    attendance: getAttendanceSummary({
      status: attendance?.clockOutAt
        ? "FINISHED"
        : attendance?.clockInAt
          ? "WORKING"
          : "NOT_STARTED",
      clockInAt: attendance?.clockInAt ?? null,
      clockOutAt: attendance?.clockOutAt ?? null,
      workMinutes: attendance?.workMinutes ?? null,
      overtimeMins: attendance?.overtimeMins ?? null,
    }),
    attendanceCalendar: {
      monthLabel: formatMonthLabel(today),
      minMonthLabel: formatMonthLabel(addAppMonths(monthStart, -3)),
      maxMonthLabel: formatMonthLabel(addAppMonths(monthStart, 1)),
      records: attendanceHistory.map((record) => ({
        id: record.id,
        monthLabel: formatMonthLabel(record.workDate),
        dateLabel: formatShortDate(record.workDate),
        dayOfMonth: Number(getAppDateParts(record.workDate).day),
        clockInLabel: formatTime(record.clockInAt),
        clockOutLabel: formatTime(record.clockOutAt),
        workDurationLabel: formatMinutes(record.workMinutes),
        overtimeLabel: formatMinutes(record.overtimeMins),
        status: record.clockOutAt ? "已下班" : record.clockInAt ? "进行中" : "未打卡",
      })),
    },
    aiFeed,
    group: group
      ? {
          name: group.name,
          inviteCode: group.inviteCode,
          memberCount: group.members.length,
          activeFoodCount: group.foodOptions.length,
          latestSpinResult: latestSpin?.selectedFoodOption.name ?? "还没转过",
          activeFoodPreview: buildDailyFoodPreview(visibleFoodOptions, today, 8),
          activeFoods: visibleFoodOptions.map((option) => formatFoodOptionLabel(option)),
          activeFoodEntries: group.foodOptions.map((option) => ({
            id: option.id,
            name: option.name,
            label: formatFoodOptionLabel(option),
            restaurantName: option.restaurantName,
            dishName: option.dishName,
            referencePrice: option.referencePrice,
            isHealthy: option.isHealthy,
            isFastDelivery: option.isFastDelivery,
            isHiddenForMe: option.hiddenByUsers.length > 0,
          })),
        }
      : null,
  };
}
