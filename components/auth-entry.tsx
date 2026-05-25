"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  createGroupAction,
  joinGroupAction,
  signInAction,
  signUpAction,
} from "@/app/actions/auth";
import type { AuthFormState } from "@/app/actions/auth";

const initialAuthFormState: AuthFormState = {
  status: "idle",
  message: null,
};

function FormMessage({
  status,
  message,
}: {
  status: "idle" | "error" | "success";
  message: string | null;
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={`text-sm ${
        status === "error" ? "text-[#b94b4b]" : "text-[var(--muted)]"
      }`}
    >
      {message}
    </p>
  );
}

export function AuthEntry() {
  const router = useRouter();
  const [signInState, signInFormAction, isSigningIn] = useActionState(
    signInAction,
    initialAuthFormState,
  );
  const [signUpState, signUpFormAction, isSigningUp] = useActionState(
    signUpAction,
    initialAuthFormState,
  );

  useEffect(() => {
    if (signInState.status === "success" || signUpState.status === "success") {
      router.refresh();
    }
  }, [router, signInState.status, signUpState.status]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="pixel-panel p-6 sm:p-8">
        <h2 className="text-3xl font-semibold">先登录，再一起决定今天吃什么</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          登录后可以管理自己的外卖池、加入群组、随机选午饭，也能保留每天的打卡记录。
        </p>
        <div className="mt-6 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
          <div className="rounded-2xl border border-black/8 bg-[#fbf4e9] px-4 py-3">随机选午饭</div>
          <div className="rounded-2xl border border-black/8 bg-[#fbf4e9] px-4 py-3">管理外卖池</div>
          <div className="rounded-2xl border border-black/8 bg-[#fbf4e9] px-4 py-3">记录打卡</div>
        </div>
      </div>

      <div className="grid gap-6">
        <form action={signInFormAction} className="pixel-panel space-y-4 p-6">
          <div>
            <h3 className="text-xl font-semibold">登录</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">已有账号的话，直接进入。</p>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">用户名</span>
            <input
              name="username"
              type="text"
              placeholder="输入用户名"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">密码</span>
            <input
              name="password"
              type="password"
              placeholder="输入密码"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <FormMessage status={signInState.status} message={signInState.message} />

          <button
            type="submit"
            disabled={isSigningIn}
            className="pixel-chip w-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:brightness-105 disabled:cursor-wait disabled:opacity-70"
          >
            {isSigningIn ? "登录中..." : "进入饭搭子"}
          </button>
        </form>

        <form action={signUpFormAction} className="pixel-panel space-y-4 p-6">
          <div>
            <h3 className="text-xl font-semibold">注册</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">第一次使用的话，先创建你的账号。</p>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">用户名</span>
            <input
              name="username"
              type="text"
              placeholder="英文和数字组合"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
            <p className="text-xs text-[var(--muted)]">只允许英文和数字，不区分大小写，并且全站唯一。</p>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">昵称</span>
            <input
              name="nickname"
              type="text"
              placeholder="你想展示的名字"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
            <p className="text-xs text-[var(--muted)]">昵称只是展示名，可以和别人重复。</p>
          </label>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">密码</span>
            <input
              name="password"
              type="password"
              placeholder="设置密码"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <FormMessage status={signUpState.status} message={signUpState.message} />

          <button
            type="submit"
            disabled={isSigningUp}
            className="pixel-chip w-full bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-px hover:bg-[#fff8f0] disabled:cursor-wait disabled:opacity-70"
          >
            {isSigningUp ? "注册中..." : "创建账号"}
          </button>
        </form>
      </div>
    </section>
  );
}

type JoinGroupEntryProps = {
  nickname: string;
};

export function JoinGroupEntry(props: JoinGroupEntryProps) {
  const router = useRouter();
  const [joinState, joinFormAction, isJoining] = useActionState(
    joinGroupAction,
    initialAuthFormState,
  );
  const [createState, createFormAction, isCreating] = useActionState(
    createGroupAction,
    initialAuthFormState,
  );

  useEffect(() => {
    if (joinState.status === "success" || createState.status === "success") {
      router.refresh();
    }
  }, [createState.status, joinState.status, router]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="pixel-panel p-6 sm:p-8">
        <h2 className="text-3xl font-semibold">{props.nickname}，下一步把你的群组建起来</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          你可以创建自己的群组，也可以输入邀请码加入同事已有的群组。后面的外卖池和随机选午饭都会跟这个群组绑定。
        </p>
        <div className="mt-6 rounded-2xl border border-black/8 bg-[#fbf4e9] px-5 py-4 text-sm leading-6 text-[var(--muted)]">
          创建群组后，你会拿到一个邀请码，发给同事就能一起决定今天吃什么。
        </div>
      </div>

      <div className="grid gap-6">
        <form action={createFormAction} className="pixel-panel space-y-4 p-6">
          <div>
            <h3 className="text-xl font-semibold">创建群组</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">创建之后，你就是这个群组的管理员。</p>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">群组名</span>
            <input
              name="groupName"
              type="text"
              placeholder="比如：中午吃什么"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <FormMessage status={createState.status} message={createState.message} />

          <button
            type="submit"
            disabled={isCreating}
            className="pixel-chip w-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "创建中..." : "创建群组"}
          </button>
        </form>

        <form action={joinFormAction} className="pixel-panel space-y-4 p-6">
          <div>
            <h3 className="text-xl font-semibold">加入群组</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">如果同事已经建好了，输入邀请码就能加入。</p>
          </div>

          <label className="block space-y-2 text-sm">
            <span className="font-medium text-[var(--foreground)]">邀请码</span>
            <input
              name="inviteCode"
              type="text"
              placeholder="比如 MOO123"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 uppercase outline-none transition focus:border-[var(--accent)]"
            />
          </label>

          <FormMessage status={joinState.status} message={joinState.message} />

          <button
            type="submit"
            disabled={isJoining}
            className="pixel-chip w-full bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:-translate-y-px hover:bg-[#fff8f0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isJoining ? "加入中..." : "加入群组"}
          </button>
        </form>
      </div>
    </section>
  );
}
