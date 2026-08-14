import { ArrowRight, Camera, CheckCircle2, FileText, Search } from 'lucide-react';
import { PageFrame, SoftContactCard } from '@/components/page-frame';

export default function MedicinesPage() {
  return (
    <PageFrame eyebrow="Medicine desk" title="Let’s find what you need." description="We’re building a simpler way to check availability with your neighbourhood team. For now, share the name or a photo and we’ll take it from there.">
      <section className="site-container py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Search size={23} /></div>
            <h2 className="mt-7 font-display text-3xl tracking-[-0.04em]">Availability, checked by a person.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Send the medicine name, strength, or a clear prescription photo over WhatsApp or by phone. We’ll confirm availability and guide you on the next step.</p>
            <div className="mt-8 space-y-3">
              {['Share the medicine name or prescription', 'Our team checks the current stock', 'We call or message you back promptly'].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-muted/70 px-4 py-3" data-testid={`text-availability-step-${index}`}>
                  <CheckCircle2 size={17} className="shrink-0 text-primary" /><span className="text-sm font-semibold text-foreground">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="tel:+919876543210" className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-medicines-call">Call to check <ArrowRight size={16} /></a>
              <a href="mailto:hello@ayushmedico.in?subject=Medicine%20availability" className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary" data-testid="link-medicines-email">Email a request <ArrowRight size={16} /></a>
            </div>
          </div>
          <SoftContactCard />
        </div>
      </section>
      <section className="bg-[hsl(184_29%_94%)] py-14 md:py-20">
        <div className="site-container grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6"><FileText className="text-primary" size={22} /><h2 className="mt-6 text-base font-bold">Prescription support</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">If a medicine requires a valid prescription, our team will let you know clearly before arranging anything.</p></div>
          <div className="rounded-2xl border border-border bg-card p-6"><Camera className="text-primary" size={22} /><h2 className="mt-6 text-base font-bold">A photo works too</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A well-lit photo of the prescription or pack helps us identify the exact product faster.</p></div>
        </div>
      </section>
    </PageFrame>
  );
}