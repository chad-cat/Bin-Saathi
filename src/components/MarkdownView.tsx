import React from 'react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

/**
 * Lightweight, safe Markdown renderer for Tutor Chat (Section 5.9 / Requirement 7).
 * - Renders **bold** text as <strong>
 * - Renders bulleted lists (*, -, •) as <ul><li>
 * - Renders numbered lists (1., 2.) as <ol><li>
 * - Never shows raw ** characters
 */
export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into lines
  const rawLines = content.split('\n');

  // Group lines into blocks (paragraphs, unordered lists, ordered lists)
  type Block =
    | { type: 'p'; text: string }
    | { type: 'ul'; items: string[] }
    | { type: 'ol'; items: string[] };

  const blocks: Block[] = [];
  let currentUl: string[] | null = null;
  let currentOl: string[] | null = null;

  const flushLists = () => {
    if (currentUl && currentUl.length > 0) {
      blocks.push({ type: 'ul', items: currentUl });
      currentUl = null;
    }
    if (currentOl && currentOl.length > 0) {
      blocks.push({ type: 'ol', items: currentOl });
      currentOl = null;
    }
  };

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushLists();
      continue;
    }

    // Bullet list match: "* item", "- item", "• item"
    const bulletMatch = trimmed.match(/^[\*\-•]\s+(.+)$/);
    if (bulletMatch) {
      if (currentOl) flushLists();
      if (!currentUl) currentUl = [];
      currentUl.push(bulletMatch[1]);
      continue;
    }

    // Numbered list match: "1. item", "2) item"
    const numberMatch = trimmed.match(/^\d+[\.\)]\s+(.+)$/);
    if (numberMatch) {
      if (currentUl) flushLists();
      if (!currentOl) currentOl = [];
      currentOl.push(numberMatch[1]);
      continue;
    }

    // Regular line
    flushLists();
    blocks.push({ type: 'p', text: trimmed });
  }

  flushLists();

  /**
   * Parses inline bold (**text**) safely and strips orphan asterisks.
   */
  const renderInline = (text: string): React.ReactNode[] => {
    // Regex splits on **...**
    const parts = text.split(/(\*\*[^*]+?\*\*)/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const inner = part.slice(2, -2);
        return (
          <strong key={idx} className="font-semibold text-[#1C1C1A]">
            {inner}
          </strong>
        );
      }
      // Clean any accidental stray asterisks or underscores
      const cleaned = part.replace(/\*\*/g, '').replace(/\*/g, '');
      return <span key={idx}>{cleaned}</span>;
    });
  };

  return (
    <div className={`space-y-2 text-xs leading-relaxed ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === 'ul') {
          return (
            <ul key={idx} className="my-1.5 list-disc space-y-1 pl-4">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (block.type === 'ol') {
          return (
            <ol key={idx} className="my-1.5 list-decimal space-y-1 pl-4">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        return <p key={idx}>{renderInline(block.text)}</p>;
      })}
    </div>
  );
};
