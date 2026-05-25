/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require("node:crypto");
const { PrismaClient, GroupMemberRole, AttendanceStatus } = require("@prisma/client");

const REQUIRED_WORK_MINUTES = 9.5 * 60;
const DEFAULT_PASSWORD_HASH = createHash("sha256")
  .update(`fandazi:${process.env.SEED_DEMO_PASSWORD || "1234"}`)
  .digest("hex");

const prisma = new PrismaClient();

async function main() {
  const demoUsername = process.env.SEED_DEMO_USERNAME || "demo001";
  const demoNickname = process.env.SEED_DEMO_NICKNAME || "饭搭子演示账号";

  const user = await prisma.user.upsert({
    where: { email: "local@workday.test" },
    update: {
      username: demoUsername,
      nickname: demoNickname,
      passwordHash: DEFAULT_PASSWORD_HASH,
      workStartTime: "09:30",
      workEndTime: "10:00",
      timezone: "Asia/Shanghai",
    },
    create: {
      email: "local@workday.test",
      username: demoUsername,
      nickname: demoNickname,
      passwordHash: DEFAULT_PASSWORD_HASH,
      workStartTime: "09:30",
      workEndTime: "10:00",
      timezone: "Asia/Shanghai",
    },
  });

  const group = await prisma.group.upsert({
    where: { inviteCode: "MOO123" },
    update: {},
    create: {
      name: "前端摸鱼搭子",
      inviteCode: "MOO123",
      ownerId: user.id,
    },
  });

  await prisma.groupMember.upsert({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: user.id,
      },
    },
    update: { role: GroupMemberRole.OWNER },
    create: {
      groupId: group.id,
      userId: user.id,
      role: GroupMemberRole.OWNER,
    },
  });

  const foods = [
    {
      name: "老乡鸡 · 黄焖鸡米饭",
      restaurantName: "老乡鸡",
      dishName: "黄焖鸡米饭",
      referencePrice: 26,
      isHealthy: false,
      isFastDelivery: true,
      category: "米饭",
    },
    {
      name: "杨国福 · 麻辣烫",
      restaurantName: "杨国福",
      dishName: "麻辣烫",
      referencePrice: 30,
      isHealthy: false,
      isFastDelivery: true,
      category: "热汤",
    },
    {
      name: "Wagas · 轻食沙拉",
      restaurantName: "Wagas",
      dishName: "轻食沙拉",
      referencePrice: 38,
      isHealthy: true,
      isFastDelivery: false,
      category: "轻食",
    },
    {
      name: "和府捞面 · 牛肉面",
      restaurantName: "和府捞面",
      dishName: "牛肉面",
      referencePrice: 32,
      isHealthy: false,
      isFastDelivery: false,
      category: "面食",
    },
  ];

  for (const food of foods) {
    await prisma.foodOption.upsert({
      where: {
        id: `${group.id}-${food.name}`,
      },
      update: {},
      create: {
        id: `${group.id}-${food.name}`,
        groupId: group.id,
        createdBy: user.id,
        isActive: true,
        ...food,
      },
    });
  }

  const selectedFood = await prisma.foodOption.findUnique({
    where: {
      id: `${group.id}-老乡鸡 · 黄焖鸡米饭`,
    },
  });

  const yesterday = new Date();
  yesterday.setHours(0, 0, 0, 0);
  yesterday.setDate(yesterday.getDate() - 1);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendanceRecord.deleteMany({
    where: {
      userId: user.id,
      workDate: today,
    },
  });

  const clockIn = new Date(yesterday);
  clockIn.setHours(9, 58, 0, 0);

  const clockOut = new Date(yesterday);
  clockOut.setTime(clockIn.getTime() + (REQUIRED_WORK_MINUTES + 3) * 60 * 1000);

  await prisma.attendanceRecord.upsert({
    where: {
      userId_workDate: {
        userId: user.id,
        workDate: yesterday,
      },
    },
    update: {
      clockInAt: clockIn,
      clockOutAt: clockOut,
      workMinutes: REQUIRED_WORK_MINUTES + 3,
      overtimeMins: 3,
      status: AttendanceStatus.FINISHED,
    },
    create: {
      userId: user.id,
      workDate: yesterday,
      clockInAt: clockIn,
      clockOutAt: clockOut,
      workMinutes: REQUIRED_WORK_MINUTES + 3,
      overtimeMins: 3,
      status: AttendanceStatus.FINISHED,
    },
  });

  const sampleDays = [
    { daysAgo: 2, clockIn: [9, 46], extraMinutes: 0 },
    { daysAgo: 3, clockIn: [9, 59], extraMinutes: 18 },
    { daysAgo: 4, clockIn: [9, 52], extraMinutes: 6 },
  ];

  for (const sample of sampleDays) {
    const workDate = new Date();
    workDate.setHours(0, 0, 0, 0);
    workDate.setDate(workDate.getDate() - sample.daysAgo);

    const sampleClockIn = new Date(workDate);
    sampleClockIn.setHours(sample.clockIn[0], sample.clockIn[1], 0, 0);

    const sampleClockOut = new Date(sampleClockIn);
    sampleClockOut.setTime(
      sampleClockIn.getTime() +
        (REQUIRED_WORK_MINUTES + sample.extraMinutes) * 60 * 1000,
    );

    await prisma.attendanceRecord.upsert({
      where: {
        userId_workDate: {
          userId: user.id,
          workDate,
        },
      },
      update: {
        clockInAt: sampleClockIn,
        clockOutAt: sampleClockOut,
        workMinutes: REQUIRED_WORK_MINUTES + sample.extraMinutes,
        overtimeMins: sample.extraMinutes,
        status: AttendanceStatus.FINISHED,
      },
      create: {
        userId: user.id,
        workDate,
        clockInAt: sampleClockIn,
        clockOutAt: sampleClockOut,
        workMinutes: REQUIRED_WORK_MINUTES + sample.extraMinutes,
        overtimeMins: sample.extraMinutes,
        status: AttendanceStatus.FINISHED,
      },
    });
  }

  if (selectedFood) {
    await prisma.foodSpin.upsert({
      where: {
        id: `${group.id}-latest-spin`,
      },
      update: {
        selectedFoodOptionId: selectedFood.id,
        startedBy: user.id,
      },
      create: {
        id: `${group.id}-latest-spin`,
        groupId: group.id,
        selectedFoodOptionId: selectedFood.id,
        startedBy: user.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
