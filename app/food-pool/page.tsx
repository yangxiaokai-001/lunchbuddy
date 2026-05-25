import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { signOutAction } from "@/app/actions/auth";
import { FoodPoolManager } from "@/components/food-pool-manager";
import { getViewerState } from "@/lib/auth";
import { getHomePageData } from "@/lib/home-data";

export const dynamic = "force-dynamic";

export default async function FoodPoolPage() {
  const viewerState = await getViewerState();

  if (!viewerState.viewer || !viewerState.viewer.hasGroup) {
    redirect("/");
  }

  const data = await getHomePageData();

  if (!data?.group) {
    redirect("/");
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
            <Link href="/" className="text-[var(--muted)] underline underline-offset-4">
              首页
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-[var(--muted)] underline underline-offset-4">
                退出
              </button>
            </form>
          </div>
        </nav>

        <Link
          href="/"
          className="pixel-button inline-flex w-fit items-center gap-2 bg-white px-3 py-2 text-sm font-semibold"
        >
          <ChevronLeft className="h-4 w-4" />
          返回首页
        </Link>

        <FoodPoolManager group={data.group} />
      </div>
    </main>
  );
}
