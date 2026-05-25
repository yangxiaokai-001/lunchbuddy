"use server";

import { revalidatePath } from "next/cache";

import { requireCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type FoodOptionActionResult = {
  status: "success" | "error";
  message: string;
};

export type FoodOptionDraft = {
  restaurantName: string;
  dishName: string;
  referencePrice: string;
  isHealthy: boolean;
  isFastDelivery: boolean;
};

function buildFoodOptionLabel(input: {
  name: string;
  restaurantName: string | null;
  dishName: string | null;
}) {
  if (input.restaurantName && input.dishName) {
    return `${input.restaurantName} · ${input.dishName}`;
  }

  return input.name;
}

function revalidateFoodPoolViews() {
  revalidatePath("/");
  revalidatePath("/food-pool");
}

async function getCurrentMembership(userId: string) {
  return prisma.groupMember.findFirst({
    where: { userId },
    select: {
      role: true,
      groupId: true,
      group: {
        select: {
          name: true,
          foodOptions: {
            select: {
              id: true,
              name: true,
              restaurantName: true,
              dishName: true,
              referencePrice: true,
              isHealthy: true,
              isFastDelivery: true,
              isActive: true,
              hiddenByUsers: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });
}

export async function addFoodOptionAction(input: FoodOptionDraft): Promise<FoodOptionActionResult> {
  const userId = await requireCurrentUserId();
  const restaurantName = input.restaurantName.trim();
  const dishName = input.dishName.trim();
  const priceText = input.referencePrice.trim();

  if (!restaurantName || !dishName) {
    return {
      status: "error",
      message: "店名和菜品名都要填。",
    };
  }

  const referencePrice = Number.parseInt(priceText, 10);

  if (!priceText || Number.isNaN(referencePrice) || referencePrice <= 0) {
    return {
      status: "error",
      message: "参考价格填一个大于 0 的整数吧。",
    };
  }

  const normalizedLabel = `${restaurantName} · ${dishName}`;

  const membership = await getCurrentMembership(userId);

  if (!membership?.groupId) {
    return {
      status: "error",
      message: "你还没有加入群组。",
    };
  }

  const existingOption = membership.group.foodOptions.find(
    (option) =>
      buildFoodOptionLabel(option).trim().toLowerCase() === normalizedLabel.toLowerCase(),
  );

  if (existingOption?.isActive) {
    return {
      status: "error",
      message: "这家已经在外卖池里了。",
    };
  }

  if (existingOption) {
    await prisma.foodOption.update({
      where: { id: existingOption.id },
      data: {
        name: normalizedLabel,
        restaurantName,
        dishName,
        referencePrice,
        isHealthy: input.isHealthy,
        isFastDelivery: input.isFastDelivery,
        isActive: true,
      },
    });
  } else {
    await prisma.foodOption.create({
      data: {
        groupId: membership.groupId,
        name: normalizedLabel,
        restaurantName,
        dishName,
        referencePrice,
        isHealthy: input.isHealthy,
        isFastDelivery: input.isFastDelivery,
        createdBy: userId,
        isActive: true,
      },
    });
  }

  revalidateFoodPoolViews();

  return {
    status: "success",
    message: `已把「${normalizedLabel}」加入外卖池。`,
  };
}

export async function removeFoodOptionAction(foodOptionId: string): Promise<FoodOptionActionResult> {
  const userId = await requireCurrentUserId();
  const membership = await getCurrentMembership(userId);

  if (!membership?.groupId) {
    return {
      status: "error",
      message: "你还没有加入群组。",
    };
  }

  const targetOption = membership.group.foodOptions.find((option) => option.id === foodOptionId);

  if (!targetOption || !targetOption.isActive) {
    return {
      status: "error",
      message: "这家已经不在外卖池里了。",
    };
  }

  await prisma.foodOption.update({
    where: { id: foodOptionId },
    data: {
      isActive: false,
    },
  });

  revalidateFoodPoolViews();

  return {
    status: "success",
    message: `已把「${targetOption.name}」移出外卖池。`,
  };
}

export async function updateFoodOptionAction(
  foodOptionId: string,
  input: FoodOptionDraft,
): Promise<FoodOptionActionResult> {
  const userId = await requireCurrentUserId();
  const restaurantName = input.restaurantName.trim();
  const dishName = input.dishName.trim();
  const priceText = input.referencePrice.trim();

  if (!restaurantName || !dishName) {
    return {
      status: "error",
      message: "店名和菜品名都要填。",
    };
  }

  const referencePrice = Number.parseInt(priceText, 10);

  if (!priceText || Number.isNaN(referencePrice) || referencePrice <= 0) {
    return {
      status: "error",
      message: "参考价格填一个大于 0 的整数吧。",
    };
  }

  const membership = await getCurrentMembership(userId);

  if (!membership?.groupId) {
    return {
      status: "error",
      message: "你还没有加入群组。",
    };
  }

  const targetOption = membership.group.foodOptions.find(
    (option) => option.id === foodOptionId && option.isActive,
  );

  if (!targetOption) {
    return {
      status: "error",
      message: "这条外卖候选已经不存在了。",
    };
  }

  const normalizedLabel = `${restaurantName} · ${dishName}`;
  const duplicateOption = membership.group.foodOptions.find(
    (option) =>
      option.id !== foodOptionId &&
      option.isActive &&
      buildFoodOptionLabel(option).trim().toLowerCase() === normalizedLabel.toLowerCase(),
  );

  if (duplicateOption) {
    return {
      status: "error",
      message: "外卖池里已经有同样的店名和菜品组合了。",
    };
  }

  await prisma.foodOption.update({
    where: { id: foodOptionId },
    data: {
      name: normalizedLabel,
      restaurantName,
      dishName,
      referencePrice,
      isHealthy: input.isHealthy,
      isFastDelivery: input.isFastDelivery,
    },
  });

  revalidateFoodPoolViews();

  return {
    status: "success",
    message: `已更新「${normalizedLabel}」。`,
  };
}

export async function toggleFoodOptionHiddenAction(
  foodOptionId: string,
): Promise<FoodOptionActionResult> {
  const userId = await requireCurrentUserId();
  const membership = await getCurrentMembership(userId);

  if (!membership?.groupId) {
    return {
      status: "error",
      message: "你还没有加入群组。",
    };
  }

  const targetOption = membership.group.foodOptions.find(
    (option) => option.id === foodOptionId && option.isActive,
  );

  if (!targetOption) {
    return {
      status: "error",
      message: "这条外卖候选已经不存在了。",
    };
  }

  const hiddenEntry = targetOption.hiddenByUsers[0] ?? null;

  if (hiddenEntry) {
    await prisma.hiddenFoodOption.delete({
      where: { id: hiddenEntry.id },
    });

    revalidateFoodPoolViews();

    return {
      status: "success",
      message: `已恢复「${buildFoodOptionLabel(targetOption)}」的显示。`,
    };
  }

  await prisma.hiddenFoodOption.create({
    data: {
      userId,
      foodOptionId,
    },
  });

  revalidateFoodPoolViews();

  return {
    status: "success",
    message: `已对你屏蔽「${buildFoodOptionLabel(targetOption)}」。`,
  };
}
