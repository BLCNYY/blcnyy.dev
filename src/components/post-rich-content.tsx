import type { ReactNode } from "react";

import type {
  NotionBlock,
  NotionBlockContent,
  NotionRichText,
} from "@/lib/notion";

type PostRichContentProps = {
  blocks?: readonly NotionBlock[];
  content?: readonly NotionRichText[];
  emptyMessage?: string;
};

type GroupedBlockType =
  | "bulleted_list_item"
  | "numbered_list_item"
  | "to_do";

const groupedBlockTypes = new Set<string>([
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
]);

const linkBlockTypes = new Set([
  "bookmark",
  "link_preview",
  "embed",
  "video",
  "audio",
  "pdf",
  "file",
]);

const getBlockContent = (block: NotionBlock): NotionBlockContent =>
  (block[block.type] as NotionBlockContent | undefined) ?? {};

const getRichText = (block: NotionBlock) =>
  getBlockContent(block).rich_text ?? [];

const hasText = (items: readonly NotionRichText[]) =>
  items.some((item) => item.plain_text.trim());

const getFileUrl = (content: NotionBlockContent) =>
  content.type === "file" ? content.file?.url : (content.external?.url ?? content.url);

const isSafeHref = (href?: string | null): href is string =>
  Boolean(href && /^(https?:|mailto:)/i.test(href));

function renderTextWithBreaks(text: string, keyPrefix: string) {
  const lines = text.split("\n");

  return lines.flatMap((line, index) =>
    index === 0
      ? [line]
      : [<br key={`${keyPrefix}-br-${index}`} />, line],
  );
}

function RichText({ items }: { items: readonly NotionRichText[] }) {
  return (
    <>
      {items.map((item, index) => {
        const key = `rt-${index}`;
        const annotations = item.annotations ?? {};
        let node: ReactNode = renderTextWithBreaks(item.plain_text, key);

        if (annotations.code) node = <code>{node}</code>;
        if (annotations.bold) node = <strong>{node}</strong>;
        if (annotations.italic) node = <em>{node}</em>;
        if (annotations.strikethrough) node = <s>{node}</s>;
        if (annotations.underline) node = <u>{node}</u>;

        if (isSafeHref(item.href)) {
          node = (
            <a href={item.href} target="_blank" rel="noreferrer">
              {node}
            </a>
          );
        }

        return <span key={key}>{node}</span>;
      })}
    </>
  );
}

// Splits rich text into paragraphs on blank lines while keeping each
// segment's formatting.
function splitRichTextParagraphs(items: readonly NotionRichText[]) {
  const paragraphs: NotionRichText[][] = [[]];

  items.forEach((item) => {
    const pieces = item.plain_text.split(/\n{2,}/);

    pieces.forEach((piece, index) => {
      if (index > 0) {
        paragraphs.push([]);
      }

      if (piece) {
        paragraphs[paragraphs.length - 1].push({ ...item, plain_text: piece });
      }
    });
  });

  return paragraphs
    .map((paragraph) => trimParagraph(paragraph))
    .filter((paragraph) => hasText(paragraph));
}

function trimParagraph(paragraph: NotionRichText[]) {
  if (!paragraph.length) {
    return paragraph;
  }

  const trimmed = [...paragraph];
  const lastIndex = trimmed.length - 1;

  trimmed[0] = { ...trimmed[0], plain_text: trimmed[0].plain_text.trimStart() };
  trimmed[lastIndex] = {
    ...trimmed[lastIndex],
    plain_text: trimmed[lastIndex].plain_text.trimEnd(),
  };

  return trimmed;
}

function collectGroup(
  blocks: readonly NotionBlock[],
  startIndex: number,
  type: GroupedBlockType,
) {
  const items: NotionBlock[] = [];
  let index = startIndex;

  while (blocks[index]?.type === type) {
    items.push(blocks[index]);
    index += 1;
  }

  return { items, nextIndex: index };
}

function renderChildren(block: NotionBlock) {
  return block.children?.length ? renderBlocks(block.children) : null;
}

