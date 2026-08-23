import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Search, ShoppingBag } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { PageFrame, SoftContactCard } from '@/components/page-frame';
import { Link } from 'react-router-dom';
import { useCart } from '@/lib/cart';
import { contactDetails } from '@/lib/site-data';

type CatalogItem = {
  id: number;
  sourceProductId: string;
  name: string;
  company: string | null;
  drug: string | null;
  category: string | null;
  categoryDisplayName: string | null;
  dosageForm: string | null;
  packSize: string | null;
  imageUrl: string | null;
  salePrice: string | null;
  mrp: string | null;
  quantity: string | null;
  stockRecords: number;
};

type CatalogResponse = {
  items: CatalogItem[];
  total: number;
  totalPages: number;
};

type Category = { id: number; name: string; displayName: string | null };

export default function MedicinesPage() {
  const { add } = useCart();
  const audience = new URLSearchParams(window.location.search).get('audience') || '';
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [suggestions, setSuggestions] = useState<Array<Pick<CatalogItem, 'id' | 'name' | 'sourceProductId' | 'company' | 'drug'>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/catalog/categories')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Unable to load categories'))))
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: '24' });
    if (submittedQuery) params.set('q', submittedQuery);
    if (category) params.set('category', category);
    if (audience === 'veterinary' || audience === 'general') params.set('audience', audience);
    setLoading(true);
    setError('');
    fetch(`/api/catalog/products?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Unable to load medicines'))))
      .then((data: CatalogResponse) => setCatalog(data))
      .catch(() => setError('The medicine catalogue is temporarily unavailable. Please call the team instead.'))
      .finally(() => setLoading(false));
  }, [submittedQuery, category, page, audience]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || trimmed === submittedQuery) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(`/api/catalog/autocomplete?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => response.ok ? response.json() : [])
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 180);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, submittedQuery]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
    setPage(1);
    setSuggestions([]);
  }

  return (
    <PageFrame
      eyebrow="Medicine desk"
      title="Find a medicine from the catalogue."
      description="Search the imported medicine catalogue by product, company, drug group, or source identifier. Availability and final dispensing are confirmed by our team."
    >
      <section className="site-container py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
              <Search size={23} />
            </div>
            <h2 className="mt-7 font-display text-3xl tracking-[-0.04em]">Search real product records.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
              Search by brand name, medicine name, composition, category, or source product ID.
            </p>
            <div className="relative">
              <form className="mt-7 flex gap-2 rounded-2xl border border-border bg-background p-2" onSubmit={submitSearch}>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                  placeholder="e.g. Paracetamol, Abbott, Vitamin..."
                  aria-label="Search medicines"
                  role="combobox"
                  aria-expanded={suggestions.length > 0}
                  aria-controls="medicine-suggestions"
                />
                <button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" type="submit">
                  Search
                </button>
              </form>
              {suggestions.length > 0 && (
                <div id="medicine-suggestions" className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-lg" role="listbox">
                  {suggestions.map((item) => (
                    <button key={item.id} type="button" className="block w-full border-b border-border/70 px-4 py-3 text-left last:border-0 hover:bg-secondary" onClick={() => { setQuery(item.name); setSubmittedQuery(item.name); setPage(1); setSuggestions([]); }}>
                      <span className="block text-sm font-bold">{item.name}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.company || 'Company not listed'}{item.drug ? ` · ${item.drug}` : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="medicine-category">Filter by category</label>
              <select
                id="medicine-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm"
              >
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.name.toLocaleLowerCase()}>{item.displayName || item.name}</option>
                ))}
              </select>
           {catalog && <span className="self-center text-xs text-muted-foreground">{catalog.total.toLocaleString()} products found</span>}
            </div>
            <div className="mt-8 space-y-3">
              {['Product, company, category, and drug relationships are preserved', 'Source identifiers remain available for traceability', 'Availability and dispensing are confirmed by a person'].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl bg-muted/70 px-4 py-3">
                  <CheckCircle2 size={17} className="shrink-0 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{step}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">
                Call to check <ArrowRight size={16} />
              </a>
              <a href={contactDetails.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary">
                <SiWhatsapp size={16} aria-hidden="true" /> WhatsApp the team
              </a>
            </div>
          </div>
          <SoftContactCard />
        </div>
      </section>

      <section className="bg-[hsl(184_29%_94%)] py-12 md:py-16">
        <div className="site-container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Imported catalogue</p>
              <h2 className="mt-2 font-display text-3xl tracking-[-0.04em]">Medicines and products</h2>
            </div>
          </div>
          {loading && <p className="mt-8 text-sm text-muted-foreground">Loading imported medicines…</p>}
          {error && <p className="mt-8 rounded-2xl border border-destructive/30 bg-card p-5 text-sm text-destructive">{error}</p>}
          {!loading && !error && catalog?.items.length === 0 && (
            <p className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-card p-8 text-sm text-muted-foreground">No imported medicines match that search.</p>
          )}
          {!loading && !error && catalog && catalog.items.length > 0 && (
            <>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalog.items.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                     <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-secondary p-4">
                        <img src={item.imageUrl || '/medicine-fallback.svg'} alt={item.imageUrl ? item.name : 'Medicine product placeholder'} onError={(event) => { event.currentTarget.src = '/medicine-fallback.svg'; }} className="max-h-full max-w-full object-contain" />
                     </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.categoryDisplayName || item.category || 'Uncategorised'}</p>
                    <Link to={`/medicines/${item.id}`} className="mt-3 block text-base font-bold leading-6 hover:text-primary">{item.name}</Link>
                    <p className="mt-2 text-sm text-muted-foreground">{item.company || 'Company not listed'}</p>
                    {item.drug && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.drug}</p>}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {item.packSize && <span className="rounded-full bg-muted px-3 py-1">{item.packSize}</span>}
                      <span className="rounded-full bg-muted px-3 py-1">Source ID: {item.sourceProductId}</span>
                    </div>
                     <p className="mt-3 text-xs font-semibold text-muted-foreground">Availability information unavailable</p>
                      <div className="mt-3 flex gap-2"><Link to={`/medicines/${item.id}`} className="flex-1 rounded-xl border border-primary/25 px-3 py-2.5 text-center text-xs font-bold text-primary">View details</Link><button type="button" disabled={!item.salePrice} onClick={() => add(item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBag size={14} /> {item.salePrice ? 'Add' : 'Price pending'}</button></div>
                  </article>
                ))}
              </div>
              {catalog.totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Medicine catalogue pages">
                  <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40">
                    <ChevronLeft size={16} /> Previous
                  </button>
                  <span className="text-sm font-semibold text-muted-foreground">Page {page} of {catalog.totalPages}</span>
                  <button type="button" disabled={page === catalog.totalPages} onClick={() => setPage((current) => Math.min(catalog.totalPages, current + 1))} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40">
                    Next <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </PageFrame>
  );
}