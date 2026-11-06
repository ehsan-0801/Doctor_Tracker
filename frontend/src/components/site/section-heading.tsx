import { cn } from "@/lib/utils";

/** Editorial section label ("01 — Services") with a large heading. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  id,
  className,
  children,
}: {
  index: string;
  eyebrow: string;
  title: string;
  id: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.18em] text-slate-deep uppercase">
        <span className="text-coral-deep">{index}</span>
        <span className="h-px w-8 bg-slate-deep/30" aria-hidden />
        {eyebrow}
      </p>
      <h2 id={id} className="max-w-xl text-3xl leading-tight font-semibold tracking-tight text-balance text-slate-deep sm:text-4xl">
        {title}
      </h2>
      {children}
    </div>
  );
}
