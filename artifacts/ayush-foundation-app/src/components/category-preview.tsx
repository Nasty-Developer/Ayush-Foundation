import { ArrowRight, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';

const medicineCategories = [
  { title: 'Tablet Medicines', note: 'Everyday tablet care', icon: 'TB', href: '/medicines' },
  { title: 'Vet Medicines', note: 'Veterinary care coming soon', icon: 'VT', href: '/medicines?audience=veterinary' },
  { title: 'General Medicines', note: 'Browse the imported catalogue', icon: 'GM', href: '/medicines?audience=general' },
];

export function CategoryPreview() {
  return (
    <section className="site-container section-rule py-16 md:py-24" aria-labelledby="category-preview-heading">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="eyebrow">Browse by care need</p>
          <h2 id="category-preview-heading" className="mt-3 font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">
            A considered shelf for everyday health.
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            Presentation-only categories to help you find your way around. Product details and availability are confirmed by our local team.
          </p>
        </div>
        <Link to="/medicines" className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="link-browse-all-medicines">
          Browse All Medicines <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {medicineCategories.map((category, index) => (
          <Link
            key={category.title}
            to={category.href}
            className={`group flex min-h-[142px] flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md sm:p-5 ${index === 0 ? 'bg-[hsl(189_35%_94%)]' : ''}`}
            data-testid={`link-category-${index}`}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-xs font-bold tracking-[-0.04em] text-primary">{category.icon}</span>
            <span>
              <span className="block text-sm font-bold leading-5 text-foreground">{category.title}</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">{category.note}</span>
            </span>
            <Circle size={7} fill="currentColor" className="mt-3 text-accent transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}