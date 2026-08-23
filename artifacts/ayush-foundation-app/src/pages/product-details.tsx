import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageFrame } from '@/components/page-frame';
import { useCart, type CartProduct } from '@/lib/cart';

type Product = CartProduct & {
  drug: string | null;
  category: string | null;
  categoryDisplayName: string | null;
  active: boolean;
  productInfo: Record<string, unknown> | null;
  stockRecords: number;
};

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const productId = Number(id);
    if (!Number.isInteger(productId) || productId <= 0) {
      setError('This medicine could not be found.');
      setLoading(false);
      return;
    }
    fetch(`/api/catalog/products/${productId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('This medicine is no longer available.')))
      .then((data: Product) => setProduct(data))
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : 'Unable to load this medicine.'))
      .finally(() => setLoading(false));
  }, [id]);

  function addToCart() {
    if (!product) return;
    add(product, quantity);
    setAdded(true);
  }

  return (
    <PageFrame eyebrow="Medicine details" title={loading ? 'Loading medicine details.' : product?.name ?? 'Medicine not found.'} description={product ? 'Product information shown from the current Ayush Foundation catalogue.' : 'We could not find an active product with that reference.'}>
      <section className="site-container py-10 md:py-16">
        {loading && <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">Loading the catalogue record…</div>}
        {error && !loading && <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-sm font-semibold text-destructive">{error}<Link to="/medicines" className="mt-5 inline-flex items-center gap-2 text-primary underline"><ArrowLeft size={16} /> Back to medicines</Link></div>}
        {product && !loading && (
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-border bg-card p-8">
              <img src={product.imageUrl || '/medicine-fallback.svg'} alt={product.imageUrl ? product.name : 'Medicine product placeholder'} onError={(event) => { event.currentTarget.src = '/medicine-fallback.svg'; }} className="max-h-80 max-w-full object-contain" />
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-7 shadow-sm sm:p-10">
              <p className="eyebrow">{product.categoryDisplayName || product.category || 'Catalogue product'}</p>
              <h2 className="mt-3 font-display text-4xl tracking-[-0.04em]">{product.name}</h2>
              <p className="mt-3 text-base text-muted-foreground">{product.company || 'Manufacturer not listed'}{product.drug ? ` · ${product.drug}` : ''}</p>
              <div className="mt-6 flex flex-wrap gap-2 text-sm text-muted-foreground">
                {product.dosageForm && <span className="rounded-full bg-muted px-3 py-1.5">{product.dosageForm}</span>}
                {product.packSize && <span className="rounded-full bg-muted px-3 py-1.5">{product.packSize}</span>}
                <span className="rounded-full bg-muted px-3 py-1.5">Source ID: {product.sourceProductId}</span>
              </div>
              <div className="mt-8 flex flex-wrap items-end gap-4">
                {product.salePrice ? <p className="text-3xl font-bold text-primary">₹{Number(product.salePrice).toFixed(2)}</p> : <p className="text-sm font-semibold text-muted-foreground">Price to be confirmed</p>}
                {product.mrp && Number(product.mrp) > Number(product.salePrice) && <p className="text-sm text-muted-foreground line-through">₹{Number(product.mrp).toFixed(2)}</p>}
              </div>
                <p className="mt-3 text-sm font-semibold text-muted-foreground">Availability information unavailable</p>
              {product.prescriptionRequired && <p className="mt-5 flex items-center gap-2 rounded-xl bg-[hsl(42_55%_88%)] px-4 py-3 text-sm font-semibold text-[hsl(35_55%_30%)]"><ShieldCheck size={17} /> Prescription required at checkout</p>}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background px-2">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} className="p-3" aria-label="Decrease quantity"><Minus size={16} /></button>
                  <span className="min-w-8 text-center text-sm font-bold">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(99, value + 1))} className="p-3" aria-label="Increase quantity"><Plus size={16} /></button>
                </div>
                  <button type="button" disabled={!product.salePrice} onClick={addToCart} className="flex-1 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{added ? 'Added to cart' : product.salePrice ? 'Add to cart' : 'Price pending'}</button>
                {added && <button type="button" onClick={() => navigate('/cart')} className="rounded-xl border border-primary/25 px-5 py-3.5 text-sm font-bold text-primary">View cart</button>}
              </div>
              {product.productInfo && Object.entries(product.productInfo).filter(([, value]) => value !== null && value !== '').length > 0 && <div className="mt-9 border-t border-border pt-7"><h3 className="text-sm font-bold">Product information</h3><dl className="mt-4 grid gap-3 sm:grid-cols-2">{Object.entries(product.productInfo).filter(([, value]) => value !== null && value !== '').slice(0, 12).map(([key, value]) => <div key={key}><dt className="text-xs capitalize text-muted-foreground">{key.replaceAll('_', ' ')}</dt><dd className="mt-1 text-sm font-semibold">{String(value)}</dd></div>)}</dl></div>}
            </div>
          </div>
        )}
      </section>
    </PageFrame>
  );
}