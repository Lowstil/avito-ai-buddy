import React from 'react';

interface MarkdownViewProps {
  content: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content }) => {
  if (!content) return null;

  // Render inline formatting: bold, italic, inline code, links
  const renderInline = (text: string, keyPrefix: string): React.ReactNode => {
    // Regex matches: **bold**, *italic*, `code`
    const regex = /(\*\*[\s\S]+?\*\*|\*[^\*\n]+?\*|`[^`\n]+?`)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={key} className="font-extrabold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={key}
            className="bg-black/50 text-[#04E061] px-1.5 py-0.5 rounded font-mono text-[11px] border border-white/10"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={key} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }
      return <React.Fragment key={key}>{part}</React.Fragment>;
    });
  };

  // Split lines into structured blocks
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let codeBlock: { lang: string; lines: string[] } | null = null;

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'ul') {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="space-y-1.5 my-2 pl-2">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-200">
                <span className="text-[#04E061] mt-1 shrink-0 text-[10px]">●</span>
                <span className="flex-1 leading-relaxed">{renderInline(item, `ul-${blocks.length}-${idx}`)}</span>
              </li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="space-y-1.5 my-2 pl-2">
            {currentList.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-200">
                <span className="font-bold text-[#00AAFF] shrink-0 text-xs">{idx + 1}.</span>
                <span className="flex-1 leading-relaxed">{renderInline(item, `ol-${blocks.length}-${idx}`)}</span>
              </li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Code block fences
    if (trimmed.startsWith('```')) {
      if (codeBlock) {
        // Close code block
        blocks.push(
          <div key={`code-${blocks.length}`} className="my-2 p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto">
            <pre>{codeBlock.lines.join('\n')}</pre>
          </div>
        );
        codeBlock = null;
      } else {
        flushList();
        codeBlock = { lang: trimmed.slice(3).trim(), lines: [] };
      }
      continue;
    }

    if (codeBlock) {
      codeBlock.lines.push(rawLine);
      continue;
    }

    // Empty lines
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headings: ###, ##, #
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(
        <h4 key={`h4-${blocks.length}`} className="text-xs font-black text-white uppercase tracking-wider mt-3 mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#04E061]" />
          {renderInline(trimmed.replace(/^###\s+/, ''), `h4-${blocks.length}`)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className="text-sm font-black text-white mt-3 mb-1">
          {renderInline(trimmed.replace(/^##\s+/, ''), `h3-${blocks.length}`)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className="text-base font-black text-white mt-3 mb-1">
          {renderInline(trimmed.replace(/^#\s+/, ''), `h2-${blocks.length}`)}
        </h2>
      );
      continue;
    }

    // Unordered list items: -, *, •
    const bulletMatch = trimmed.match(/^[\*\-•]\s+(.+)/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Ordered list items: 1. 2. etc.
    const numMatch = trimmed.match(/^\d+[\.\)]\s+(.+)/);
    if (numMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numMatch[1]);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushList();
      blocks.push(
        <blockquote key={`bq-${blocks.length}`} className="border-l-2 border-[#00AAFF] pl-3 py-1 my-1.5 text-slate-300 italic text-xs bg-white/5 rounded-r-xl">
          {renderInline(trimmed.replace(/^>\s+/, ''), `bq-${blocks.length}`)}
        </blockquote>
      );
      continue;
    }

    // Regular paragraph
    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="leading-relaxed text-xs text-slate-200 my-1">
        {renderInline(trimmed, `p-${blocks.length}`)}
      </p>
    );
  }

  flushList();
  if (codeBlock) {
    blocks.push(
      <div key={`code-unclosed-${blocks.length}`} className="my-2 p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-300 overflow-x-auto">
        <pre>{(codeBlock as { lines: string[] }).lines.join('\n')}</pre>
      </div>
    );
  }

  return <div className="space-y-1">{blocks}</div>;
};
