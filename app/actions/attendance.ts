"use server";

import { AttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireCurrentUserId } from "@/lib/auth";
import { startOfAppDay } from "@/lib/app-timezone";
import { prisma } from "@/lib/prisma";

const REQUIRED_WORK_MINUTES = 9.5 * 60;

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export async function clockInAction() {
  const userId = await requireCurrentUserId();

  const today = startOfAppDay();
  const now = new Date();
  const existing = await prisma.attendanceRecord.findUnique({
    where: {
      userId_workDate: {
        userId,
        workDate: today,
      },
    },
  });

  const earliestClockIn =
    existing?.clockInAt && existing.clockInAt.getTime() < now.getTime()
      ? existing.clockInAt
      : now;

  await prisma.attendanceRecord.upsert({
    where: {
      userId_workDate: {
        userId,
        workDate: today,
      },
    },
    update: {
      clockInAt: earliestClockIn,
      workMinutes:
        existing?.clockOutAt
          ? Math.max(
              0,
              Math.floor((existing.clockOutAt.getTime() - earliestClockIn.getTime()) / 60000),
            )
          : null,
      overtimeMins:
        existing?.clockOutAt
          ? Math.max(
              0,
              Math.floor(
                (existing.clockOutAt.getTime() -
                  addMinutes(earliestClockIn, REQUIRED_WORK_MINUTES).getTime()) /
                  60000,
              ),
            )
          : 0,
      status: existing?.clockOutAt ? AttendanceStatus.FINISHED : AttendanceStatus.WORKING,
    },
    create: {
      userId,
      workDate: today,
      clockInAt: earliestClockIn,
      clockOutAt: null,
      workMinutes: null,
      overtimeMins: 0,
      status: AttendanceStatus.WORKING,
    },
  });

  revalidatePath("/");
}

export async function clockOutAction() {
  const userId = await requireCurrentUserId();

  const today = startOfAppDay();
  const now = new Date();

  const attendance = await prisma.attendanceRecord.findUnique({
    where: {
      userId_workDate: {
        userId,
        workDate: today,
      },
    },
  });

  if (!attendance?.clockInAt) {
    throw new Error("Please clock in before clocking out.");
  }

  const effectiveClockOut =
    attendance.clockOutAt && attendance.clockOutAt.getTime() > now.getTime()
      ? attendance.clockOutAt
      : now;

  const workedMinutes = Math.max(
    0,
    Math.floor((effectiveClockOut.getTime() - attendance.clockInAt.getTime()) / 60000),
  );

  const expectedClockOutAt = addMinutes(attendance.clockInAt, REQUIRED_WORK_MINUTES);
  const overtimeMinutes = Math.max(
    0,
    Math.floor((effectiveClockOut.getTime() - expectedClockOutAt.getTime()) / 60000),
  );

  await prisma.attendanceRecord.update({
    where: {
      userId_workDate: {
        userId,
        workDate: today,
      },
    },
    data: {
      clockOutAt: effectiveClockOut,
      workMinutes: workedMinutes,
      overtimeMins: overtimeMinutes,
      status: AttendanceStatus.FINISHED,
    },
  });

  revalidatePath("/");
}
