export type AIDailyStory = {
  id: string;
  title: string;
  summary: string;
  url: string;
};

export type AIDailyIssue = {
  id: string;
  title: string;
  url: string;
  createdAt: string | null;
  stories: AIDailyStory[];
};

export type AIDailyFeedResult = {
  status: "ready" | "empty" | "error";
  message: string | null;
  issue: AIDailyIssue | null;
};

const JUYA_RSS_URL = "https://imjuya.github.io/juya-ai-daily/rss.xml";
const MAX_ISSUES = 5;
const MAX_STORIES = 4;

function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string) {
  return decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tagName: string) {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return block.match(pattern)?.[1]?.trim() ?? null;
}

function trimSummary(value: string) {
  if (value.length <= 92) {
    return value;
  }

  return `${value.slice(0, 91).trim()}...`;
}

function formatDateKey(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDays(value: Date, delta: number) {
  const shifted = new Date(value);
  shifted.setDate(shifted.getDate() + delta);
  return shifted;
}

function extractIssueDateKey(title: string, createdAt: string | null) {
  const titleMatch = title.match(/\b\d{4}-\d{2}-\d{2}\b/);

  if (titleMatch) {
    return titleMatch[0];
  }

  if (!createdAt) {
    return null;
  }

  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return formatDateKey(parsed);
}

function normalizeStoryTitle(value: string) {
  return value
    .replace(/^#\d+\s*/i, "")
    .replace(/\s*↗\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildStories(contentHtml: string | null, fallbackUrl: string) {
  if (!contentHtml) {
    return [];
  }

  const decoded = decodeHtmlEntities(contentHtml);
  const newsBody = decoded.split(/<hr\s*\/?>/i).slice(1).join("<hr>");
  const sectionMatches = [...newsBody.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi)];

  const stories = sectionMatches
    .map((match, index) => {
      const headingHtml = match[1];
      const sectionHtml = match[2];
      const title = normalizeStoryTitle(stripTags(headingHtml));

      if (!title || /视频版|概览|目录|更新说明/i.test(title)) {
        return null;
      }

      const hrefMatch =
        headingHtml.match(/href=["']([^"']+)["']/i) ??
        sectionHtml.match(/href=["']([^"']+)["']/i);
      const url = hrefMatch?.[1]?.trim() || fallbackUrl;
      const summaryHtml =
        sectionHtml.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i)?.[1] ??
        sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ??
        "";
      const summary = trimSummary(stripTags(summaryHtml).replace(/\s*↗\s*/g, " ").trim());

      if (!summary) {
        return null;
      }

      return {
        id: `${title}-${index}`,
        title,
        summary,
        url,
      };
    })
    .filter((item): item is AIDailyStory => Boolean(item));

  return stories.slice(0, MAX_STORIES);
}

function parseIssues(xml: string) {
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  return itemBlocks.slice(0, MAX_ISSUES).map((match, index) => {
    const block = match[1];
    const title = stripTags(extractTag(block, "title") ?? `第 ${index + 1} 期`);
    const url = stripTags(extractTag(block, "link") ?? JUYA_RSS_URL);
    const createdAt = stripTags(extractTag(block, "pubDate") ?? "") || null;
    const contentHtml = extractTag(block, "content:encoded");

    return {
      id: `${title}-${index}`,
      title,
      url,
      createdAt,
      dateKey: extractIssueDateKey(title, createdAt),
      stories: buildStories(contentHtml, url),
    };
  });
}

function pickLatestRelevantIssue(issues: Array<ReturnType<typeof parseIssues>[number]>) {
  if (!issues.length) {
    return null;
  }

  const today = new Date();
  const todayKey = formatDateKey(today);
  const yesterdayKey = formatDateKey(shiftDays(today, -1));
  const todayIssue = issues.find((issue) => issue.dateKey === todayKey && issue.stories.length);

  if (todayIssue) {
    return todayIssue;
  }

  const yesterdayIssue = issues.find(
    (issue) => issue.dateKey === yesterdayKey && issue.stories.length,
  );

  if (yesterdayIssue) {
    return yesterdayIssue;
  }

  return issues.find((issue) => issue.stories.length) ?? null;
}

export async function getTodayAIDailyFeed(): Promise<AIDailyFeedResult> {
  try {
    const response = await fetch(JUYA_RSS_URL, {
      next: {
        revalidate: 60 * 30,
      },
    });

    if (!response.ok) {
      throw new Error(`juya_rss_${response.status}`);
    }

    const xml = await response.text();
    const issues = parseIssues(xml);
    const issue = pickLatestRelevantIssue(issues);

    if (!issue) {
      return {
        status: "empty",
        message: "今天还没有可展示的 AI 动态。",
        issue: null,
      };
    }

    return {
      status: "ready",
      message: null,
      issue: {
        id: issue.id,
        title: issue.title,
        url: issue.url,
        createdAt: issue.createdAt,
        stories: issue.stories,
      },
    };
  } catch {
    return {
      status: "error",
      message: "AI 动态暂时读取失败。",
      issue: null,
    };
  }
}
