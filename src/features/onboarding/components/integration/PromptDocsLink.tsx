import { ArrowUpRight } from "lucide-react";

export function PromptDocsLink({ href, children }: { href: string; children: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-medium text-(--link) hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--focus-ring)">{children}<ArrowUpRight size={14} aria-hidden="true" /></a>;
}
