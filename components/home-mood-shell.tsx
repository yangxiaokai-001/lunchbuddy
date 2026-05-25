"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from "lucide-react";

import {
  createNewGroupFromCurrentAction,
  leaveGroupAction,
  switchGroupByInviteCodeAction,
} from "@/app/actions/auth";
import { clockInAction, clockOutAction } from "@/app/actions/attendance";
import { PixelWorkBuddy } from "@/components/pixel-work-buddy";

const moodOptions = ["干劲满满", "普通营业", "累了", "快下班吧"] as const;
const APP_TIMEZONE = "Asia/Shanghai";

type MoodOption = (typeof moodOptions)[number];

function splitTakeoutLabel(label: string | null) {
  if (!label) {
    return {
      restaurantName: "等你来开",
      dishName: "",
      isSingleLine: true,
    };
  }

  const [restaurantName, dishName] = label.split("·").map((item) => item.trim());

  if (!dishName) {
    return {
      restaurantName: label,
      dishName: "",
      isSingleLine: true,
    };
  }

  return {
    restaurantName,
    dishName,
    isSingleLine: false,
  };
}

function formatCountdownLabel(targetAtIso: string) {
  const target = new Date(targetAtIso);
  const diffMs = Math.max(0, target.getTime() - Date.now());
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} 小时 ${minutes} 分钟`;
}

function buildCalendarDays(monthLabel: string) {
  const [year, month] = monthLabel.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayIndex = new Date(year, month - 1, 1).getDay();
  const cells: Array<{ day: number | null; key: string }> = [];

  for (let i = 0; i < firstDayIndex; i += 1) {
    cells.push({ day: null, key: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, key: `day-${day}` });
  }

  return cells;
}

function shiftMonthLabel(monthLabel: string, delta: number) {
  const [year, month] = monthLabel.split("-").map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${`${shifted.getMonth() + 1}`.padStart(2, "0")}`;
}

function formatMonthTitle(monthLabel: string) {
  const [year, month] = monthLabel.split("-").map(Number);
  return `${year} 年 ${month} 月`;
}

function getTodayMeta() {
  const today = new Date();
  return {
    monthLabel: `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}`,
    dayOfMonth: today.getDate(),
  };
}

