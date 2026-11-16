import type { ReactNode } from 'react';

/** Renders trusted HTML from the committed content files (only <code>, <b>, <i>, <br>). */
export function Html({ html, as: Tag = 'span', className }: { html: string; as?: 'span' | 'p' | 'div' | 'li'; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** Small, stable string hash (FNV-1a) for deterministic per-card choices. */
export function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const TOK =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`)|\b(const|let|var|function|return|if|else|while|for|async|await|new|class|of|in|this|typeof|instanceof|switch|case|default|break|throw|try|catch|type|interface|as|readonly|never|extends|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b/g;

function highlight(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOK.lastIndex = 0;
  while ((m = TOK.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const cls = m[1] ? 'tc' : m[2] ? 'ts' : m[3] ? 'tk' : 'tn';
    out.push(
      <span key={m.index} className={cls}>
        {m[0]}
      </span>,
    );
    last = TOK.lastIndex;
  }
  if (last < line.length) out.push(line.slice(last));
  return out.length ? out : [' '];
}

interface CodeProps {
  src: string;
  /** Makes lines tappable. Lines are 1-indexed. */
  onLine?: (line: number) => void;
  lineClass?: (line: number) => string;
  lineDisabled?: (line: number) => boolean;
  className?: string;
}

export function Code({ src, onLine, lineClass, lineDisabled, className = '' }: CodeProps) {
  const lines = src.split('\n');
  return (
    <div className={`code ${onLine ? '' : 'static'} ${className}`}>
      {lines.map((l, i) => {
        const n = i + 1;
        const inner = (
          <>
            <span className="no">{n}</span>
            <span>{highlight(l)}</span>
          </>
        );
        const cls = `ln ${lineClass?.(n) ?? ''}`;
        return onLine ? (
          <button key={i} type="button" className={cls} onClick={() => onLine(n)} disabled={lineDisabled?.(n)} aria-label={`Line ${n}: ${l.trim()}`}>
            {inner}
          </button>
        ) : (
          <div key={i} className={cls}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

export function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="meter" role="presentation">
      <i style={{ width: `${Math.round(Math.min(1, value) * 100)}%`, background: color }} />
    </div>
  );
}
