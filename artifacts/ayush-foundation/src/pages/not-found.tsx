import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteLayout } from '@/components/site-layout';

export default function NotFound() {
  return (
    <SiteLayout>
      <section className="paper-grid flex min-h-[calc(100dvh-9rem)] items-center py-16" aria-labelledby="not-found-heading">
        <div className="site-container">
          <div className="max-w-xl rounded-[2rem] border border-border bg-card p-7 shadow-md sm:p-10">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Compass size={27} aria-hidden="true" />
            </span>
            <p className="eyebrow mt-8">A wrong turn</p>
            <h1 id="not-found-heading" className="mt-3 font-display text-4xl leading-tight tracking-[-0.045em] sm:text-5xl">This page is not on our shelf.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              The link may have moved, but Ayush Medico is still close by. Return home or browse the medicine desk.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-not-found-home">
                <ArrowLeft size={16} /> Back home
              </Link>
              <Link to="/medicines" className="inline-flex items-center justify-center rounded-full border border-primary/25 px-5 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-secondary" data-testid="link-not-found-medicines">
                Browse medicines
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}