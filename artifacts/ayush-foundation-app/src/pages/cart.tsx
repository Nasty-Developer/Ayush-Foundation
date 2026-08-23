import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageFrame } from '@/components/page-frame';
import { useCart } from '@/lib/cart';

export default function CartPage() {
  const { items, subtotal, hasPrescriptionItem, updateQuantity, remove, clear } = useCart();
  return (
    <PageFrame eyebrow="Your basket" title="Ready when you are." description="Review the medicines you selected before moving to secure checkout. Prices and availability are checked again by the pharmacy server.">
      <section className="site-container py-10 md:py-16">
        {items.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-primary/30 bg-card p-12 text-center">
            <ShoppingBag className="mx-auto text-primary" size={42} />
            <h2 className="mt-5 font-display text-3xl">Your cart is empty.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">Browse the live catalogue to add medicines. We never use the browser cart as the final price source.</p>
            <Link to="/medicines" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground">Browse medicines <ArrowRight size={16} /></Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {items.map(({ product, quantity }) => (
                <article key={product.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-secondary p-2"><img src={product.imageUrl || '/medicine-fallback.svg'} alt="" onError={(event) => { event.currentTarget.src = '/medicine-fallback.svg'; }} className="max-h-full max-w-full object-contain" /></div>
                  <div className="min-w-0 flex-1"><Link to={`/medicines/${product.id}`} className="font-bold hover:text-primary">{product.name}</Link><p className="mt-1 text-xs text-muted-foreground">{product.company || 'Manufacturer not listed'}{product.prescriptionRequired ? ' · Prescription required' : ''}</p><p className="mt-2 text-sm font-bold text-primary">{product.salePrice ? `₹${Number(product.salePrice).toFixed(2)} each` : 'Price to be confirmed'}</p></div>
                  <div className="flex flex-col items-end justify-between"><button type="button" onClick={() => remove(product.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${product.name}`}><Trash2 size={17} /></button><div className="flex items-center rounded-lg border border-border"><button type="button" onClick={() => updateQuantity(product.id, quantity - 1)} className="p-2" aria-label="Decrease quantity"><Minus size={14} /></button><span className="min-w-7 text-center text-sm font-bold">{quantity}</span><button type="button" onClick={() => updateQuantity(product.id, quantity + 1)} className="p-2" aria-label="Increase quantity"><Plus size={14} /></button></div></div>
                </article>
              ))}
              <button type="button" onClick={clear} className="mt-3 text-sm font-bold text-muted-foreground underline underline-offset-4 hover:text-destructive">Clear cart</button>
            </div>
            <aside className="h-fit rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-md">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(189_35%_84%)]">Order summary</p>
              <div className="mt-7 flex items-center justify-between border-b border-primary-foreground/15 pb-5 text-sm"><span>Subtotal</span><strong>{items.every(({ product }) => product.salePrice) ? `₹${subtotal.toFixed(2)}` : 'To be confirmed'}</strong></div>
              {hasPrescriptionItem && <p className="mt-5 rounded-xl bg-[hsl(42_55%_88%)] p-3 text-xs font-semibold leading-5 text-[hsl(35_55%_30%)]">A prescription will be required before checkout can continue.</p>}
              <p className="mt-5 text-xs leading-5 text-[hsl(189_35%_84%)]">No delivery fees, discounts, or taxes are added unless they exist in the current pharmacy data.</p>
              <Link to="/checkout" className="mt-7 flex items-center justify-center gap-2 rounded-full bg-primary-foreground px-5 py-3.5 text-sm font-bold text-primary">Continue to checkout <ArrowRight size={16} /></Link>
            </aside>
          </div>
        )}
      </section>
    </PageFrame>
  );
}