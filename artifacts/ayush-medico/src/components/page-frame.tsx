import { ArrowRight, Clock3, HeartHandshake, PhoneCall, ShieldCheck } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '@/components/site-layout';

type PageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageFrame({ eyebrow, title, description, children }: PageFrameProps) {
  return (
    <SiteLayout>
      <section className="paper-grid border-b border-border/60">
        <div className="site-container py-16 md:py-24">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl leading-[1.02] tracking-[-0.05em] sm:text-6xl" data-testid="text-page-heading">{title}</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
        </div>
      </section>
      {children}
    </SiteLayout>
  );
}

export function SoftContactCard() {
  return (
    <div className="rounded-[1.75rem] bg-primary p-7 text-primary-foreground shadow-md sm:p-9">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(20_72%_69%)] text-foreground"><PhoneCall size={21} /></span>
      <h2 className="mt-7 font-display text-3xl leading-tight tracking-[-0.04em]">Prefer a real conversation?</h2>
      <p className="mt-3 text-sm leading-6 text-[hsl(189_35%_84%)]">Our team is happy to help with a medicine check or a delivery question.</p>
      <a href="tel:+919876543210" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary-foreground px-5 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-0.5" data-testid="link-page-phone">
        +91 98765 43210 <ArrowRight size={16} />
      </a>
    </div>
  );
}

export function PageLinkCard({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link to={href} className="group flex items-center justify-between gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md" data-testid={`link-page-card-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div><p className="text-sm font-bold text-foreground">{label}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>
      <ArrowRight size={18} className="shrink-0 text-primary transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

export function PageIconGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5"><ShieldCheck className="text-primary" size={22} /><p className="mt-5 text-sm font-bold">Genuine sourcing</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Everyday essentials from trusted channels.</p></div>
      <div className="rounded-2xl border border-border bg-card p-5"><HeartHandshake className="text-primary" size={22} /><p className="mt-5 text-sm font-bold">Human support</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Clear answers without the runaround.</p></div>
      <div className="rounded-2xl border border-border bg-card p-5"><Clock3 className="text-primary" size={22} /><p className="mt-5 text-sm font-bold">Here when needed</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Open six days, with local delivery support.</p></div>
    </div>
  );
}