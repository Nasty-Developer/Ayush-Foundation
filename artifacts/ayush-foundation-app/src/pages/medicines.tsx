import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Search, ShoppingBag } from 'lucide-react';
import { SiWhatsapp } from 'react-icons/si';
import { Link } from 'react-router-dom';
import { PageFrame, SoftContactCard } from '@/components/page-frame';
import { useCart } from '@/lib/cart';
import { contactDetails } from '@/lib/site-data';
import { loadManifest, loadPage, loadSearchIndex, searchProducts, type CatalogueCategory, type CatalogueProduct } from '@/lib/static-catalogue';

const pageSize = 24;

export default function MedicinesPage() {
  const { add } = useCart();
  const audience = new URLSearchParams(window.location.search).get('audience') === 'veterinary' ? 'vet' : '';
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [category, setCategory] = useState(audience);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<CatalogueCategory[]>([]);
  const [items, setItems] = useState<CatalogueProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchIndex, setSearchIndex] = useState<Awaited<ReturnType<typeof loadSearchIndex>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadManifest()
      .then((manifest) => setCategories(manifest.categories))
      .catch(() => setError('The static medicine catalogue could not be loaded.'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const isFiltered = Boolean(submittedQuery || category);
    const source = isFiltered
      ? (searchIndex ? Promise.resolve(searchIndex) : loadSearchIndex().then((index) => { setSearchIndex(index); return index; }))
      : Promise.resolve(null);
    source
      .then((index) => {
        if (cancelled) return;
        if (index) {
          const matches = searchProducts(index, submittedQuery, category);
          setTotal(matches.length);
          setTotalPages(Math.max(1, Math.ceil(matches.length / pageSize)));
          const pageIds = new Set(matches.slice((page - 1) * pageSize, page * pageSize).map((item) => item.id));
          if (!pageIds.size) { setItems([]); return; }
          const pages = [...new Set([...pageIds].map((id) => Math.ceil(id / 1000)))];
          Promise.all(pages.map(loadPage)).then((pageRecords) => {
            if (!cancelled) setItems(pageRecords.flat().filter((item) => pageIds.has(item.id)).sort((a, b) => a.name.localeCompare(b.name)));
          });
          return;
        }
        return loadManifest().then((manifest) => loadPage(page).then((records) => {
          if (!cancelled) {
            setItems(records.slice(0, pageSize));
            setTotal(manifest.total);
            setTotalPages(Math.ceil(manifest.total / pageSize));
          }
        }));
      })
      .catch(() => { if (!cancelled) setError('The static medicine catalogue could not be loaded.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [submittedQuery, category, page, searchIndex]);

  const visibleCategories = useMemo(() => categories, [categories]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedQuery(query.trim());
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  const veterinaryEmpty = category === 'vet';

  return (
    <PageFrame eyebrow="Medicine desk" title="Find a medicine from the catalogue." description="Browse the imported Ayush Foundation catalogue directly from this website. Search and cart actions continue working even when the service API is offline.">
      <section className="site-container py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Search size={23} /></div>
            <h2 className="mt-7 font-display text-3xl tracking-[-0.04em]">Search real product records.</h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">Search by medicine name, manufacturer, composition, category, or source product ID.</p>
            <form className="mt-7 flex gap-2 rounded-2xl border border-border bg-background p-2" onSubmit={submitSearch}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" placeholder="e.g. Paracetamol, Abbott, Vitamin..." aria-label="Search medicines" />
              <button className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" type="submit">Search</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="sr-only" htmlFor="medicine-category">Filter by category</label>
              <select id="medicine-category" value={category} onChange={(event) => changeCategory(event.target.value)} className="rounded-full border border-border bg-background px-4 py-2 text-sm">
                <option value="">All categories</option>
                {visibleCategories.map((item) => <option key={item.id} value={item.id}>{item.displayName}{item.id === 'vet' ? ' (empty until verified)' : ''}</option>)}
              </select>
              <span className="self-center text-xs text-muted-foreground">{total.toLocaleString()} products found</span>
            </div>
            <div className="mt-8 space-y-3">
              {['Real imported product records remain traceable', 'No stock or price is invented in the browser', 'Secure dispensing and checkout validation stay server-side'].map((step) => <div key={step} className="flex items-center gap-3 rounded-xl bg-muted/70 px-4 py-3"><CheckCircle2 size={17} className="shrink-0 text-primary" /><span className="text-sm font-semibold text-foreground">{step}</span></div>)}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">Call to check <ArrowRight size={16} /></a>
              <a href={contactDetails.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-bold text-primary transition-colors hover:bg-secondary"><SiWhatsapp size={16} aria-hidden="true" /> WhatsApp the team</a>
            </div>
          </div>
          <SoftContactCard />
        </div>
      </section>
      <section className="bg-[hsl(184_29%_94%)] py-12 md:py-16">
        <div className="site-container">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Imported catalogue</p>
          <h2 className="mt-2 font-display text-3xl tracking-[-0.04em]">Medicines and products</h2>
          {loading && <p className="mt-8 text-sm text-muted-foreground">Loading imported medicines…</p>}
          {error && <p className="mt-8 rounded-2xl border border-destructive/30 bg-card p-5 text-sm text-destructive">{error}</p>}
          {!loading && !error && veterinaryEmpty && <div className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-card p-8"><p className="text-lg font-bold text-foreground">Vet Medicines 🐾 is currently empty.</p><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">We keep this category separate until verified veterinary products are available.</p></div>}
          {!loading && !error && !veterinaryEmpty && items.length === 0 && <p className="mt-8 rounded-2xl border border-dashed border-primary/30 bg-card p-8 text-sm text-muted-foreground">No imported medicines match that search.</p>}
          {!loading && !error && !veterinaryEmpty && items.length > 0 && <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-secondary p-4"><img src={item.imageUrl || '/medicine-fallback.svg'} alt="Medicine product placeholder" onError={(event) => { event.currentTarget.src = '/medicine-fallback.svg'; }} className="max-h-full max-w-full object-contain" /></div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.categoryDisplayName}</p>
              <Link to={`/medicines/${item.id}`} className="mt-3 block text-base font-bold leading-6 hover:text-primary">{item.name}</Link>
              <p className="mt-2 text-sm text-muted-foreground">{item.company || 'Company not listed'}</p>
              {item.drug && <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.drug}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">{item.packSize && <span className="rounded-full bg-muted px-3 py-1">{item.packSize}</span>}<span className="rounded-full bg-muted px-3 py-1">ID: {item.sourceProductId}</span></div>
              <p className="mt-3 text-xs font-semibold text-muted-foreground">Price unavailable</p>
              <div className="mt-3 flex gap-2"><Link to={`/medicines/${item.id}`} className="flex-1 rounded-xl border border-primary/25 px-3 py-2.5 text-center text-xs font-bold text-primary">View details</Link><button type="button" disabled={!item.salePrice} onClick={() => add(item)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><ShoppingBag size={14} /> Add</button></div>
            </article>)}</div>
            {totalPages > 1 && <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Medicine catalogue pages"><button type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground disabled:opacity-40"><ChevronLeft size={16} /> Previous</button><span className="text-sm font-semibold text-muted-foreground">Page {page} of {totalPages}</span><button type="button" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-bold text-muted-foreground disabled:opacity-40">Next <ChevronRight size={16} /></button></nav>}
          </>}
        </div>
      </section>
    </PageFrame>
  );
}