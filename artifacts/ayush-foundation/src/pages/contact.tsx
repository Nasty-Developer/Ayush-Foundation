import { ArrowRight, Clock3, Mail, MapPin, Phone, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/page-frame';
import { contactDetails } from '@/lib/site-data';

export default function ContactPage() {
  return (
    <PageFrame eyebrow="Contact us" title="We’re just a call away." description="For medicine availability, delivery questions, or anything else on your mind, reach out to the Ayush Foundation team.">
      <section className="site-container grid gap-8 py-14 md:grid-cols-[0.85fr_1.15fr] md:py-20">
        <div className="rounded-[1.75rem] bg-primary p-7 text-primary-foreground sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(189_35%_78%)]">Come by or say hello</p>
          <h2 className="mt-4 font-display text-3xl leading-tight tracking-[-0.04em]">A real person is waiting to help.</h2>
          <div className="mt-10 space-y-5 text-sm text-[hsl(189_35%_86%)]">
            <div className="flex gap-3"><MapPin size={19} className="mt-0.5 shrink-0 text-[hsl(20_72%_69%)]" /><p>{contactDetails.address}</p></div>
            <div className="flex gap-3"><Clock3 size={19} className="mt-0.5 shrink-0 text-[hsl(20_72%_69%)]" /><p>{contactDetails.hours}</p></div>
            <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="flex gap-3 hover:text-primary-foreground" data-testid="link-contact-phone"><Phone size={19} className="mt-0.5 shrink-0 text-[hsl(20_72%_69%)]" /><p>{contactDetails.phone}</p></a>
            <a href={`mailto:${contactDetails.email}`} className="flex gap-3 hover:text-primary-foreground" data-testid="link-contact-email"><Mail size={19} className="mt-0.5 shrink-0 text-[hsl(20_72%_69%)]" /><p>{contactDetails.email}</p></a>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-border bg-card p-7 shadow-sm sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Send size={22} /></div>
          <h2 className="mt-7 font-display text-3xl tracking-[-0.04em]">Tell us how we can help.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">For Phase 1, the fastest way to reach us is by phone or email. We’ll respond as quickly as we can during our opening hours.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-contact-call">Call the pharmacy <Phone size={16} /></a>
            <a href={`mailto:${contactDetails.email}?subject=Hello%20Ayush%20Medico`} className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary" data-testid="link-contact-message">Send an email <Mail size={16} /></a>
          </div>
          <div className="mt-10 rounded-2xl bg-muted p-5">
            <p className="text-sm font-bold text-foreground">Looking for a medicine?</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Share the name or prescription and we’ll check it with our team.</p>
            <Link to="/medicines" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="link-contact-medicines">Check availability <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}