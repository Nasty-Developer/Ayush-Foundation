import { ArrowRight, Camera, CheckCircle2, FileText, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SiWhatsapp } from 'react-icons/si';
import { PageFrame, SoftContactCard } from '@/components/page-frame';
import { contactDetails } from '@/lib/site-data';

export default function MedicinesPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; displayName: string | null }>>([]);
  const [results, setResults] = useState<{ items: Array<{ id: number; name: string; company: string | null; drug: string | null; category: string | null; dosageForm: string | null; packSize: string | null; salePrice: string | null; mrp: string | null; quantity: string | null }>; total: number; totalPages: number }>({ items: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch('/api/catalog/categories').then((response) => response.ok ? response.json() : []).then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), pageSize: '12' });
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    setLoading(true);
    void fetch(`/api/catalog/products?${params.toString()}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Catalogue unavailable')))
      .then(setResults)
      .catch((error: unknown) => { if (error instanceof DOMException && error.name === 'AbortError') return; setResults({ items: [], total: 0, totalPages: 0 }); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [category, page, query]);

  return (
    <PageFrame eyebrow="Medicine desk" title="Let’s find what you need." description="We’re building a simpler way to check availability with your neighbourhood team. For now, share the name or a photo and we’ll take it from there.">
      <section className="site-container py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Search size={23} /></div>
            <h2 className="mt-7 font-display text-3xl tracking-[-0.04em]">Availability, checked by a person.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Search the live catalogue first. If you cannot find the exact strength or pack, send us the medicine name or a clear prescription photo and our team will confirm it.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="relative block"><span className="sr-only">Search medicines</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search medicine, brand, generic or product ID" className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-medicine-search" /></label>
              <label className="block"><span className="sr-only">Filter by category</span><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-full min-w-44 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="select-medicine-category"><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.name.toLowerCase()}>{item.displayName || item.name}</option>)}</select></label>
            </div>
            <div className="mt-6 space-y-3" aria-live="polite">
              {loading ? <div className="flex items-center gap-2 rounded-xl bg-muted/70 px-4 py-4 text-sm text-muted-foreground"><Loader2 size={17} className="animate-spin" />Loading the live catalogue…</div> : results.items.length ? results.items.map((item) => <article key={item.id} className="rounded-xl border border-border bg-background px-4 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold">{item.name}</h3><p className="mt-1 text-xs text-muted-foreground">{[item.company, item.drug, item.category].filter(Boolean).join(' · ')}</p><p className="mt-1 text-xs text-muted-foreground">{[item.dosageForm, item.packSize].filter(Boolean).join(' · ')}</p></div><div className="text-right text-sm font-bold">{item.salePrice ? `₹${item.salePrice}` : item.mrp ? `MRP ₹${item.mrp}` : 'Price on request'}<p className="mt-1 text-xs font-normal text-muted-foreground">{Number(item.quantity || 0) > 0 ? 'Stock recorded' : 'Check availability'}</p></div></div></article>) : <p className="rounded-xl bg-muted/70 px-4 py-4 text-sm text-muted-foreground">{query || category ? 'No catalogue match found. Our team can still check the exact prescription or pack for you.' : 'The live catalogue is ready. Search by medicine, company or generic name.'}</p>}
            </div>
            {results.totalPages > 1 && <div className="mt-5 flex items-center justify-between text-sm"><span className="text-muted-foreground">{results.total} results</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">Previous</button><span className="px-2 py-2 text-muted-foreground">{page} / {results.totalPages}</span><button type="button" disabled={page >= results.totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">Next</button></div></div>}
            <div className="mt-8 space-y-3">
              {['Share the medicine name or prescription', 'Our team checks the current stock', 'We call or message you back promptly'].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-muted/70 px-4 py-3" data-testid={`text-availability-step-${index}`}>
                  <CheckCircle2 size={17} className="shrink-0 text-primary" /><span className="text-sm font-semibold text-foreground">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-medicines-call">Call to check <ArrowRight size={16} /></a>
              <a href={contactDetails.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary" data-testid="link-medicines-whatsapp"><SiWhatsapp size={16} aria-hidden="true" /> WhatsApp the team</a>
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