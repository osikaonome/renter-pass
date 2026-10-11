import type { ReactNode } from "react";

export function Prose({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 sm:py-20 [&_a]:font-medium [&_a]:text-primary-ink [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-title [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:leading-7 [&_strong]:font-semibold [&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_td]:border-b [&_td]:border-row [&_td]:py-2.5 [&_td]:pr-3 [&_th]:eyebrow [&_th]:border-b [&_th]:border-hairline [&_th]:py-2 [&_th]:pr-3 [&_th]:text-left [&_th]:text-muted [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:leading-7 [&_li]:marker:text-subtle">
      {updated && <p className="eyebrow mt-0! text-muted">{updated}</p>}
      <h1 className="mt-3 font-display text-headline font-semibold sm:text-[2.5rem] sm:leading-12">{title}</h1>
      <div className="text-[16px] text-ink">{children}</div>
    </article>
  );
}
