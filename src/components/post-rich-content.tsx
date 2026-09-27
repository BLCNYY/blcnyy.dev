import type { ReactNode } from "react";

import type { NotionBlock } from "@/lib/notion";

type PostRichContentProps = {
  blocks: readonly NotionBlock[];
  fallbackContent: string;
  emptyMessage?: string;
};

type ListBlockType = "bulleted_list_item" | "numbered_list_item";

const getBlockText = (block: NotionBlock) => {
  const richText =
    block.paragraph?.rich_text ??
    block.heading_1?.rich_text ??
    block.heading_2?.rich_text ??
    block.heading_3?.rich_text ??
    block.bulleted_list_item?.rich_text ??
    block.numbered_list_item?.rich_text ??
    block.quote?.rich_text ??
    block.callout?.rich_text ??
    [];

  return richText.map((item) => item.plain_text).join("").trim();
};

const getFallbackParagraphs = (content: string) =>
  content
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

const collectListItems = (
  blocks: readonly NotionBlock[],
  startIndex: number,
  type: ListBlockType,
) => {
  const items: NotionBlock[] = [];
  let index = startIndex;

  while (blocks[index]?.type === type) {
    items.push(blocks[index]);
    index += 1;
  }

  return { items, nextIndex: index };
};

const renderList = (items: readonly NotionBlock[], type: ListBlockType) => {
  const listItems = items.map((item) => (
    <li key={item.id}>{getBlockText(item)}</li>
  ));

  return type === "bulleted_list_item" ? (
    <ul key={`${items[0]?.id}-bullets`}>{listItems}</ul>
  ) : (
    <ol key={`${items[0]?.id}-numbers`}>{listItems}</ol>
  );
};

const renderBlocks = (blocks: readonly NotionBlock[]) => {
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];

    if (
      block.type === "bulleted_list_item" ||
      block.type === "numbered_list_item"
    ) {
      const { items, nextIndex } = collectListItems(blocks, index, block.type);
      nodes.push(renderList(items, block.type));
      index = nextIndex;
      continue;
    }

    const text = getBlockText(block);

    if (!text && block.type !== "divider") {
      index += 1;
      continue;
    }

    switch (block.type) {
      case "heading_1":
        nodes.push(<h2 key={block.id}>{text}</h2>);
        break;
      case "heading_2":
        nodes.push(<h3 key={block.id}>{text}</h3>);
        break;
      case "heading_3":
        nodes.push(<h4 key={block.id}>{text}</h4>);
        break;
      case "quote":
        nodes.push(<blockquote key={block.id}>{text}</blockquote>);
        break;
      case "callout":
        nodes.push(
          <div className="article-callout" key={block.id}>
            {text}
          </div>,
        );
        break;
      case "divider":
        nodes.push(<hr key={block.id} />);
        break;
      default:
        nodes.push(<p key={block.id}>{text}</p>);
        break;
    }

    index += 1;
  }

  return nodes;
};

export function PostRichContent({
  blocks,
  fallbackContent,
  emptyMessage = "Content coming soon.",
}: PostRichContentProps) {
  if (blocks.length > 0) {
    return <>{renderBlocks(blocks)}</>;
  }

  const fallbackParagraphs = getFallbackParagraphs(fallbackContent);

  if (fallbackParagraphs.length > 0) {
    return (
      <>
        {fallbackParagraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 16)}`}>{paragraph}</p>
        ))}
      </>
    );
  }

  return <p>{emptyMessage}</p>;
}

