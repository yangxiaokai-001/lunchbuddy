import { signOutAction } from "@/app/actions/auth";
import { AuthEntry, JoinGroupEntry } from "@/components/auth-entry";
import { HomeMoodShell } from "@/components/home-mood-shell";
import { getViewerState } from "@/lib/auth";
import { getHomePageData } from "@/lib/home-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const viewerState = await getViewerState();

  if (!viewerState.viewer) {
    return (
      <main className="checker-bg min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <nav className="pixel-panel flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-[26px] font-semibold">饭搭子</h1>
            </div>
            <span className="text-sm text-[var(--muted)]">登录 / 注册</span>
          </nav>

          <AuthEntry />
        </div>
      </main>
    );
  }

  if (!viewerState.viewer.hasGroup) {
    return (
      <main className="checker-bg min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <nav className="pixel-panel flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-[26px] font-semibold">饭搭子</h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[var(--foreground)]">
                {viewerState.viewer.nickname}
              </span>
              <form action={signOutAction}>
                <button type="submit" className="text-[var(--muted)] underline underline-offset-4">
                  退出
                </button>
              </form>
            </div>
          </nav>

          <JoinGroupEntry
            nickname={viewerState.viewer.nickname}
          />
        </div>
      </main>
    );
  }

  const data = await getHomePageData();

  if (!data) {
    return null;
  }

  return (
    <main className="checker-bg min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <nav className="pixel-panel flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-[26px] font-semibold">饭搭子</h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[var(--foreground)]">
              {viewerState.viewer.nickname}
            </span>
            <form action={signOutAction}>
              <button type="submit" className="text-[var(--muted)] underline underline-offset-4">
                退出
              </button>
            </form>
          </div>
        </nav>

        <HomeMoodShell
          key={`${data.attendance.status}-${data.attendance.clockInAtIso ?? "none"}-${data.attendance.clockOutAtIso ?? "none"}-${data.countdown.targetAtIso ?? "none"}`}
          todayLabel={data.todayLabel}
          countdownLabel={data.countdown.label}
          countdownValue={data.countdown.value}
          countdownTargetAtIso={data.countdown.targetAtIso}
          attendanceStatus={data.attendance.status}
          clockInLabel={data.attendance.clockInLabel}
          clockInAtIso={data.attendance.clockInAtIso}
          clockOutAtIso={data.attendance.clockOutAtIso}
          expectedClockOutLabel={data.attendance.expectedClockOutLabel}
          workDurationLabel={data.attendance.workDurationLabel}
          overtimeLabel={data.attendance.overtimeLabel}
          aiFeed={data.aiFeed}
          group={data.group}
          attendanceCalendar={data.attendanceCalendar}
        />
      </div>
    </main>
  );
}
