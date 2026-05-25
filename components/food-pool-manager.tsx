"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  PencilLine,
  Plus,
  Save,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  addFoodOptionAction,
  removeFoodOptionAction,
  toggleFoodOptionHiddenAction,
  updateFoodOptionAction,
} from "@/app/actions/group";
import type { FoodOptionDraft } from "@/app/actions/group";

type FoodPoolManagerProps = {
  group: {
    name: string;
    activeFoodCount: number;
    activeFoodEntries: Array<{
      id: string;
      name: string;
      label: string;
      restaurantName: string | null;
      dishName: string | null;
      referencePrice: number | null;
      isHealthy: boolean;
      isFastDelivery: boolean;
      isHiddenForMe: boolean;
    }>;
  };
};

const emptyDraft: FoodOptionDraft = {
  restaurantName: "",
  dishName: "",
  referencePrice: "",
  isHealthy: false,
  isFastDelivery: false,
};

const PAGE_SIZE = 10;

export function FoodPoolManager({ group }: FoodPoolManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [newFoodDraft, setNewFoodDraft] = useState<FoodOptionDraft>(emptyDraft);
  const [editingFoodDraft, setEditingFoodDraft] = useState<FoodOptionDraft>(emptyDraft);
  const [foodFeedback, setFoodFeedback] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  const totalPages = Math.max(1, Math.ceil(group.activeFoodEntries.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedEntries = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
    return group.activeFoodEntries.slice(startIndex, startIndex + PAGE_SIZE);
  }, [group.activeFoodEntries, safeCurrentPage]);

  function stopEditingFood() {
    setEditingFoodId(null);
    setEditingFoodDraft(emptyDraft);
  }

  function startEditingFood(food: FoodPoolManagerProps["group"]["activeFoodEntries"][number]) {
    setEditingFoodId(food.id);
    setEditingFoodDraft({
      restaurantName: food.restaurantName ?? "",
      dishName: food.dishName ?? "",
      referencePrice: food.referencePrice ? String(food.referencePrice) : "",
      isHealthy: food.isHealthy,
      isFastDelivery: food.isFastDelivery,
    });
  }

  function handleAddFoodOption() {
    startTransition(async () => {
      const result = await addFoodOptionAction(newFoodDraft);
      setFoodFeedback(result);

      if (result.status === "success") {
        setNewFoodDraft(emptyDraft);
        router.refresh();
      }
    });
  }

  function handleRemoveFoodOption(foodOptionId: string) {
    startTransition(async () => {
      const result = await removeFoodOptionAction(foodOptionId);
      setFoodFeedback(result);

      if (result.status === "success") {
        if (editingFoodId === foodOptionId) {
          stopEditingFood();
        }
        router.refresh();
      }
    });
  }

  function handleUpdateFoodOption(foodOptionId: string) {
    startTransition(async () => {
      const result = await updateFoodOptionAction(foodOptionId, editingFoodDraft);
      setFoodFeedback(result);

      if (result.status === "success") {
        stopEditingFood();
        router.refresh();
      }
    });
  }

  function handleToggleFoodHidden(foodOptionId: string) {
    startTransition(async () => {
      const result = await toggleFoodOptionHiddenAction(foodOptionId);
      setFoodFeedback(result);

      if (result.status === "success") {
        router.refresh();
      }
    });
  }

  return (
    <section className="pixel-panel p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{group.name}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <span className="pixel-chip bg-[#fff2d2] px-3 py-1 font-semibold text-[var(--foreground)]">
            {group.activeFoodCount} 家候选
          </span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-sm border-[3px] border-[var(--line)] bg-[#fffaf2] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            <Plus className="h-3.5 w-3.5" />
            新增到外卖池
          </div>

          <div className="grid gap-3">
            <input
              value={newFoodDraft.restaurantName}
              onChange={(event) =>
                setNewFoodDraft((current) => ({
                  ...current,
                  restaurantName: event.target.value,
                }))
              }
              placeholder="店名，比如：老乡鸡"
              className="min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
            />
            <div className="grid gap-2 sm:grid-cols-[1fr_120px] xl:grid-cols-1">
              <input
                value={newFoodDraft.dishName}
                onChange={(event) =>
                  setNewFoodDraft((current) => ({
                    ...current,
                    dishName: event.target.value,
                  }))
                }
                placeholder="菜品名，比如：肥牛饭"
                className="min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
              <input
                value={newFoodDraft.referencePrice}
                onChange={(event) =>
                  setNewFoodDraft((current) => ({
                    ...current,
                    referencePrice: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddFoodOption();
                  }
                }}
                inputMode="numeric"
                placeholder="参考价"
                className="min-w-0 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setNewFoodDraft((current) => ({
                    ...current,
                    isHealthy: !current.isHealthy,
                  }))
                }
                className={`pixel-button px-3 py-2 text-sm ${
                  newFoodDraft.isHealthy ? "bg-[#dff4e4]" : "bg-white"
                }`}
              >
                健康标签
              </button>
              <button
                type="button"
                onClick={() =>
                  setNewFoodDraft((current) => ({
                    ...current,
                    isFastDelivery: !current.isFastDelivery,
                  }))
                }
                className={`pixel-button px-3 py-2 text-sm ${
                  newFoodDraft.isFastDelivery ? "bg-[#fff1d6]" : "bg-white"
                }`}
              >
                送得快
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddFoodOption}
              disabled={isPending}
              className="pixel-button flex items-center justify-center gap-2 bg-[var(--accent)] px-3 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              增加到外卖池
            </button>
          </div>

          {foodFeedback ? (
            <p
              className={`mt-4 text-sm ${
                foodFeedback.status === "error" ? "text-[#b94b4b]" : "text-[var(--muted)]"
              }`}
            >
              {foodFeedback.message}
            </p>
          ) : null}
        </div>

        <div className="rounded-sm border-[3px] border-[var(--line)] bg-[#fff8ef] p-4">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            全部候选
          </div>

          <div className="space-y-3">
            {pagedEntries.map((food) => {
              const isEditing = editingFoodId === food.id;

              return (
                <div
                  key={food.id}
                  className={`rounded-2xl border border-black/10 px-4 py-4 ${
                    food.isHiddenForMe ? "bg-[#f8f8f8]" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="min-w-0 truncate text-base font-semibold">{food.label}</div>
                        {food.referencePrice ? (
                          <span className="pixel-chip inline-flex items-center bg-[#fff7eb] px-1.5 py-0.5 text-[11px] leading-none">
                            ¥{food.referencePrice}
                          </span>
                        ) : null}
                        {food.isHealthy ? (
                          <span className="pixel-chip inline-flex items-center bg-[#e5f6e9] px-1.5 py-0.5 text-[11px] leading-none">
                            健康
                          </span>
                        ) : null}
                        {food.isFastDelivery ? (
                          <span className="pixel-chip inline-flex items-center bg-[#fff1d6] px-1.5 py-0.5 text-[11px] leading-none">
                            送得快
                          </span>
                        ) : null}
                        {food.isHiddenForMe ? (
                          <span className="pixel-chip inline-flex items-center bg-[#efefef] px-1.5 py-0.5 text-[11px] leading-none">
                            已对我屏蔽
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingFood(food)}
                        disabled={isPending}
                        className="pixel-button flex items-center justify-center bg-[#fff1d6] p-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`编辑 ${food.label}`}
                      >
                        <PencilLine className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFoodHidden(food.id)}
                        disabled={isPending}
                        className="pixel-button flex items-center justify-center bg-[#f6f6f6] p-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={food.isHiddenForMe ? `恢复 ${food.label}` : `屏蔽 ${food.label}`}
                      >
                        {food.isHiddenForMe ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFoodOption(food.id)}
                        disabled={isPending}
                        className="pixel-button flex items-center justify-center bg-[#ffe3d8] p-2 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`删除 ${food.label}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-3 border-t border-black/10 pt-4">
                      <input
                        value={editingFoodDraft.restaurantName}
                        onChange={(event) =>
                          setEditingFoodDraft((current) => ({
                            ...current,
                            restaurantName: event.target.value,
                          }))
                        }
                        placeholder="店名"
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                      />
                      <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                        <input
                          value={editingFoodDraft.dishName}
                          onChange={(event) =>
                            setEditingFoodDraft((current) => ({
                              ...current,
                              dishName: event.target.value,
                            }))
                          }
                          placeholder="菜品名"
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                        <input
                          value={editingFoodDraft.referencePrice}
                          onChange={(event) =>
                            setEditingFoodDraft((current) => ({
                              ...current,
                              referencePrice: event.target.value,
                            }))
                          }
                          placeholder="参考价"
                          inputMode="numeric"
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingFoodDraft((current) => ({
                              ...current,
                              isHealthy: !current.isHealthy,
                            }))
                          }
                          className={`pixel-button px-3 py-2 text-sm ${
                            editingFoodDraft.isHealthy ? "bg-[#dff4e4]" : "bg-white"
                          }`}
                        >
                          健康标签
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingFoodDraft((current) => ({
                              ...current,
                              isFastDelivery: !current.isFastDelivery,
                            }))
                          }
                          className={`pixel-button px-3 py-2 text-sm ${
                            editingFoodDraft.isFastDelivery ? "bg-[#fff1d6]" : "bg-white"
                          }`}
                        >
                          送得快
                        </button>
                        <div className="ml-auto flex gap-2">
                          <button
                            type="button"
                            onClick={stopEditingFood}
                            className="pixel-button bg-white px-3 py-2 text-sm"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateFoodOption(food.id)}
                            className="pixel-button flex items-center gap-2 bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white"
                          >
                            <Save className="h-4 w-4" />
                            保存
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {group.activeFoodEntries.length > PAGE_SIZE ? (
            <div className="mt-5 flex items-center justify-between border-t border-black/10 pt-4">
              <p className="text-sm text-[var(--muted)]">
                第 {safeCurrentPage} / {totalPages} 页
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, safeCurrentPage - 1))}
                  disabled={safeCurrentPage === 1}
                  className="pixel-button flex items-center gap-2 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, safeCurrentPage + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="pixel-button flex items-center gap-2 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
