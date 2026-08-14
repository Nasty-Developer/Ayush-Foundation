import { ArrowRight, ClipboardCheck, Home, Stethoscope, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/page-frame';

const services = [
  { icon: ClipboardCheck, title: 'Medicine availability', copy: 'A quick check with a real member of our team, not a stale catalogue.', href: '/medicines' },
  { icon: Truck, title: 'Local home delivery', copy: 'Dependable delivery for everyday medicines and care essentials in our area.', href: '/contact' },
  { icon: Stethoscope, title: 'Everyday health guidance', copy: 'Practical support for the small questions that come up between appointments.', href: '/contact' },
  { icon: Home, title: 'Repeat care support', copy: 'A familiar place to return to when your routine needs stay consistent.', href: '/contact' },
];

export default function ServicesPage() {
  return (
    <PageFrame eyebrow="Our services" title="Simple support for everyday health." description="No noise, no unnecessary steps—just a thoughtful local pharmacy team ready to make the next thing easier.">
      <section className="site-container py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          {services.map(({ icon: Icon, title, copy, href }, index) => (
            <Link key={title} to={href} className={`group rounded-[1.5rem] border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${index === 0 ? 'bg-[hsl(189_35%_94%)]' : ''}`} data-testid={`link-service-${index}`}>
              <div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Icon size={23} /></span><ArrowRight size={18} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div>
              <h2 className="mt-9 font-display text-2xl tracking-[-0.035em]">{title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{copy}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-primary py-14 text-primary-foreground md:py-20">
        <div className="site-container flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(189_35%_78%)]">Need something else?</p><h2 className="mt-3 font-display text-3xl tracking-[-0.04em]">Ask our team. We’ll point you in the right direction.</h2></div>
          <Link to="/contact" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[hsl(20_72%_69%)] px-5 py-3.5 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5" data-testid="link-services-contact">Get in touch <ArrowRight size={16} /></Link>
        </div>
      </section>
    </PageFrame>
  );
}