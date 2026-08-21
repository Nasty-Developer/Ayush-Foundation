import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Search } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { PageFrame, SoftContactCard } from '@/components/page-frame';
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
};

type CatalogResponse = {
  items: CatalogItem[];
  total: number;
  totalPages: number;
};

type Category = { id: number; name: string; displayName: string | null };

export default function MedicinesPage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/catalog/categories')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Unable to load categories'))))
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: '1', pageSize: '24' });
    if (submittedQuery) params.set('q', submittedQuery);
    if (category) params.set('category', category);
    setLoading(true);
    setError('');
    fetch(`/api/catalog/products?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Unable to load medicines'))))
      .then((data: CatalogResponse) => setCatalog(data))
      .catch(() => setError('The medicine catalogue is temporarily unavailable. Please call the team instead.'))
      .finally(() => setLoading(false));
  }, [submittedQuery, category]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
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
            <form className="mt-7 flex gap-2 rounded-2xl border border-border bg-background p-2" onSubmit={submitSearch}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                placeholder="e.g. Paracetamol, Abbott, Vitamin..."
                aria-label="Search medicines"
              />
              <button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" type="submit">
                Search
              </button>
            </form>
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
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.categoryDisplayName || item.category || 'Uncategorised'}</p>
                  <h3 className="mt-3 text-base font-bold leading-6">{item.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.company || 'Company not listed'}</p>
                  {item.drug && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.drug}</p>}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {item.packSize && <span className="rounded-full bg-muted px-3 py-1">{item.packSize}</span>}
                    <span className="rounded-full bg-muted px-3 py-1">Source ID: {item.sourceProductId}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageFrame>
  );
}