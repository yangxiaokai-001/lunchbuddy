"use server";

import { randomBytes } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { clearSessionUser, getCurrentUserId, hashPassword, setSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
};

function readValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizeNickname(nickname: string) {
  return nickname.trim();
}

function isValidUsername(username: string) {
  return /^[a-z0-9]+$/.test(username);
}

function revalidateGroupViews() {
  revalidatePath("/");
  revalidatePath("/food-pool");
}

async function ensureUserHasNoGroup(userId: string) {
  const existingMembership = await prisma.groupMember.findFirst({
    where: { userId },
    include: {
      group: {
        select: {
          name: true,
        },
      },
    },
  });

  if (existingMembership) {
    return {
      status: "error" as const,
      message: `你已经在「${existingMembership.group.name}」里了。`,
    };
  }

  return null;
}

async function generateInviteCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = randomBytes(3).toString("hex").toUpperCase();
    const existing = await prisma.group.findUnique({
      where: { inviteCode: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("邀请码生成失败，请再试一次。");
}

async function createOwnedGroupForUser(userId: string, groupName: string) {
  const inviteCode = await generateInviteCode();

  return prisma.group.create({
    data: {
      name: groupName,
      inviteCode,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });
}

async function removeMembershipFromCurrentGroup(userId: string) {
  const membership = await prisma.groupMember.findFirst({
    where: { userId },
    include: {
      group: {
        include: {
          members: {
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
  });

  if (!membership) {
    return {
      status: "error" as const,
      message: "你当前还没有加入群组。",
    };
  }

  await prisma.$transaction(async (tx) => {
    const otherMembers = membership.group.members.filter((member) => member.userId !== userId);

    if (membership.role === "OWNER" || membership.group.ownerId === userId) {
      if (otherMembers.length === 0) {
        await tx.group.delete({
          where: { id: membership.groupId },
        });
        return;
      }

      const nextOwner = otherMembers[0];

      await tx.group.update({
        where: { id: membership.groupId },
        data: {
          ownerId: nextOwner.userId,
        },
      });

      await tx.groupMember.update({
        where: { id: nextOwner.id },
        data: {
          role: "OWNER",
        },
      });
    }

    await tx.groupMember.delete({
      where: { id: membership.id },
    });
  });

  return {
    status: "success" as const,
    message:
      membership.role === "OWNER" && membership.group.members.length === 1
        ? `已退出并解散「${membership.group.name}」。`
        : `已退出「${membership.group.name}」。`,
    groupId: membership.groupId,
    groupName: membership.group.name,
  };
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = normalizeUsername(readValue(formData, "username"));
  const password = readValue(formData, "password");

  if (!username || !password) {
    return {
      status: "error",
      message: "请输入用户名和密码。",
    };
  }

  const user = await prisma.user.findFirst({
    where: { username },
  });

  if (!user) {
    return {
      status: "error",
      message: "用户名或密码不对。",
    };
  }

  if (!user.passwordHash) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashPassword(password),
      },
    });
  } else if (user.passwordHash !== hashPassword(password)) {
    return {
      status: "error",
      message: "用户名或密码不对。",
    };
  }

  await setSessionUserId(user.id);
  revalidateGroupViews();

  return {
    status: "success",
    message: user.passwordHash ? "登录成功，正在进入首页。" : "首次登录完成，密码已经替你记住了。",
  };
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = normalizeUsername(readValue(formData, "username"));
  const nickname = normalizeNickname(readValue(formData, "nickname"));
  const password = readValue(formData, "password");

  if (!username || !nickname || !password) {
    return {
      status: "error",
      message: "用户名、昵称、密码都要填。",
    };
  }

  if (password.length < 4) {
    return {
      status: "error",
      message: "密码至少 4 位，先简单一点就行。",
    };
  }

  if (!isValidUsername(username)) {
    return {
      status: "error",
      message: "用户名只能用英文和数字。",
    };
  }

  const existingUser = await prisma.user.findFirst({
    where: { username },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "这个用户名已经有人用了。用户名不区分大小写，换一个就行。",
    };
  }

  const user = await prisma.user.create({
    data: {
      username,
      nickname,
      passwordHash: hashPassword(password),
      workStartTime: "09:30",
      workEndTime: "10:00",
      timezone: "Asia/Shanghai",
    },
  });

  await setSessionUserId(user.id);
  revalidateGroupViews();

  return {
    status: "success",
    message: "注册成功，接下来加入或创建一个群组。",
  };
}

export async function joinGroupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: "error",
      message: "请先登录。",
    };
  }

  const inviteCode = readValue(formData, "inviteCode").toUpperCase();

  if (!inviteCode) {
    return {
      status: "error",
      message: "请输入邀请码。",
    };
  }

  const membershipError = await ensureUserHasNoGroup(userId);
  if (membershipError) {
    return membershipError;
  }

  const group = await prisma.group.findUnique({
    where: { inviteCode },
    select: {
      id: true,
      name: true,
    },
  });

  if (!group) {
    return {
      status: "error",
      message: "邀请码不对，再确认一下。",
    };
  }

  await prisma.groupMember.create({
    data: {
      userId,
      groupId: group.id,
    },
  });

  revalidateGroupViews();

  return {
    status: "success",
    message: `已加入「${group.name}」。`,
  };
}

