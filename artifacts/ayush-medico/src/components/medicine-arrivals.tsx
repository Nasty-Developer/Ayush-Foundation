import { ArrowUpRight, HeartPulse, Package, ShieldCheck, Thermometer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { newMedicineArrivals } from '@/lib/home-data';

const iconByTone = {
  sun: HeartPulse,
  sky: Thermometer,
  coral: Package,
  mint: ShieldCheck,
} as const;

export function MedicineArrivals() {
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
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {newMedicineArrivals.map((item) => {
            const Icon = iconByTone[item.tone as keyof typeof iconByTone];
            return (
              <article key={item.id} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md" data-testid={`card-arrival-${item.id}`}>
                <div className={`flex h-40 items-center justify-center rounded-xl ${item.tone === 'sun' ? 'bg-[hsl(42_55%_88%)]' : item.tone === 'sky' ? 'bg-[hsl(189_35%_88%)]' : item.tone === 'coral' ? 'bg-[hsl(20_72%_90%)]' : 'bg-[hsl(156_30%_88%)]'}`}>
                  <span className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-card text-primary shadow-sm"><Icon size={30} strokeWidth={1.6} aria-hidden="true" /></span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-5">
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">{item.tag}</span>
                  <span className="text-[0.65rem] font-semibold text-muted-foreground">Preview</span>
                </div>
                <h3 className="mt-2 text-base font-bold leading-5 text-foreground">{item.name}</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}