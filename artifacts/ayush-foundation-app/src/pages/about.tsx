import { HeartHandshake, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { PageFrame, PageIconGrid } from '@/components/page-frame';

export default function AboutPage() {
  return (
    <PageFrame eyebrow="About Ayush Foundation" title="A pharmacy with a familiar face." description="Ayush Foundation is a modern neighbourhood pharmacy grounded in an old-fashioned idea: good care starts with listening.">
      <section className="site-container grid gap-12 py-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:py-20">
        <div>
          <p className="eyebrow">Our point of view</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">The best health support is both dependable and human.</h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">We’re here for the everyday moments: a prescription to find, a question to answer, or a family member who needs a little extra help getting what they need.</p>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">Our promise is straightforward—genuine medicines, clear communication, and local service you can return to with confidence.</p>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] bg-[hsl(189_35%_91%)] p-8 sm:p-12">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[18px] border-primary/10" />
          <div className="relative flex min-h-[250px] flex-col justify-end">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><HeartHandshake size={27} /></span>
            <p className="mt-8 max-w-xs font-display text-3xl leading-tight tracking-[-0.04em]">Care that remembers you.</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Not just what you came in for—how we can make the next visit easier.</p>
          </div>
        </div>
      </section>
      <section className="bg-[hsl(184_29%_94%)] py-14 md:py-20">
        <div className="site-container">
          <p className="eyebrow">What guides us</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl tracking-[-0.04em]">Trust is built in the details.</h2>
          <div className="mt-8"><PageIconGrid /></div>
        </div>
      </section>
      <section className="site-container py-14 md:py-20">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6"><MapPin className="text-primary" size={22} /><p className="mt-5 text-sm font-bold">Neighbourhood first</p><p className="mt-2 text-sm leading-6 text-muted-foreground">A local team that understands the rhythms of the community around us.</p></div>
          <div className="rounded-2xl border border-border bg-card p-6"><ShieldCheck className="text-primary" size={22} /><p className="mt-5 text-sm font-bold">Quality, always</p><p className="mt-2 text-sm leading-6 text-muted-foreground">We take genuine sourcing seriously, because your trust is never casual.</p></div>
          <div className="rounded-2xl border border-border bg-card p-6"><UsersRound className="text-primary" size={22} /><p className="mt-5 text-sm font-bold">People at the centre</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Every interaction should leave you feeling heard and looked after.</p></div>
        </div>
      </section>
    </PageFrame>
  );
}