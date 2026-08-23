import { ArrowRight, PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MedicineArrivals() {
  return (
    <section className="bg-[hsl(184_29%_94%)] py-16 md:py-24" aria-labelledby="arrivals-heading">
      <div className="site-container">
        <div className="max-w-xl">
          <p className="eyebrow">A space for future updates</p>
          <h2 id="arrivals-heading" className="mt-3 font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">New Medicine Arrivals</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
            This section is ready for future pharmacy updates. No product, price, stock, or availability information is shown until it is connected to real data.
          </p>
        </div>
        <div className="mt-10 rounded-[1.75rem] border border-dashed border-primary/30 bg-card px-6 py-12 text-center shadow-sm sm:px-10" data-testid="empty-state-arrivals">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><PackageOpen size={25} /></span>
          <h3 className="mt-6 font-display text-2xl tracking-[-0.03em] text-foreground">No arrivals to display yet.</h3>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">New medicines will appear here once the Ayush Foundation team adds them through the future admin experience.</p>
          <Link to="/contact" className="group mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="link-arrivals-contact">
            Ask the pharmacy team <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}