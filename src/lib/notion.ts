import {
  languageOptions,
  preferredContentLanguages,
  type Language,
} from "@/lib/languages";

export type NotionPost = {
  id: string;
  title: string;
  summary: string;
  date: string | null;
  slug: string;
  content: string;
  tags: string[];
  originalLanguage: Language | null;
  originalSource: string;
  originalUrl: string;
  displayLanguage: Language | null;
};

export type NotionBlock = {
  id: string;
  type: string;
  paragraph?: { rich_text: { plain_text: string }[] };
  heading_1?: { rich_text: { plain_text: string }[] };
  heading_2?: { rich_text: { plain_text: string }[] };
  heading_3?: { rich_text: { plain_text: string }[] };
  bulleted_list_item?: { rich_text: { plain_text: string }[] };
  numbered_list_item?: { rich_text: { plain_text: string }[] };
  quote?: { rich_text: { plain_text: string }[] };
  callout?: { rich_text: { plain_text: string }[] };
};

type NotionTextItem = { plain_text: string };
type NotionQueryResponse = { results: NotionPage[] };
type NotionBlockChildrenResponse = {
  results: NotionBlock[];
  has_more?: boolean;
  next_cursor?: string | null;
};

type NotionProperty = {
  checkbox?: boolean;
  title?: NotionTextItem[];
  rich_text?: NotionTextItem[];
  select?: { name?: string };
  multi_select?: { name?: string }[];
  url?: string;
  date?: { start?: string | null };
};

type NotionPage = {
  id: string;
  properties: Record<string, NotionProperty>;
};

const NOTION_VERSION = "2022-06-28";
const NOTION_REVALIDATE_SECONDS = 60;

const propertyMap = Object.fromEntries(
  languageOptions.map(({ value, short }) => [
    value,
    {
      title: `Title (${short})`,
      summary: `Summary (${short})`,
      content: `Content (${short})`,
    },
  ]),
) as Record<Language, { title: string; summary: string; content: string }>;

const toPlainText = (value?: NotionTextItem[]) =>
  value?.map((item) => item.plain_text).join("").trim() ?? "";

const isNonEmptyString = (value: string | undefined): value is string =>
  Boolean(value);

const toPlainTextTitle = (
  value?: Pick<NotionProperty, "title" | "rich_text">,
) => {
  const title = toPlainText(value?.title);
  return title || toPlainText(value?.rich_text);
};

const toPlainTextProperty = (value?: NotionProperty) => {
  const text = toPlainText(value?.rich_text);
  if (text) return text;

  const title = toPlainText(value?.title);
  if (title) return title;

  const select = value?.select?.name?.trim();
  if (select) return select;

  return (
    value?.multi_select
      ?.map((item) => item.name?.trim())
      .filter(isNonEmptyString)
      .join(", ") ?? ""
  );
};

const toMultiSelect = (value?: Pick<NotionProperty, "multi_select">) =>
  value?.multi_select
    ?.map((item) => item.name?.trim())
    .filter(isNonEmptyString) ?? [];

const getPropertyText = (
  properties: Record<string, NotionProperty>,
  keys: string[],
) => {
  for (const key of keys) {
    const value = toPlainTextProperty(properties[key]);
    if (value) return value;
  }

  return "";
};

const getPropertyMultiSelect = (
  properties: Record<string, NotionProperty>,
  keys: string[],
) => {
  for (const key of keys) {
    const values = toMultiSelect(properties[key]);
    if (values.length) return values;
  }

  return [];
};

const getPropertyUrl = (
  properties: Record<string, NotionProperty>,
  keys: string[],
) => {
  for (const key of keys) {
    const url = properties[key]?.url?.trim();
    if (url) return url;
  }

  return "";
};

const toLanguage = (value?: string): Language | null => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;

  const aliasMap: Record<string, Language> = {
    english: "en",
    turkish: "tr",
    turkce: "tr",
    spanish: "es",
    german: "de",
    deutsch: "de",
    italian: "it",
    italiano: "it",
  };
  const aliasMatch = aliasMap[normalized];
  if (aliasMatch) return aliasMatch;

  return (
    languageOptions.find((option) => option.value === normalized)?.value ?? null
  );
};

