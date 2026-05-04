import { type LucideIcon, Construction } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function PlaceholderPage({ title, description, icon: Icon = Construction }: Props) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
        <Icon className="h-8 w-8 text-primary-foreground" />
      </div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary-glow">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-glow" />
        Coming in this milestone
      </div>
    </div>
  );
}
