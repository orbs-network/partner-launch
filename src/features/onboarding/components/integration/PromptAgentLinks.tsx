import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Pass the current prompt to a desktop coding agent. */
export function PromptAgentLinks({ prompt, disabled = false }: { prompt: string; disabled?: boolean }) {
  const codexUrl = `codex://threads/new?prompt=${encodeURIComponent(prompt)}`;
  // Claude truncates deep-link prompts beyond approximately 14,000 characters.
  const claudeUrl = prompt.length <= 14000 ? `claude://code/new?q=${encodeURIComponent(prompt)}` : null;
  const linkClass = "min-h-11 gap-1.5 rounded-xl px-3 text-sm";
  return <div className="mt-3 hidden min-[768px]:block">
    <p className="mb-2 text-xs text-(--muted)">Open a coding agent to continue with this prompt.</p>
    <div className="flex flex-wrap gap-2">
      {disabled ? <Button type="button" variant="secondary" size="sm" className={linkClass} disabled>Open in Codex <ArrowUpRight size={14} aria-hidden="true" /></Button>
        : <Button asChild variant="secondary" size="sm" className={linkClass}><a href={codexUrl}>Open in Codex <ArrowUpRight size={14} aria-hidden="true" /></a></Button>}
      {disabled || !claudeUrl ? <Button type="button" variant="secondary" size="sm" className={linkClass} disabled>Open in Claude Code <ArrowUpRight size={14} aria-hidden="true" /></Button>
        : <Button asChild variant="secondary" size="sm" className={linkClass}><a href={claudeUrl}>Open in Claude Code <ArrowUpRight size={14} aria-hidden="true" /></a></Button>}
    </div>
    {!claudeUrl ? <p className="mt-2 text-xs text-(--muted)">This prompt is too long for the Claude link. Copy it instead.</p> : null}
  </div>;
}
