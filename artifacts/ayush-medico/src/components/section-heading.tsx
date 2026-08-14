import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  linkLabel?: string;
  linkHref?: string;
};

export function SectionHeading({ eyebrow, title, description, linkLabel, linkHref }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 font-display text-3xl leading-tight tracking-[-0.035em] text-foreground sm:text-4xl">{title}</h2>
        {description && <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>}
      </div>
      {linkLabel && linkHref && (
        <Link to={linkHref} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground" data-testid={`link-section-${linkLabel.toLowerCase().replaceAll(' ', '-')}`}>
          {linkLabel} <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}