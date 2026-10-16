import {
  languageOptions,
  preferredContentLanguages,
  type Language,
} from "@/lib/languages";

export type NotionRichText = {
  plain_text: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
};

export type ArticleVersion = {
  language: Language | null;
  title: string;
  summary: string;
  content: NotionRichText[];
  contentPropertyId: string | null;
};

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
  versions: ArticleVersion[];
};

export type NotionBlockContent = {
  rich_text?: NotionRichText[];
  caption?: NotionRichText[];
  checked?: boolean;
  language?: string;
  url?: string;
  type?: "external" | "file";
  external?: { url?: string };
  file?: { url?: string };
};

export type NotionBlock = {
  id: string;
  type: string;
  has_children?: boolean;
  children?: NotionBlock[];
} & Record<string, unknown>;

type NotionQueryResponse = { results: NotionPage[] };
type NotionBlockChildrenResponse = {
  results: NotionBlock[];
  has_more?: boolean;
  next_cursor?: string | null;
};
type NotionPropertyItemResponse = {
  results: { rich_text?: NotionRichText }[];
  has_more?: boolean;
  next_cursor?: string | null;
};

type NotionProperty = {
  id?: string;
  checkbox?: boolean;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
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
// Notion truncates rich text property values to 25 items in query results.
const NOTION_PROPERTY_ITEM_LIMIT = 25;
const MAX_BLOCK_DEPTH = 3;

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

export const toPlainText = (value?: readonly NotionRichText[]) =>
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

const resolveVersions = (
  properties: Record<string, NotionProperty>,
): ArticleVersion[] => {
  const versions = preferredContentLanguages.flatMap((language) => {
    const props = propertyMap[language];
    const title = toPlainTextTitle(properties[props.title]);
    const summary = getPropertyText(properties, [props.summary, "Summary"]);
    const contentProperty = properties[props.content];
    const content = contentProperty?.rich_text ?? [];

    if (!title && !summary && !toPlainText(content)) {
      return [];
    }

    return [
      {
        language,
        title,
        summary,
        content,
        contentPropertyId: contentProperty?.id ?? null,
      },
    ];
  });

  if (versions.length) {
    return versions;
  }

  const contentKey = ["Content", "Body"].find((key) =>
    toPlainText(properties[key]?.rich_text),
  );

  return [
    {
      language: null,
      title: getPropertyText(properties, ["Title", "Name"]),
      summary: getPropertyText(properties, ["Summary", "Description"]),
      content: contentKey ? (properties[contentKey]?.rich_text ?? []) : [],
      contentPropertyId: contentKey
        ? (properties[contentKey]?.id ?? null)
        : null,
    },
  ];
};

const mapPageToPost = (page: NotionPage): NotionPost => {
  const versions = resolveVersions(page.properties);
  const primary = versions[0];

  return {
    id: page.id,
    title: primary.title || "Untitled",
    summary: primary.summary,
    date: page.properties.Date?.date?.start ?? null,
    slug: toPlainText(page.properties.Slug?.rich_text) || page.id,
    content: toPlainText(primary.content),
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
    displayLanguage: primary.language,
    versions,
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

// Throws on failure so an incremental revalidation keeps serving the last
// good page instead of caching fallback content or a 404.
const fetchNotionJson = async <T>(
  input: string,
  init: RequestInit,
): Promise<T> => {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`Notion request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
};

export const isNotionConfigured = () =>
  Boolean(process.env.NOTION_TOKEN && process.env.NOTION_DATABASE_ID);

const queryDatabase = async (body: Record<string, unknown>) => {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
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

const fetchFullRichTextProperty = async (
  token: string,
  pageId: string,
  propertyId: string,
) => {
  let cursor: string | null = null;
  const items: NotionRichText[] = [];

  do {
    const url = new URL(
      `https://api.notion.com/v1/pages/${pageId}/properties/${encodeURIComponent(propertyId)}`,
    );

    if (cursor) {
      url.searchParams.set("start_cursor", cursor);
    }

    const data: NotionPropertyItemResponse =
      await fetchNotionJson<NotionPropertyItemResponse>(url.toString(), {
        headers: createNotionHeaders(token),
        next: { revalidate: NOTION_REVALIDATE_SECONDS },
      });

    items.push(
      ...data.results
        .map((result) => result.rich_text)
        .filter((item): item is NotionRichText => Boolean(item)),
    );
    cursor = data.has_more ? (data.next_cursor ?? null) : null;
  } while (cursor);

  return items;
};

const withFullContent = async (post: NotionPost): Promise<NotionPost> => {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    return post;
  }

  const versions = await Promise.all(
    post.versions.map(async (version) =>
      version.contentPropertyId &&
      version.content.length >= NOTION_PROPERTY_ITEM_LIMIT
        ? {
            ...version,
            content: await fetchFullRichTextProperty(
              token,
              post.id,
              version.contentPropertyId,
            ),
          }
        : version,
    ),
  );

  return {
    ...post,
    content: toPlainText(versions[0]?.content),
    versions,
  };
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
  return page ? withFullContent(mapPageToPost(page)) : null;
};

const fetchBlockChildren = async (
  token: string,
  blockId: string,
  depth: number,
): Promise<NotionBlock[]> => {
  let cursor: string | null = null;
  const blocks: NotionBlock[] = [];

  do {
    const url = new URL(
      `https://api.notion.com/v1/blocks/${blockId}/children`,
    );
    url.searchParams.set("page_size", "100");

    if (cursor) {
      url.searchParams.set("start_cursor", cursor);
    }

    const data: NotionBlockChildrenResponse =
      await fetchNotionJson<NotionBlockChildrenResponse>(url.toString(), {
        headers: createNotionHeaders(token),
        next: { revalidate: NOTION_REVALIDATE_SECONDS },
      });

    blocks.push(...(data.results ?? []));
    cursor = data.has_more ? (data.next_cursor ?? null) : null;
  } while (cursor);

  if (depth >= MAX_BLOCK_DEPTH) {
    return blocks;
  }

  return Promise.all(
    blocks.map(async (block) =>
      block.has_children
        ? {
            ...block,
            children: await fetchBlockChildren(token, block.id, depth + 1),
          }
        : block,
    ),
  );
};

export const fetchPostBlocks = async (
  pageId: string,
): Promise<NotionBlock[]> => {
  const token = process.env.NOTION_TOKEN;

  if (!token) {
    return [];
  }

  return fetchBlockChildren(token, pageId, 1);
};
