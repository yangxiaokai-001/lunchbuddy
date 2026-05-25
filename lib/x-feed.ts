type XUserLookupResponse = {
  data?: Array<{
    id: string;
    name: string;
    username: string;
    profile_image_url?: string;
  }>;
};

type XUserPostsResponse = {
  data?: Array<{
    id: string;
    text: string;
    created_at?: string;
  }>;
};

export type AIFeedItem = {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  text: string;
  createdAt: string | null;
  url: string;
};

export type AIFeedResult = {
  status: "ready" | "unconfigured" | "empty" | "error";
  message: string | null;
  items: AIFeedItem[];
  sourceAccounts: string[];
};

const X_API_BASE = "https://api.x.com/2";
const DEFAULT_PER_USER_POSTS = 10;
const DEFAULT_WINDOW_DAYS = 3;

function readSourceAccounts() {
  const raw = process.env.X_AI_SOURCE_ACCOUNTS ?? "";
  return raw
    .split(",")
    .map((item) => item.trim().replace(/^@/, ""))
    .filter(Boolean);
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").replace(/https?:\/\/\S+/g, "").trim();
}

function shortenText(text: string, limit: number) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 1).trim()}...`;
}

function readBearerToken() {
  const rawToken = process.env.X_BEARER_TOKEN?.trim();

  if (!rawToken) {
    return null;
  }

  try {
    return decodeURIComponent(rawToken);
  } catch {
    return rawToken;
  }
}

async function xFetch<T>(path: string) {
  const token = readBearerToken();

  if (!token) {
    throw new Error("missing_token");
  }

  const response = await fetch(`${X_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: 60 * 30,
    },
  });

  if (!response.ok) {
    throw new Error(`x_api_${response.status}`);
  }

  return (await response.json()) as T;
}

function getRecentCutoff(days: number) {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function getReadableErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "missing_token") {
      return "还没有配置 X_BEARER_TOKEN。";
    }

    const cause = (error as Error & { cause?: { code?: string } }).cause;
    if (cause?.code === "UND_ERR_CONNECT_TIMEOUT") {
      return "当前终端还连不上 X API。你如果是靠代理访问 X，请在 .env.local 里补 HTTPS_PROXY。";
    }
  }

  return "X 动态暂时读取失败。";
}

export async function getTodayAIFeed(): Promise<AIFeedResult> {
  const sourceAccounts = readSourceAccounts();
  const recentCutoff = getRecentCutoff(DEFAULT_WINDOW_DAYS);

  if (!readBearerToken()) {
    return {
      status: "unconfigured",
      message: "还没有配置 X_BEARER_TOKEN。",
      items: [],
      sourceAccounts,
    };
  }

  if (!sourceAccounts.length) {
    return {
      status: "unconfigured",
      message: "还没有配置 X_AI_SOURCE_ACCOUNTS。",
      items: [],
      sourceAccounts: [],
    };
  }

  try {
    const usernames = encodeURIComponent(sourceAccounts.join(","));
    const users = await xFetch<XUserLookupResponse>(
      `/users/by?usernames=${usernames}&user.fields=profile_image_url,name,username`,
    );

    if (!users.data?.length) {
      return {
        status: "empty",
        message: "没有找到可读取的账号。",
        items: [],
        sourceAccounts,
      };
    }

    const userPosts = await Promise.all(
      users.data.map(async (user) => {
        try {
          const posts = await xFetch<XUserPostsResponse>(
            `/users/${user.id}/tweets?exclude=retweets,replies&max_results=${DEFAULT_PER_USER_POSTS}&tweet.fields=created_at`,
          );

          return (posts.data ?? []).map((post) => ({
            id: post.id,
            username: user.username,
            displayName: user.name,
            profileImageUrl: user.profile_image_url ?? null,
            text: shortenText(normalizeText(post.text), 160),
            createdAt: post.created_at ?? null,
            url: `https://x.com/${user.username}/status/${post.id}`,
          }));
        } catch {
          return [];
        }
      }),
    );

    const items = userPosts
      .flat()
      .filter((item) => {
        if (!item.createdAt) {
          return false;
        }

        return new Date(item.createdAt).getTime() >= recentCutoff;
      })
      .sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
      });

    if (!items.length) {
      return {
        status: "empty",
        message: `这些账号最近 ${DEFAULT_WINDOW_DAYS} 天没有可展示的内容。`,
        items: [],
        sourceAccounts,
      };
    }

    return {
      status: "ready",
      message: null,
      items,
      sourceAccounts,
    };
  } catch (error) {
    return {
      status: "error",
      message: getReadableErrorMessage(error),
      items: [],
      sourceAccounts,
    };
  }
}
