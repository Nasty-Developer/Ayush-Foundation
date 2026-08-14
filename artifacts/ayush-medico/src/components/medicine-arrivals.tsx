import { ArrowUpRight, PackageOpen, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { newMedicineArrivals } from '@/lib/home-data';

export function MedicineArrivals() {
  const visibleArrivals = newMedicineArrivals.filter((item) => item.isVisible && item.isNewArrival);

  return (
    <section className="bg-[hsl(184_29%_94%)] py-16 md:py-24" aria-labelledby="arrivals-heading">
      <div className="site-container">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="eyebrow">On the shelf lately</p>
            <h2 id="arrivals-heading" className="mt-3 font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">New Medicine Arrivals</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              A local preview of recent additions. This is not live stock information—please check with the pharmacy before visiting.
            </p>
          </div>
          <Link to="/medicines" className="group inline-flex shrink-0 items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="link-view-all-medicines">
            View All Medicines <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
        {visibleArrivals.length === 0 ? (
          <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-card shadow-sm" data-testid="empty-new-medicine-arrivals">
            <div className="grid items-center gap-8 px-6 py-8 sm:px-10 md:grid-cols-[auto_1fr_auto] md:gap-10 md:py-10">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-secondary text-primary">
                <div className="absolute inset-3 rounded-2xl border border-primary/20" aria-hidden="true" />
                <PackageOpen size={34} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <div className="text-center md:text-left">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">A considered collection</p>
                <h3 className="mt-2 font-display text-2xl leading-tight tracking-[-0.035em] text-foreground">New arrivals will appear here soon.</h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:mx-0">
                  This space stays intentionally clear until Ayush Medico confirms new medicines for the customer catalogue.
                </p>
              </div>
              <Link to="/contact" className="mx-auto inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary md:mx-0" data-testid="link-arrivals-enquire">
                Ask the pharmacy <Search size={16} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleArrivals.map((item) => (
              <article key={item.id} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md" data-testid={`card-arrival-${item.id}`}>
                <div className="flex h-40 items-center justify-center rounded-xl bg-secondary">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-card text-primary shadow-sm"><ShieldCheck size={30} strokeWidth={1.6} aria-hidden="true" /></span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 pt-5">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">{item.category}</span>
                  <span className="text-[0.65rem] font-semibold text-muted-foreground">{item.medicineType === 'veterinary' ? 'Veterinary' : 'General'}</span>
                </div>
                <h3 className="mt-2 text-base font-bold leading-5 text-foreground">{item.name}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}