const resolveContent = (properties: Record<string, NotionProperty>) => {
  for (const language of preferredContentLanguages) {
    const props = propertyMap[language];
    const title = toPlainTextTitle(properties[props.title]);
    const summary = getPropertyText(properties, [props.summary, "Summary"]);
    const content = toPlainText(properties[props.content]?.rich_text);

    if (title || summary || content) {
      return { displayLanguage: language, title, summary, content };
    }
  }

  return {
    displayLanguage: null,
    title: getPropertyText(properties, ["Title", "Name"]),
    summary: getPropertyText(properties, ["Summary", "Description"]),
    content: getPropertyText(properties, ["Content", "Body"]),
  };
};

const mapPageToPost = (page: NotionPage): NotionPost => {
  const resolved = resolveContent(page.properties);

  return {
    id: page.id,
    title: resolved.title || "Untitled",
    summary: resolved.summary,
    date: page.properties.Date?.date?.start ?? null,
    slug: toPlainText(page.properties.Slug?.rich_text) || page.id,
    content: resolved.content,
    tags: getPropertyMultiSelect(page.properties, [
      "Tags",
      "Tag",
      "Categories",
      "Category",
    ]),
    originalLanguage: toLanguage(
      page.properties["Original Language"]?.select?.name,
    ),
    originalSource: getPropertyText(page.properties, ["Original Source"]),
    originalUrl: getPropertyUrl(page.properties, ["Original URL"]),
    displayLanguage: resolved.displayLanguage,
  };
};

const createNotionHeaders = (
  token: string,
  includeJsonContentType = false,
) => ({
  Authorization: `Bearer ${token}`,
  "Notion-Version": NOTION_VERSION,
  ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
});

const fetchNotionJson = async <T>(
  input: string,
  init: RequestInit,
): Promise<T | null> => {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      console.error(
        `Notion request failed (${response.status}): ${await response.text()}`,
      );
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("Notion request failed:", error);
    return null;
  }
};

const queryDatabase = async (body: Record<string, unknown>) => {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    console.error("NOTION_TOKEN or NOTION_DATABASE_ID is not set.");
    return null;
  }

  return fetchNotionJson<NotionQueryResponse>(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: createNotionHeaders(token, true),
      body: JSON.stringify(body),
      next: { revalidate: NOTION_REVALIDATE_SECONDS },
    },
  );
};

export const fetchPosts = async (): Promise<NotionPost[]> => {
  const data = await queryDatabase({
    filter: {
      property: "Published",
      checkbox: { equals: true },
    },
    sorts: [{ property: "Date", direction: "descending" }],
  });

  return data?.results.map(mapPageToPost) ?? [];
};

export const fetchPostBySlug = async (
  slug: string,
): Promise<NotionPost | null> => {
  const data = await queryDatabase({
    filter: {
      and: [
        { property: "Published", checkbox: { equals: true } },
        { property: "Slug", rich_text: { equals: slug } },
      ],
    },
    page_size: 1,
  });

  const page = data?.results[0];
  return page ? mapPageToPost(page) : null;
};

export const fetchPostBlocks = async (
  pageId: string,
): Promise<NotionBlock[]> => {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    return [];
  }

  let cursor: string | null = null;
  const blocks: NotionBlock[] = [];

  do {
    const url = new URL(
      `https://api.notion.com/v1/blocks/${pageId}/children`,
    );
    url.searchParams.set("page_size", "100");

    if (cursor) {
      url.searchParams.set("start_cursor", cursor);
    }

    const data = await fetchNotionJson<NotionBlockChildrenResponse>(
      url.toString(),
      {
        headers: createNotionHeaders(token),
        next: { revalidate: NOTION_REVALIDATE_SECONDS },
      },
    );

    if (!data) {
      break;
    }

    blocks.push(...(data.results ?? []));
    cursor = data.has_more ? (data.next_cursor ?? null) : null;
  } while (cursor);

  return blocks;
};