function formatFeedTimeLabel(value: string | null) {
  if (!value) {
    return "刚刚";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: APP_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

type HomeMoodShellProps = {
  todayLabel: string;
  countdownLabel: string;
  countdownValue: string;
  countdownTargetAtIso: string | null;
  attendanceStatus: "NOT_STARTED" | "WORKING" | "FINISHED";
  clockInLabel: string;
  clockInAtIso: string | null;
  clockOutAtIso: string | null;
  expectedClockOutLabel: string;
  workDurationLabel: string;
  overtimeLabel: string;
  aiFeed: {
    status: "ready" | "empty" | "error";
    message: string | null;
    issue: {
      id: string;
      title: string;
      createdAt: string | null;
      url: string;
      stories: Array<{
        id: string;
        title: string;
        summary: string;
        url: string;
      }>;
    } | null;
  };
  group: {
    name: string;
    inviteCode: string;
    memberCount: number;
    activeFoodCount: number;
    latestSpinResult: string;
    activeFoodPreview: string[];
    activeFoods: string[];
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
  } | null;
  attendanceCalendar: {
    monthLabel: string;
    minMonthLabel: string;
    maxMonthLabel: string;
    records: Array<{
      id: string;
      monthLabel: string;
      dateLabel: string;
      dayOfMonth: number;
      clockInLabel: string;
      clockOutLabel: string;
      workDurationLabel: string;
      overtimeLabel: string;
      status: string;
    }>;
  };
};

export function HomeMoodShell(props: HomeMoodShellProps) {
  const [selectedMood, setSelectedMood] = useState<MoodOption>("普通营业");
  const [countdownValue, setCountdownValue] = useState(() => props.countdownValue);
  const [workDurationLabel, setWorkDurationLabel] = useState(() => props.workDurationLabel);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(props.attendanceCalendar.monthLabel);
  const [showTakeoutModal, setShowTakeoutModal] = useState(false);
  const [takeoutPhase, setTakeoutPhase] = useState<"idle" | "shaking" | "revealed">("idle");
  const [selectedTakeout, setSelectedTakeout] = useState<string | null>(
    props.group?.latestSpinResult ?? null,
  );
  const [takeoutRequireHealthy, setTakeoutRequireHealthy] = useState(false);
  const [takeoutRequireFastDelivery, setTakeoutRequireFastDelivery] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGroupPending, startGroupTransition] = useTransition();
  const takeoutTimeoutsRef = useRef<number[]>([]);
  const [showSwitchGroupForm, setShowSwitchGroupForm] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [groupActionFeedback, setGroupActionFeedback] = useState<{
    status: "success" | "error" | "idle";
    message: string | null;
  } | null>(null);
  const [switchInviteCode, setSwitchInviteCode] = useState("");
  const [createGroupName, setCreateGroupName] = useState("");
  const router = useRouter();

  const selectedTakeoutDisplay = useMemo(
    () => splitTakeoutLabel(selectedTakeout),
    [selectedTakeout],
  );
  const todayMeta = useMemo(() => getTodayMeta(), []);
  const calendarCells = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth],
  );
  const attendanceMap = useMemo(
    () =>
      new Map(
        props.attendanceCalendar.records
          .filter((record) => record.monthLabel === calendarMonth)
          .map((record) => [record.dayOfMonth, record]),
      ),
    [calendarMonth, props.attendanceCalendar.records],
  );
  const monthsWithRecords = useMemo(
    () => new Set(props.attendanceCalendar.records.map((record) => record.monthLabel)),
    [props.attendanceCalendar.records],
  );
  const previousMonthLabel = shiftMonthLabel(calendarMonth, -1);
  const nextMonthLabel = shiftMonthLabel(calendarMonth, 1);
  const canGoPrev =
    previousMonthLabel >= props.attendanceCalendar.minMonthLabel &&
    monthsWithRecords.has(previousMonthLabel);
  const canGoNext = nextMonthLabel <= props.attendanceCalendar.maxMonthLabel;

  useEffect(() => {
    if (!props.countdownTargetAtIso) {
      return;
    }

    const targetAtIso = props.countdownTargetAtIso;

    const tick = () => {
      setCountdownValue(formatCountdownLabel(targetAtIso));
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [props.countdownTargetAtIso]);

  useEffect(() => {
    if (!props.clockInAtIso || props.clockOutAtIso) {
      return;
    }

    const clockInTime = new Date(props.clockInAtIso);

    const tick = () => {
      const diffMinutes = Math.max(
        0,
        Math.floor((Date.now() - clockInTime.getTime()) / 60000),
      );
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      setWorkDurationLabel(`${hours}h ${minutes.toString().padStart(2, "0")}m`);
    };

    tick();
    const interval = window.setInterval(tick, 30_000);
    return () => window.clearInterval(interval);
  }, [props.clockInAtIso, props.clockOutAtIso]);

  async function handleClockIn() {
    startTransition(async () => {
      await clockInAction();
      router.refresh();
    });
  }

  async function handleClockOut() {
    startTransition(async () => {
      await clockOutAction();
      router.refresh();
    });
  }

  const canClockIn = !isPending;
  const canClockOut = props.clockInAtIso !== null && !isPending;
  const takeoutPool = useMemo(
    () =>
      (props.group?.activeFoodEntries ?? []).filter(
        (food) =>
          !food.isHiddenForMe &&
          (!takeoutRequireHealthy || food.isHealthy) &&
          (!takeoutRequireFastDelivery || food.isFastDelivery),
      ),
    [props.group?.activeFoodEntries, takeoutRequireFastDelivery, takeoutRequireHealthy],
  );

  useEffect(() => {
    return () => {
      takeoutTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  function clearTakeoutTimers() {
    takeoutTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    takeoutTimeoutsRef.current = [];
  }

  function openTakeoutModal() {
    clearTakeoutTimers();
    setSelectedTakeout(null);
    setTakeoutPhase("idle");
    setShowTakeoutModal(true);
  }

  function runTakeoutReveal() {
    if (!takeoutPool.length) {
      setSelectedTakeout(null);
      setTakeoutPhase("idle");
      return;
    }

    clearTakeoutTimers();
    const picked = takeoutPool[Math.floor(Math.random() * takeoutPool.length)];
    setSelectedTakeout(picked.label);
    setShowTakeoutModal(true);
    setTakeoutPhase("shaking");

    takeoutTimeoutsRef.current.push(
      window.setTimeout(() => {
        setTakeoutPhase("revealed");
      }, 780),
    );
  }

  function closeTakeoutModal() {
    clearTakeoutTimers();
    setShowTakeoutModal(false);
    setTakeoutPhase("idle");
  }

  function handleLeaveGroup() {
    if (!props.group) {
      return;
    }

    const confirmed = window.confirm(`确定要退出「${props.group.name}」吗？`);
    if (!confirmed) {
      return;
    }

    startGroupTransition(async () => {
      const result = await leaveGroupAction();
      setGroupActionFeedback(result);

      if (result.status === "success") {
        setShowSwitchGroupForm(false);
        setSwitchInviteCode("");
        router.refresh();
      }
    });
  }

  function handleSwitchGroup() {
    startGroupTransition(async () => {
      const result = await switchGroupByInviteCodeAction(switchInviteCode);
      setGroupActionFeedback(result);

      if (result.status === "success") {
        setShowSwitchGroupForm(false);
        setShowCreateGroupForm(false);
        setSwitchInviteCode("");
        setCreateGroupName("");
        router.refresh();
      }
    });
  }

  function handleCreateGroup() {
    startGroupTransition(async () => {
      const result = await createNewGroupFromCurrentAction(createGroupName);
      setGroupActionFeedback(result);

      if (result.status === "success") {
        setShowSwitchGroupForm(false);
        setShowCreateGroupForm(false);
        setSwitchInviteCode("");
        setCreateGroupName("");
        router.refresh();
      }
    });
  }

  return (
    <>
      <section className="grid items-stretch gap-6 lg:h-[700px] lg:grid-cols-2">
        <div className="flex h-full min-h-0 flex-col gap-3.5">
          <div className="pixel-panel pixel-scene relative flex min-h-0 flex-1 overflow-hidden p-5">
            <div className="flex h-full min-h-0 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--muted)]">今日心情</span>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setSelectedMood(mood)}
                      className={`pixel-button px-2.5 py-1.5 text-xs leading-none ${
                        selectedMood === mood ? "bg-[var(--panel-strong)]" : "bg-[#fffdf9]"
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>

              <div className="aspect-[20/13] rounded-sm border-[3px] border-[var(--line)] bg-[#f9d69f] p-4 lg:h-full lg:min-h-0 lg:flex-1 lg:aspect-auto">
                <PixelWorkBuddy mood={selectedMood} />
              </div>
            </div>
          </div>

          <section className="pixel-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">打卡</h3>
                <span className="text-[11px] text-[var(--muted)]">tz-fix-v3</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCalendarMonth(props.attendanceCalendar.monthLabel);
                  setShowCalendar(true);
                }}
                className="pixel-button flex items-center justify-center bg-[#fff1d6] p-2 text-[var(--foreground)]"
                aria-label="查看打卡日历"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf2] px-3 py-2">
                <span className="text-[12px] text-[var(--muted)]">上班</span>
                <span className="text-[18px] font-semibold leading-none">{props.clockInLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf2] px-3 py-2">
                <span className="text-[12px] text-[var(--muted)]">下班</span>
                <span className="text-[18px] font-semibold leading-none">{props.expectedClockOutLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#fffaf2] px-3 py-2">
                <span className="text-[12px] text-[var(--muted)]">工时</span>
                <span className="text-[18px] font-semibold leading-none">{workDurationLabel}</span>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={!canClockIn}
                onClick={handleClockIn}
                className="pixel-button flex-1 bg-[var(--accent)] px-2 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                上班打卡
              </button>
              <button
                type="button"
                disabled={!canClockOut}
                onClick={handleClockOut}
                className="pixel-button flex-1 bg-[#fff1d6] px-2 py-2 text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                下班打卡
              </button>
            </div>
            <div className="mt-3 border-t-[2px] border-[var(--line)] pt-3 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 text-[var(--muted)]">{props.countdownLabel}</span>
                <span className="text-right font-semibold">{countdownValue}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="flex h-full min-h-0 flex-col gap-3.5">
          <section className="pixel-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">群组外卖</h3>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="pixel-chip bg-[#fff2d2] px-2 py-1 text-xs">
                  {props.group ? `${props.group.memberCount} 位成员` : "暂无群组"}
                </span>
                {props.group ? (
                  <span className="text-xs text-[var(--muted)]">
                    {props.group.activeFoodCount} 家候选
                  </span>
                ) : null}
                {props.group ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSwitchGroupForm((current) => !current);
                        setShowCreateGroupForm(false);
                        setGroupActionFeedback(null);
                      }}
                      className="text-xs text-[var(--muted)] underline underline-offset-3"
                    >
                      {showSwitchGroupForm ? "收起更换" : "更换群组"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateGroupForm((current) => !current);
                        setShowSwitchGroupForm(false);
                        setGroupActionFeedback(null);
                      }}
                      className="text-xs text-[var(--muted)] underline underline-offset-3"
                    >
                      {showCreateGroupForm ? "收起新建" : "新建群组"}
                    </button>
                    <button
                      type="button"
                      onClick={handleLeaveGroup}
                      disabled={isGroupPending}
                      className="text-xs text-[var(--muted)] underline underline-offset-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      退出群组
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-sm border-[2px] border-[var(--line)] bg-[#fffaf2] p-3.5">
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <Users className="h-3.5 w-3.5" />
                  当前群组
                </div>
                <p className="mt-2 text-[22px] font-semibold leading-7">
                  {props.group ? props.group.name : "还没有加入群组"}
                </p>
                {props.group ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]">
                    <span>邀请码</span>
                    <span className="pixel-chip bg-white px-2 py-1 font-semibold text-[var(--foreground)]">
                      {props.group.inviteCode}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                href={props.group ? "/food-pool" : "#"}
                aria-disabled={!props.group}
                className={`pixel-button flex items-center justify-center bg-[#fff1d6] px-3 py-2 text-sm font-semibold ${
                  props.group ? "" : "pointer-events-none opacity-50"
                }`}
              >
                管理外卖池
              </Link>
              <button
                type="button"
                onClick={openTakeoutModal}
                disabled={!props.group}
                className="pixel-button w-full bg-[var(--accent-2)] px-3 py-2 text-sm font-semibold text-[#2c170e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                开今日外卖
              </button>
            </div>

            {props.group ? (
              <div className="mt-3 space-y-3">
                {showSwitchGroupForm ? (
                  <div className="rounded-sm border-[2px] border-[var(--line)] bg-[#fffaf2] p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <input
                        type="text"
                        value={switchInviteCode}
                        onChange={(event) => setSwitchInviteCode(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleSwitchGroup();
                          }
                        }}
                        placeholder="输入新群组邀请码"
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm uppercase outline-none transition focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowSwitchGroupForm(false);
                          setSwitchInviteCode("");
                        }}
                        className="pixel-button bg-white px-3 py-2 text-sm font-semibold"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchGroup}
                        disabled={isGroupPending}
                        className="pixel-button bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGroupPending ? "更换中..." : "确认更换"}
                      </button>
                    </div>
                    {groupActionFeedback?.message ? (
                      <p
                        className={`mt-3 text-sm ${
                          groupActionFeedback.status === "error"
                            ? "text-[#b94b4b]"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {groupActionFeedback.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {showCreateGroupForm ? (
                  <div className="rounded-sm border-[2px] border-[var(--line)] bg-[#fffaf2] p-3">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                      <input
                        type="text"
                        value={createGroupName}
                        onChange={(event) => setCreateGroupName(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleCreateGroup();
                          }
                        }}
                        placeholder="输入新群组名字"
                        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateGroupForm(false);
                          setCreateGroupName("");
                        }}
                        className="pixel-button bg-white px-3 py-2 text-sm font-semibold"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateGroup}
                        disabled={isGroupPending}
                        className="pixel-button bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isGroupPending ? "新建中..." : "确认新建"}
                      </button>
                    </div>
                    {groupActionFeedback?.message ? (
                      <p
                        className={`mt-3 text-sm ${
                          groupActionFeedback.status === "error"
                            ? "text-[#b94b4b]"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {groupActionFeedback.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {!showSwitchGroupForm && !showCreateGroupForm && groupActionFeedback?.message ? (
                  <p
                    className={`text-sm ${
                      groupActionFeedback.status === "error"
                        ? "text-[#b94b4b]"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {groupActionFeedback.message}
                  </p>
                ) : null}
              </div>
            ) : null}

            {props.group ? (
              <div className="mt-5 space-y-4 border-t-[2px] border-[var(--line)] pt-4">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(props.group.activeFoodPreview ?? []).map((food) => (
                    <span
                      key={food}
                      className="pixel-chip bg-white px-2 py-1 text-center text-[11px] leading-4 font-medium whitespace-normal break-words"
                    >
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-5 border-t-[2px] border-[var(--line)] pt-4 text-sm leading-6 text-[var(--muted)]">
                还没有群组的时候，这里会先空着；等你拉上搭子，外卖池就能开始养起来了。
              </p>
            )}
          </section>

          <section className="pixel-panel flex min-h-0 flex-1 flex-col p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">AI 动态</h3>
              {props.aiFeed.issue?.createdAt ? (
                <span className="text-[11px] text-[var(--muted)]">
                  {formatFeedTimeLabel(props.aiFeed.issue.createdAt)}
                </span>
              ) : null}
            </div>

            {props.aiFeed.issue ? (
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {props.aiFeed.issue.stories.map((story) => (
                    <a
                      key={story.id}
                      href={story.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-2xl border border-black/8 bg-[#fffdf9] px-3 py-3 transition hover:bg-[#fffaf2]"
                    >
                      <div className="text-[13px] leading-5 font-medium">{story.title}</div>
                      <p
                        className="mt-1.5 overflow-hidden text-[12px] leading-5 text-[var(--muted)]"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {story.summary}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--muted)]">
                {props.aiFeed.message ?? "暂时还没有可展示的 AI 动态。"}
              </p>
            )}
          </section>
        </aside>

        {showCalendar ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8">
            <div className="pixel-panel max-h-[90vh] w-full max-w-4xl overflow-auto bg-[var(--panel)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Attendance Calendar
                </p>
                <h3 className="text-2xl font-semibold">{formatMonthTitle(calendarMonth)} 打卡日历</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!canGoPrev}
                  onClick={() => setCalendarMonth(previousMonthLabel)}
                  className="pixel-button flex items-center justify-center bg-[#fff1d6] p-2 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="查看上个月"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={!canGoNext}
                  onClick={() => setCalendarMonth(nextMonthLabel)}
                  className="pixel-button flex items-center justify-center bg-[#fff1d6] p-2 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="查看下个月"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="pixel-button flex items-center justify-center bg-[#fff1d6] p-2"
                  aria-label="关闭打卡日历"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-[var(--muted)]">
              {["日", "一", "二", "三", "四", "五", "六"].map((weekday) => (
                <div key={weekday} className="py-1">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell) => {
                if (!cell.day) {
                  return <div key={cell.key} className="min-h-[106px]" />;
                }

                const record = attendanceMap.get(cell.day);
                const isToday =
                  calendarMonth === todayMeta.monthLabel &&
                  cell.day === todayMeta.dayOfMonth;

                return (
                  <div
                    key={cell.key}
                    className={`min-h-[106px] border-[2px] border-[var(--line)] p-2 text-xs ${
                      isToday ? "bg-[#ffe8b8]" : "bg-white"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold">{cell.day}</span>
                      <span className="text-[10px] text-[var(--muted)]">
                        {record?.status ?? ""}
                      </span>
                    </div>
                    {record ? (
                      <div className="space-y-1 leading-5 text-[var(--muted)]">
                        <div>上班 {record.clockInLabel}</div>
                        <div>下班 {record.clockOutLabel}</div>
                      </div>
                    ) : (
                      <div className="pt-3 text-[10px] leading-4 text-[var(--muted)]">
                        暂无记录
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          </div>
        ) : null}
      </section>

      {showTakeoutModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8">
          <div className="pixel-panel w-full max-w-xl bg-[var(--panel)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Group Lunch
                </p>
                <h3 className="text-2xl font-semibold">开今日外卖</h3>
              </div>
              <button
                type="button"
                onClick={closeTakeoutModal}
                className="pixel-button flex items-center justify-center bg-[#fff1d6] p-2"
                aria-label="关闭外卖盲盒"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-sm border-[3px] border-[var(--line)] bg-[#fff6e8] px-4 py-6">
              <div className="mx-auto flex max-w-md flex-col items-center">
                <div className="mb-6 flex w-full flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
                  <div className="mb-2 h-52 flex-1 sm:mb-0">
                    <div
                      className={`takeout-bag-stage relative mx-auto -translate-y-2 h-full w-[220px] transition-transform duration-500 ${
                        takeoutPhase === "shaking" ? "takeout-wiggle" : ""
                      } ${takeoutPhase === "revealed" ? "translate-y-2" : ""}`}
                    >
                      <div
                        className={`absolute left-1/2 top-[56px] z-10 w-[164px] -translate-x-1/2 rounded-sm border-[3px] border-[var(--line)] bg-[#fffdf8] px-4 py-3 text-center shadow-[6px_6px_0_var(--shadow)] transition-all duration-500 ${
                          takeoutPhase === "revealed"
                            ? "translate-y-0 opacity-100"
                            : "translate-y-8 opacity-0"
                        }`}
                      >
                        <div className="mx-auto mb-2 inline-flex items-center rounded-full border-[2px] border-[var(--line)] bg-[#ffe8b8] px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-[#7a5a2a]">
                          今日抽中
                        </div>
                        <div className="space-y-1 text-[var(--foreground)]">
                          <p
                            className={`font-semibold leading-6 ${
                              selectedTakeoutDisplay.restaurantName.length > 10
                                ? "text-[16px]"
                                : "text-[20px]"
                            }`}
                          >
                            {selectedTakeoutDisplay.restaurantName}
                          </p>
                          {!selectedTakeoutDisplay.isSingleLine ? (
                            <p
                              className={`font-medium leading-6 ${
                                selectedTakeoutDisplay.dishName.length > 10
                                  ? "text-[14px]"
                                  : "text-[17px]"
                              }`}
                            >
                              {selectedTakeoutDisplay.dishName}
                            </p>
                          ) : null}
                        </div>
                        <div className="mt-3 flex items-center justify-center gap-2">
                          <span className="h-[2px] w-7 bg-[#d7c2a1]" />
                          <span className="text-[10px] text-[var(--muted)]">午饭签</span>
                          <span className="h-[2px] w-7 bg-[#d7c2a1]" />
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-1/2 z-0 h-[150px] w-[170px] -translate-x-1/2">
                        <div
                          className="absolute inset-x-4 bottom-0 h-[118px] border-[3px] border-[#8b6137] bg-[#c89258]"
                          style={{ clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)" }}
                        />
                        <div
                          className="absolute inset-x-7 bottom-[10px] h-[92px] bg-[#ddb07a] opacity-65"
                          style={{ clipPath: "polygon(10% 0%, 90% 0%, 96% 100%, 4% 100%)" }}
                        />
                        <div className="absolute left-1/2 top-[2px] h-[38px] w-[46px] -translate-x-1/2 rounded-t-full border-[3px] border-[#8b6137] border-b-0 bg-transparent" />
                        <div className="absolute inset-x-[30px] top-[28px] h-[10px] rounded-t-[8px] border-[3px] border-[#8b6137] bg-[#e8c79f]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full max-w-[132px] flex-col gap-2 sm:mt-6">
                    <button
                      type="button"
                      onClick={() => setTakeoutRequireHealthy((current) => !current)}
                      className={`pixel-button relative px-2.5 py-1.5 text-xs ${
                        takeoutRequireHealthy
                          ? "bg-[#cfeecf] text-[#214b2d]"
                          : "bg-[#fffaf2] text-[var(--foreground)]"
                      }`}
                    >
                      {takeoutRequireHealthy ? (
                        <span className="absolute right-1 top-0.5 text-[13px] font-semibold leading-none">✓</span>
                      ) : null}
                      健康
                    </button>
                    <button
                      type="button"
                      onClick={() => setTakeoutRequireFastDelivery((current) => !current)}
                      className={`pixel-button relative px-2.5 py-1.5 text-xs ${
                        takeoutRequireFastDelivery
                          ? "bg-[#ffe7b8] text-[#7a4f17]"
                          : "bg-[#fffaf2] text-[var(--foreground)]"
                      }`}
                    >
                      {takeoutRequireFastDelivery ? (
                        <span className="absolute right-1 top-0.5 text-[13px] font-semibold leading-none">✓</span>
                      ) : null}
                      送得快
                    </button>
                  </div>
                </div>

                {!(!takeoutPool.length || takeoutPhase === "shaking" || takeoutPhase === "revealed") ? null : (
                  <p className="text-center text-sm leading-6 text-[var(--muted)]">
                    {!takeoutPool.length
                      ? "当前没有符合这些要求的候选。"
                      : takeoutPhase === "shaking"
                        ? "外卖袋已经开始摇了。"
                        : "今天中午的命运已经揭晓。"}
                  </p>
                )}

                <div className="mt-5 flex w-full gap-3">
                  <button
                    type="button"
                    onClick={runTakeoutReveal}
                    disabled={!props.group || !takeoutPool.length}
                    className="pixel-button flex-1 bg-[#fff1d6] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {takeoutPhase === "idle" ? "开始抽" : "再开一次"}
                  </button>
                  {takeoutPhase === "revealed" ? (
                    <button
                      type="button"
                      onClick={closeTakeoutModal}
                      className="pixel-button flex-1 bg-[var(--accent-2)] px-3 py-2 text-sm font-semibold text-[#2c170e]"
                    >
                      就吃这个
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes takeout-wiggle {
          0% {
            transform: rotate(0deg);
          }
          20% {
            transform: rotate(-5deg);
          }
          40% {
            transform: rotate(5deg);
          }
          60% {
            transform: rotate(-4deg);
          }
          80% {
            transform: rotate(4deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        .takeout-wiggle {
          animation: takeout-wiggle 0.65s ease-in-out;
        }
      `}</style>
    </>
  );
}