function renderGroup(items: readonly NotionBlock[], type: GroupedBlockType) {
  const key = `${items[0]?.id}-${type}`;

  if (type === "to_do") {
    return (
      <ul key={key} className="article-todo-list">
        {items.map((item) => {
          const checked = Boolean(getBlockContent(item).checked);

          return (
            <li key={item.id} data-checked={checked ? "true" : "false"}>
              <span className="article-todo-box" aria-hidden="true">
                {checked ? "✓" : ""}
              </span>
              <span className="sr-only">{checked ? "Done: " : "To do: "}</span>
              <span>
                <RichText items={getRichText(item)} />
                {renderChildren(item)}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  const listItems = items.map((item) => (
    <li key={item.id}>
      <RichText items={getRichText(item)} />
      {renderChildren(item)}
    </li>
  ));

  return type === "bulleted_list_item" ? (
    <ul key={key}>{listItems}</ul>
  ) : (
    <ol key={key}>{listItems}</ol>
  );
}

function renderTable(block: NotionBlock) {
  const settings = block.table as { has_column_header?: boolean } | undefined;
  const rows = (block.children ?? []).map(
    (row) =>
      ((row.table_row as { cells?: NotionRichText[][] } | undefined)?.cells ??
        []) as NotionRichText[][],
  );

  if (!rows.length) {
    return null;
  }

  const [headerRow, ...bodyRows] = settings?.has_column_header
    ? rows
    : [null, ...rows];

  return (
    <div key={block.id} className="article-table-wrap">
      <table>
        {headerRow ? (
          <thead>
            <tr>
              {headerRow.map((cell, index) => (
                <th key={index} scope="col">
                  <RichText items={cell} />
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {(row ?? []).map((cell, index) => (
                <td key={index}>
                  <RichText items={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderBlock(block: NotionBlock): ReactNode {
  const content = getBlockContent(block);
  const richText = content.rich_text ?? [];
  const caption = content.caption ?? [];

  switch (block.type) {
    case "heading_1":
      return hasText(richText) ? (
        <h2 key={block.id}>
          <RichText items={richText} />
        </h2>
      ) : null;
    case "heading_2":
      return hasText(richText) ? (
        <h3 key={block.id}>
          <RichText items={richText} />
        </h3>
      ) : null;
    case "heading_3":
      return hasText(richText) ? (
        <h4 key={block.id}>
          <RichText items={richText} />
        </h4>
      ) : null;
    case "quote":
      return (
        <blockquote key={block.id}>
          <RichText items={richText} />
          {renderChildren(block)}
        </blockquote>
      );
    case "callout":
      return (
        <div className="article-callout" key={block.id}>
          <RichText items={richText} />
          {renderChildren(block)}
        </div>
      );
    case "toggle":
      return (
        <details key={block.id} className="article-toggle">
          <summary>
            <RichText items={richText} />
          </summary>
          {renderChildren(block)}
        </details>
      );
    case "divider":
      return <hr key={block.id} />;
    case "code":
      return (
        <figure key={block.id} className="article-code">
          <pre>
            <code data-language={content.language}>
              {richText.map((item) => item.plain_text).join("")}
            </code>
          </pre>
          {hasText(caption) ? (
            <figcaption>
              <RichText items={caption} />
            </figcaption>
          ) : null}
        </figure>
      );
    case "image": {
      const src = getFileUrl(content);

      if (!src) {
        return null;
      }

      const alt = caption.map((item) => item.plain_text).join("").trim();

      return (
        <figure key={block.id} className="article-figure">
          {/* Notion image URLs come from many hosts and have unknown sizes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} loading="lazy" decoding="async" />
          {alt ? (
            <figcaption>
              <RichText items={caption} />
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "table":
      return renderTable(block);
    case "column_list":
    case "column":
    case "synced_block":
      return block.children?.length ? (
        <div key={block.id} className="article-group">
          {renderBlocks(block.children)}
        </div>
      ) : null;
    default:
      break;
  }

  if (linkBlockTypes.has(block.type)) {
    const href = getFileUrl(content);

    if (!isSafeHref(href)) {
      return null;
    }

    return (
      <p key={block.id}>
        <a className="article-link-block" href={href} target="_blank" rel="noreferrer">
          {hasText(caption) ? <RichText items={caption} /> : href}
          <span aria-hidden="true"> ↗</span>
        </a>
      </p>
    );
  }

  if (!hasText(richText)) {
    return null;
  }

  const paragraph = (
    <p key={block.id}>
      <RichText items={richText} />
    </p>
  );

  return block.children?.length ? (
    <div key={block.id} className="article-group">
      {paragraph}
      <div className="article-indent">{renderBlocks(block.children)}</div>
    </div>
  ) : (
    paragraph
  );
}

function renderBlocks(blocks: readonly NotionBlock[]) {
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];

    if (groupedBlockTypes.has(block.type)) {
      const type = block.type as GroupedBlockType;
      const { items, nextIndex } = collectGroup(blocks, index, type);
      nodes.push(renderGroup(items, type));
      index = nextIndex;
      continue;
    }

    nodes.push(renderBlock(block));
    index += 1;
  }

  return nodes;
}

export function PostRichContent({
  blocks = [],
  content = [],
  emptyMessage = "Content coming soon.",
}: PostRichContentProps) {
  if (blocks.length > 0) {
    return <>{renderBlocks(blocks)}</>;
  }

  const paragraphs = splitRichTextParagraphs(content);

  if (paragraphs.length > 0) {
    return (
      <>
        {paragraphs.map((paragraph, index) => (
          <p key={index}>
            <RichText items={paragraph} />
          </p>
        ))}
      </>
    );
  }

  return <p>{emptyMessage}</p>;
}
