import { ArrowRight, BadgeCheck, Box, HeartHandshake, MapPin, MessageCircle, PackageCheck, ShieldCheck, Truck, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { localSpecials } from '@/lib/home-data';

export function SpecialMedicines() {
  return (
    <section className="site-container py-16 md:py-24" aria-labelledby="special-medicines-heading">
      <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
        <div>
          <p className="eyebrow">A local point of view</p>
          <h2 id="special-medicines-heading" className="mt-3 max-w-md font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">
            Special Medicines — Only Available Here
          </h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
            A careful placeholder collection for products and local sourcing stories we may feature in the future. Availability is always confirmed by our team.
          </p>
          <Link to="/medicines" className="group mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-bold text-background transition-colors hover:bg-primary" data-testid="link-special-check-availability">
            Check Availability <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {localSpecials.map((item, index) => (
            <article key={item.id} className={`rounded-2xl border border-border p-5 ${index === 1 ? 'bg-[hsl(189_35%_94%)]' : 'bg-card'}`} data-testid={`card-special-${item.id}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Box size={19} /></span>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.12em] text-primary">{item.label}</p>
              <h3 className="mt-2 text-sm font-bold leading-5 text-foreground">{item.name}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DeliverySection() {
  return (
    <section className="overflow-hidden bg-primary text-primary-foreground" aria-labelledby="delivery-heading">
      <div className="site-container grid items-center gap-12 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(189_35%_78%)]">Home delivery, made human</p>
          <h2 id="delivery-heading" className="mt-4 max-w-xl font-display text-4xl leading-tight tracking-[-0.045em] sm:text-5xl">A little more care, brought closer.</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-[hsl(189_35%_84%)]">
            Need to stay in? Call us and we can talk through local delivery support for your medicines and healthcare essentials.
          </p>
          <Link to="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[hsl(20_72%_69%)] px-5 py-3.5 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5" data-testid="link-delivery-contact">
            Talk about delivery <ArrowRight size={16} />
          </Link>
        </div>
        <div className="relative mx-auto w-full max-w-[390px]">
          <div className="soft-dots absolute -inset-8 rounded-[2.5rem] opacity-50" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-primary-foreground/15 bg-primary-foreground/10 p-6 backdrop-blur">
            <div className="flex items-center gap-3 border-b border-primary-foreground/15 pb-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[hsl(20_72%_69%)] text-foreground"><Truck size={21} /></span>
              <div><p className="text-sm font-bold">Local delivery support</p><p className="mt-1 text-xs text-[hsl(189_35%_78%)]">Arranged with a real pharmacy team</p></div>
            </div>
            <div className="grid gap-4 pt-5 sm:grid-cols-3">
              <div><ShieldCheck size={18} className="text-[hsl(20_72%_69%)]" /><p className="mt-2 text-xs font-semibold">Genuine medicines</p></div>
              <div><PackageCheck size={18} className="text-[hsl(20_72%_69%)]" /><p className="mt-2 text-xs font-semibold">Safe packaging</p></div>
              <div><MessageCircle size={18} className="text-[hsl(20_72%_69%)]" /><p className="mt-2 text-xs font-semibold">Quick response</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhyChooseSection() {
  const reasons = [
    { icon: ShieldCheck, title: 'Genuine by default', description: 'We take sourcing seriously and keep the conversation clear.' },
    { icon: UsersRound, title: 'People, not a portal', description: 'You can speak to a familiar local team when details matter.' },
    { icon: HeartHandshake, title: 'Care that feels close', description: 'Thoughtful support for everyday health needs and routines.' },
    { icon: BadgeCheck, title: 'Straightforward help', description: 'No inflated promises—just practical next steps when you need them.' },
  ];

  return (
    <section className="site-container section-rule py-16 md:py-24" aria-labelledby="why-heading">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Why choose Ayush Medico</p>
          <h2 id="why-heading" className="mt-3 max-w-md font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">A neighbourhood pharmacy should feel like one.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">A calm place to ask, check, collect, and come back to—with the practical care your day actually needs.</p>
        </div>
        <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
          {reasons.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon size={19} /></span>
              <div><h3 className="text-sm font-bold text-foreground">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-border bg-[hsl(189_35%_94%)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3"><MapPin size={19} className="shrink-0 text-primary" /><p className="text-sm font-semibold text-foreground">12, Green Park Market, Bengaluru</p></div>
        <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="link-why-contact">Meet the team <ArrowRight size={16} /></Link>
      </div>
    </section>
  );
}