export async function createGroupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: "error",
      message: "请先登录。",
    };
  }

  const groupName = readValue(formData, "groupName");

  if (!groupName) {
    return {
      status: "error",
      message: "先给群组起个名字吧。",
    };
  }

  const membershipError = await ensureUserHasNoGroup(userId);
  if (membershipError) {
    return membershipError;
  }

  const group = await createOwnedGroupForUser(userId, groupName);

  revalidateGroupViews();

  return {
    status: "success",
    message: `已创建「${group.name}」，邀请码是 ${group.inviteCode}。`,
  };
}

export async function createNewGroupFromCurrentAction(groupNameInput: string): Promise<AuthFormState> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: "error",
      message: "请先登录。",
    };
  }

  const groupName = groupNameInput.trim();

  if (!groupName) {
    return {
      status: "error",
      message: "先给新群组起个名字吧。",
    };
  }

  const currentMembership = await prisma.groupMember.findFirst({
    where: { userId },
    select: {
      group: {
        select: {
          name: true,
        },
      },
    },
  });

  if (currentMembership) {
    const leaveResult = await removeMembershipFromCurrentGroup(userId);

    if (leaveResult.status === "error") {
      return leaveResult;
    }
  }

  const group = await createOwnedGroupForUser(userId, groupName);
  revalidateGroupViews();

  return {
    status: "success",
    message: currentMembership
      ? `已新建「${group.name}」，并切换出原来的群组。邀请码是 ${group.inviteCode}。`
      : `已创建「${group.name}」，邀请码是 ${group.inviteCode}。`,
  };
}

export async function signOutAction() {
  await clearSessionUser();
  revalidateGroupViews();
  redirect("/");
}

export async function leaveGroupAction(): Promise<AuthFormState> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: "error",
      message: "请先登录。",
    };
  }

  const result = await removeMembershipFromCurrentGroup(userId);

  if (result.status === "error") {
    return result;
  }

  revalidateGroupViews();

  return {
    status: "success",
    message: result.message,
  };
}

export async function switchGroupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      status: "error",
      message: "请先登录。",
    };
  }

  const inviteCode = readValue(formData, "inviteCode").toUpperCase();

  if (!inviteCode) {
    return {
      status: "error",
      message: "请输入新群组的邀请码。",
    };
  }

  const currentMembership = await prisma.groupMember.findFirst({
    where: { userId },
    select: {
      groupId: true,
      group: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!currentMembership) {
    return {
      status: "error",
      message: "你当前还没有加入群组。",
    };
  }

  const targetGroup = await prisma.group.findUnique({
    where: { inviteCode },
    select: {
      id: true,
      name: true,
    },
  });

  if (!targetGroup) {
    return {
      status: "error",
      message: "这个邀请码不对，再确认一下。",
    };
  }

  if (targetGroup.id === currentMembership.groupId) {
    return {
      status: "error",
      message: `你已经在「${targetGroup.name}」里了。`,
    };
  }

  const leaveResult = await removeMembershipFromCurrentGroup(userId);

  if (leaveResult.status === "error") {
    return leaveResult;
  }

  await prisma.groupMember.create({
    data: {
      userId,
      groupId: targetGroup.id,
    },
  });

  revalidateGroupViews();

  return {
    status: "success",
    message: `已从「${currentMembership.group.name}」切换到「${targetGroup.name}」。`,
  };
}

export async function switchGroupByInviteCodeAction(inviteCodeInput: string): Promise<AuthFormState> {
  const formData = new FormData();
  formData.set("inviteCode", inviteCodeInput);
  return switchGroupAction(
    {
      status: "idle",
      message: null,
    },
    formData,
  );
}
