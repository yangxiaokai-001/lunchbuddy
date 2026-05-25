import { createHash } from "node:crypto";

import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "fandazi_user";

export function hashPassword(password: string) {
  return createHash("sha256").update(`fandazi:${password}`).digest("hex");
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("请先登录。");
  }

  return userId;
}

export async function setSessionUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getViewerState() {
  const userId = await getCurrentUserId();

  const [userCount, groupPreview, viewer] = await Promise.all([
    prisma.user.count(),
    prisma.group.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        inviteCode: true,
        name: true,
      },
    }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            nickname: true,
            groupMembers: {
              take: 1,
              select: {
                groupId: true,
                group: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    hasAnyUser: userCount > 0,
    sampleInviteCode: groupPreview?.inviteCode ?? null,
    sampleGroupName: groupPreview?.name ?? null,
    viewer: viewer
      ? {
          id: viewer.id,
          username: viewer.username,
          nickname: viewer.nickname,
          hasGroup: viewer.groupMembers.length > 0,
          groupName: viewer.groupMembers[0]?.group.name ?? null,
        }
      : null,
  };
}
