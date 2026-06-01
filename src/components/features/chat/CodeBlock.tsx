import { useState } from "react";
import { Copy, Check } from "lucide-react";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);

function sanitizeHighlighted(html: string): string {
  return html.replace(/<(\/?)(\w+)([^>]*)>/g, (_, slash, tag, attrs) => {
    const allowed = ["span", "br"];
    if (!allowed.includes(tag.toLowerCase())) return "";
    if (tag.toLowerCase() === "br") return `<${slash}br>`;
    const sanitized = attrs.replace(/[^a-zA-Z0-9\-_= "'"]/g, "");
    return `<${slash}span${sanitized}>`;
  });
}

interface CodeBlockProps {
  language: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const detectedLang = language || hljs.highlightAuto(code).language || "plaintext";

  const highlighted = sanitizeHighlighted(
    language
      ? hljs.highlight(code, { language: detectedLang }).value
      : hljs.highlightAuto(code).value,
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {detectedLang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground opacity-0 transition-all duration-200 hover:bg-white/5 hover:text-foreground group-hover:opacity-100"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              Copied
            </>
          ) : (
            <>
              <Copy size={12} />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="m-0">
          <code
            className={`hljs language-${detectedLang} font-mono text-[13px] leading-relaxed`}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
}
