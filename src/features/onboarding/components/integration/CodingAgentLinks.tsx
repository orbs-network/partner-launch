import { toast } from "sonner";

export function CodingAgentLinks({ prompt, onCopy }: { prompt: string; onCopy: () => Promise<boolean> }) {
  const encoded = encodeURIComponent(prompt);
  const cursorUrl = `https://cursor.com/link/prompt?text=${encoded}`;
  const agents = [
    { name: "Codex", href: `codex://threads/new?prompt=${encoded}`, copyFallback: false },
    { name: "Claude Code", href: `claude://code/new${prompt.length <= 14000 ? `?q=${encoded}` : ""}`, copyFallback: prompt.length > 14000 },
    { name: "Cursor", href: cursorUrl.length <= 10000 ? cursorUrl : "https://cursor.com/agents", copyFallback: cursorUrl.length > 10000 },
  ];
  return <>
    <div className="mt-4 grid grid-cols-3 gap-2" aria-label="Coding agents">
      {agents.map(({ name, href, copyFallback }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer"
        onClick={copyFallback ? () => { void onCopy().then(copied => { if (copied) toast.info(`Prompt copied. Paste it into ${name}.`); }); } : undefined}
        className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-(--edge) px-2 py-2 text-center text-[13px] font-medium transition-colors hover:bg-(--control-hover) hover:text-(--link) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">
        {name}
      </a>)}
    </div>
  </>;
}
