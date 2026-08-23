import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, FileUp, Loader2, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { PageFrame } from '@/components/page-frame';
import { useAuth } from '@/lib/auth';
import { firebaseAuth, requireFirebaseStorage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';
import { useCart } from '@/lib/cart';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'application/pdf']);
const maxFileSize = 10 * 1024 * 1024;

export default function CheckoutPage() {
  const { user, loading: authLoading, isCustomer } = useAuth();
  const { items, subtotal, hasPrescriptionItem, clear } = useCart();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [prescriptionPath, setPrescriptionPath] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user?.displayName) setName(user.displayName); }, [user]);
  if (authLoading) return <PageFrame eyebrow="Secure checkout" title="Checking your session." description="One moment while we confirm your customer account."><div /></PageFrame>;
  if (!isCustomer) return <Navigate to="/account" replace />;
  if (!items.length) return <Navigate to="/cart" replace />;

  async function uploadPrescription() {
    if (!file) return '';
    if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > maxFileSize) throw new Error('Upload a PDF, JPG, or PNG prescription up to 10 MB.');
    const path = `prescriptions/${user!.uid}/${crypto.randomUUID()}`;
    await uploadBytes(ref(requireFirebaseStorage(), path), file, { contentType: file.type, customMetadata: { ownerUid: user!.uid, workflow: 'checkout' } });
    const token = await firebaseAuth?.currentUser?.getIdToken();
    const response = await fetch('/api/customer/prescriptions/register', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ objectPath: path, contentType: file.type, size: file.size }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Prescription upload could not be registered.');
    return path;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const path = hasPrescriptionItem ? (prescriptionPath || await uploadPrescription()) : '';
      if (hasPrescriptionItem && !path) throw new Error('Upload your prescription before continuing.');
      const token = await firebaseAuth?.currentUser?.getIdToken();
      const response = await fetch('/api/customer/checkout/validate', { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })), customerName: name, phone, address: `${address}${landmark ? `, Landmark: ${landmark}` : ''}`, notes, prescriptionPath: path }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Checkout validation failed.');
      setMessage('Your details are validated and ready for the pharmacy team. No payment or stock reservation has been made.');
      clear();
      window.setTimeout(() => navigate('/account'), 900);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Unable to continue checkout.'); } finally { setBusy(false); }
  }

  return (
    <PageFrame eyebrow="Secure checkout" title="A few details, then we’ll take it from here." description="Your cart is checked against current catalogue data before it can move forward.">
      <section className="site-container py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <form onSubmit={submit} className="rounded-[2rem] border border-border bg-card p-6 shadow-sm sm:p-9">
            <div className="flex items-center gap-3"><ShieldCheck className="text-primary" /><div><h2 className="font-display text-3xl">Delivery details</h2><p className="mt-1 text-sm text-muted-foreground">We use your signed-in customer identity.</p></div></div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold">Customer name<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 outline-none focus:border-primary" /></label>
              <label className="text-sm font-bold">Mobile number<input value={phone} onChange={(event) => setPhone(event.target.value)} required pattern="[0-9+() -]{8,}" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 outline-none focus:border-primary" /></label>
              <label className="text-sm font-bold sm:col-span-2">Delivery address<textarea value={address} onChange={(event) => setAddress(event.target.value)} required rows={3} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 outline-none focus:border-primary" /></label>
              <label className="text-sm font-bold">Landmark <span className="font-normal text-muted-foreground">(optional)</span><input value={landmark} onChange={(event) => setLandmark(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 outline-none focus:border-primary" /></label>
              <label className="text-sm font-bold">Delivery notes <span className="font-normal text-muted-foreground">(optional)</span><input value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 outline-none focus:border-primary" /></label>
            </div>
            {hasPrescriptionItem && <div className="mt-8 rounded-2xl border border-[hsl(35_55%_65%)] bg-[hsl(42_55%_94%)] p-5"><p className="flex items-center gap-2 font-bold text-[hsl(35_55%_30%)]"><AlertCircle size={18} /> Prescription required</p><p className="mt-2 text-sm leading-6 text-[hsl(35_42%_35%)]">One or more medicines in your cart require a prescription. It will be kept private and marked pending review.</p><label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[hsl(35_55%_65%)] bg-card p-4 text-sm font-bold text-[hsl(35_55%_30%)]"><FileUp size={20} />{file ? file.name : 'Choose PDF, JPG, or PNG (max 10 MB)'}<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" /></label></div>}
            {error && <p className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm font-semibold text-destructive"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</p>}
            {message && <p className="mt-6 flex items-start gap-2 rounded-xl border border-primary/20 bg-secondary p-4 text-sm font-semibold text-primary"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{message}</p>}
            <button type="submit" disabled={busy} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{busy && <Loader2 size={17} className="animate-spin" />}{busy ? 'Checking securely…' : 'Validate checkout details'}</button>
          </form>
          <aside className="h-fit rounded-[2rem] border border-border bg-card p-7 shadow-sm"><p className="eyebrow">Cart summary</p><div className="mt-5 space-y-4">{items.map(({ product, quantity }) => <div key={product.id} className="flex justify-between gap-4 text-sm"><span>{product.name} <span className="text-muted-foreground">× {quantity}</span></span><strong>₹{((Number(product.salePrice) || 0) * quantity).toFixed(2)}</strong></div>)}</div><div className="mt-6 flex justify-between border-t border-border pt-5 font-bold"><span>Subtotal</span><span className="text-primary">₹{subtotal.toFixed(2)}</span></div><Link to="/cart" className="mt-6 block text-center text-sm font-bold text-primary underline underline-offset-4">Edit cart</Link></aside>
        </div>
      </section>
    </PageFrame>
  );
}