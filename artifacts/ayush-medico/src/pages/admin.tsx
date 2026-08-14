import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import {
  Activity, ArrowLeft, ArrowUpRight, Boxes,
  Check, ChevronRight, ClipboardList, FileText, ImagePlus, LayoutDashboard,
  LogOut, Menu, MessageSquare, Package, Pencil, Pill, Plus, RefreshCw, Search, Settings,
  ShieldCheck, ShoppingBag, Stethoscope, Store, Tag, Trash2, UploadCloud, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ADMIN_COLLECTIONS, ADMIN_EMAIL, countAdminRecords, deleteAdminRecord, listAdminRecords,
  removeAdminImage, saveAdminRecord, uploadAdminImage, type AdminCollection, type AdminRecord,
  type StoredImage,
} from '@/services/admin';
import { isAdminUser, signInAdmin, signOutAdmin, subscribeToAdmin } from '@/services/admin/auth';

type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'image';
type Field = { key: string; label: string; type?: FieldType; options?: string[]; placeholder?: string; wide?: boolean };

const navGroups = [
  { label: 'Workspace', items: [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { path: '/admin/requests', label: 'Medicine requests', icon: ClipboardList },
    { path: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  ]},
  { label: 'Catalogue', items: [
    { path: '/admin/medicines', label: 'Human medicines', icon: Pill },
    { path: '/admin/vet-medicines', label: 'Vet medicines', icon: Stethoscope },
    { path: '/admin/products', label: 'General products', icon: Package },
    { path: '/admin/catalog', label: 'Categories & brands', icon: Tag },
    { path: '/admin/new-arrivals', label: 'New arrivals', icon: ArrowUpRight },
    { path: '/admin/special-medicines', label: 'Special medicines', icon: ShieldCheck },
  ]},
  { label: 'Storefront', items: [
    { path: '/admin/homepage', label: 'Homepage banners', icon: ImagePlus },
    { path: '/admin/content', label: 'Content library', icon: FileText },
    { path: '/admin/settings', label: 'Store settings', icon: Settings },
    { path: '/admin/inventory-sync', label: 'Inventory sync', icon: Boxes },
  ]},
];

const collectionMeta: Record<AdminCollection, { title: string; description: string; singular: string; fields: Field[]; search: string[] }> = {
  medicines: {
    title: 'Human medicines', description: 'Manage the everyday pharmacy catalogue for Ayush Medico.', singular: 'medicine',
    search: ['name', 'genericName', 'brand', 'category'],
    fields: [
      { key: 'name', label: 'Medicine name', placeholder: 'e.g. Dolo 650' }, { key: 'genericName', label: 'Generic name' },
      { key: 'brand', label: 'Brand' }, { key: 'category', label: 'Category' }, { key: 'drugGroup', label: 'Drug group' },
      { key: 'medicineType', label: 'Medicine type', type: 'select', options: ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Drops', 'Injection', 'Other'] },
      { key: 'description', label: 'Description', type: 'textarea', wide: true }, { key: 'image', label: 'Product image', type: 'image' },
      { key: 'price', label: 'Price (INR)', type: 'number' }, { key: 'stock', label: 'Stock', type: 'number' },
      { key: 'visibility', label: 'Visibility', type: 'select', options: ['visible', 'hidden'] },
      { key: 'prescriptionRequired', label: 'Prescription required', type: 'checkbox' },
      { key: 'active', label: 'Active in catalogue', type: 'checkbox' }, { key: 'newArrival', label: 'New arrival', type: 'checkbox' },
      { key: 'specialMedicine', label: 'Special medicine', type: 'checkbox' },
    ],
  },
  vetMedicines: {
    title: 'Vet medicines', description: 'A separate shelf for animal health products.', singular: 'vet medicine',
    search: ['name', 'brand', 'category'],
    fields: [
      { key: 'name', label: 'Medicine name' }, { key: 'brand', label: 'Brand' }, { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true }, { key: 'image', label: 'Product image', type: 'image' },
      { key: 'price', label: 'Price (INR)', type: 'number' }, { key: 'stock', label: 'Stock', type: 'number' },
      { key: 'visibility', label: 'Visibility', type: 'select', options: ['visible', 'hidden'] },
      { key: 'active', label: 'Active in catalogue', type: 'checkbox' },
    ],
  },
  generalProducts: {
    title: 'General products', description: 'Non-medicine essentials stocked by the store.', singular: 'product',
    search: ['name', 'category'],
    fields: [
      { key: 'name', label: 'Product name' }, { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true }, { key: 'image', label: 'Product image', type: 'image' },
      { key: 'price', label: 'Price (INR)', type: 'number' }, { key: 'stock', label: 'Stock', type: 'number' },
      { key: 'visibility', label: 'Visibility', type: 'select', options: ['visible', 'hidden'] },
      { key: 'active', label: 'Active in catalogue', type: 'checkbox' },
    ],
  },
  categories: {
    title: 'Categories', description: 'Organise products for customers and staff.', singular: 'category', search: ['name', 'type'],
    fields: [
      { key: 'name', label: 'Category name' }, { key: 'type', label: 'Applies to', type: 'select', options: ['medicine', 'vetMedicine', 'generalProduct', 'all'] },
      { key: 'description', label: 'Description', type: 'textarea', wide: true }, { key: 'image', label: 'Category image', type: 'image' },
      { key: 'displayOrder', label: 'Display order', type: 'number' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' },
    ],
  },
  brands: {
    title: 'Brands', description: 'Keep brand names and marks consistent across the storefront.', singular: 'brand', search: ['name'],
    fields: [
      { key: 'name', label: 'Brand name' }, { key: 'description', label: 'Description', type: 'textarea', wide: true },
      { key: 'logo', label: 'Logo', type: 'image' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' },
    ],
  },
  banners: {
    title: 'Homepage banners', description: 'Set the first message customers see on the storefront.', singular: 'banner', search: ['headline', 'eyebrow', 'ctaText'],
    fields: [
      { key: 'eyebrow', label: 'Eyebrow' }, { key: 'headline', label: 'Headline' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true }, { key: 'image', label: 'Banner image', type: 'image' },
      { key: 'ctaText', label: 'CTA text' }, { key: 'ctaDestination', label: 'CTA destination' },
      { key: 'displayOrder', label: 'Display order', type: 'number' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' },
    ],
  },
  newArrivals: {
    title: 'New arrivals', description: 'Feature catalogue records by product ID.', singular: 'new arrival', search: ['productId', 'productType'],
    fields: [
      { key: 'productId', label: 'Product ID' }, { key: 'productType', label: 'Product type', type: 'select', options: ['medicine', 'vetMedicine', 'generalProduct'] },
      { key: 'displayOrder', label: 'Display order', type: 'number' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' },
    ],
  },
  specialMedicines: {
    title: 'Special medicines', description: 'Curate high-priority or special-care medicines.', singular: 'special medicine', search: ['productId', 'productType'],
    fields: [
      { key: 'productId', label: 'Product ID' }, { key: 'productType', label: 'Product type', type: 'select', options: ['medicine', 'vetMedicine'] },
      { key: 'displayOrder', label: 'Display order', type: 'number' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' },
    ],
  },
  orders: {
    title: 'Orders', description: 'A searchable queue for customer orders.', singular: 'order', search: ['customerName', 'phone', 'status'],
    fields: [
      { key: 'customerName', label: 'Customer name' }, { key: 'phone', label: 'Phone' }, { key: 'items', label: 'Items', type: 'textarea', wide: true },
      { key: 'address', label: 'Address', type: 'textarea', wide: true }, { key: 'paymentStatus', label: 'Payment status', type: 'select', options: ['pending', 'paid', 'failed', 'refunded'] },
      { key: 'prescriptionStatus', label: 'Prescription status', type: 'select', options: ['not_required', 'pending', 'verified', 'rejected'] },
      { key: 'status', label: 'Order status', type: 'select', options: ['pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled'] },
    ],
  },
  medicineRequests: {
    title: 'Medicine requests', description: 'Follow up on medicines customers could not find.', singular: 'request', search: ['customerName', 'phone', 'medicineRequested', 'status'],
    fields: [
      { key: 'customerName', label: 'Customer name' }, { key: 'phone', label: 'Phone' }, { key: 'medicineRequested', label: 'Medicine requested' },
      { key: 'quantity', label: 'Quantity', type: 'number' }, { key: 'message', label: 'Message', type: 'textarea', wide: true },
      { key: 'prescriptionReference', label: 'Prescription reference' }, { key: 'status', label: 'Request status', type: 'select', options: ['new', 'contacted', 'fulfilled', 'closed'] },
    ],
  },
  inquiries: {
    title: 'Inquiries', description: 'Customer conversations that need a human response.', singular: 'inquiry', search: ['name', 'email', 'phone', 'message', 'status'],
    fields: [
      { key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
      { key: 'message', label: 'Message', type: 'textarea', wide: true }, { key: 'status', label: 'Status', type: 'select', options: ['new', 'in_progress', 'resolved'] },
      { key: 'read', label: 'Marked as read', type: 'checkbox' },
    ],
  },
  faqs: {
    title: 'FAQs', description: 'Answers to the practical questions customers ask most.', singular: 'FAQ', search: ['question', 'answer'],
    fields: [{ key: 'question', label: 'Question', wide: true }, { key: 'answer', label: 'Answer', type: 'textarea', wide: true }, { key: 'displayOrder', label: 'Display order', type: 'number' }, { key: 'published', label: 'Published', type: 'checkbox' }],
  },
  testimonials: {
    title: 'Testimonials', description: 'Customer words, reviewed before they appear publicly.', singular: 'testimonial', search: ['customerName', 'testimonial'],
    fields: [{ key: 'customerName', label: 'Customer name' }, { key: 'rating', label: 'Rating', type: 'number' }, { key: 'testimonial', label: 'Testimonial', type: 'textarea', wide: true }, { key: 'image', label: 'Photo', type: 'image' }, { key: 'published', label: 'Published', type: 'checkbox' }],
  },
  announcements: {
    title: 'Announcements', description: 'Operational notices for the storefront.', singular: 'announcement', search: ['title', 'body'],
    fields: [{ key: 'title', label: 'Title' }, { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'normal', 'high'] }, { key: 'body', label: 'Body', type: 'textarea', wide: true }, { key: 'displayOrder', label: 'Display order', type: 'number' }, { key: 'enabled', label: 'Enabled', type: 'checkbox' }],
  },
  legal: {
    title: 'Legal & compliance', description: 'Publish the policy pages customers rely on.', singular: 'legal page', search: ['title', 'body'],
    fields: [{ key: 'title', label: 'Title' }, { key: 'body', label: 'Body', type: 'textarea', wide: true }, { key: 'published', label: 'Published', type: 'checkbox' }],
  },
  settings: {
    title: 'Store settings', description: 'The details customers use to find and contact the pharmacy.', singular: 'settings record', search: ['businessName', 'location', 'phone'],
    fields: [{ key: 'businessName', label: 'Business name' }, { key: 'location', label: 'Location' }, { key: 'address', label: 'Address', type: 'textarea', wide: true }, { key: 'phone', label: 'Phone' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'hours', label: 'Hours', type: 'textarea', wide: true }, { key: 'storeStatus', label: 'Store status', type: 'select', options: ['open', 'closed', 'temporarily_unavailable'] }],
  },
};

const titleForPath: Record<string, string> = {
  '/admin': 'Overview', '/admin/catalog': 'Categories & brands', '/admin/content': 'Content library',
  '/admin/homepage': 'Homepage', '/admin/inventory-sync': 'Inventory sync',
};
const pathCollection: Record<string, AdminCollection> = {
  '/admin/medicines': 'medicines', '/admin/vet-medicines': 'vetMedicines', '/admin/products': 'generalProducts',
  '/admin/new-arrivals': 'newArrivals', '/admin/special-medicines': 'specialMedicines', '/admin/orders': 'orders',
  '/admin/requests': 'medicineRequests', '/admin/inquiries': 'inquiries', '/admin/settings': 'settings',
};

function valueText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value);
}

function formText(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value, null, 2);
  return valueText(value);
}

function statusTone(value: unknown): 'default' | 'secondary' | 'destructive' | 'outline' {
  const status = valueText(value).toLowerCase();
  if (['active', 'enabled', 'published', 'paid', 'delivered', 'verified', 'fulfilled', 'resolved', 'open'].includes(status)) return 'default';
  if (['cancelled', 'failed', 'rejected', 'closed', 'hidden'].includes(status)) return 'destructive';
  if (['pending', 'new', 'processing', 'in_progress', 'contacted'].includes(status)) return 'secondary';
  return 'outline';
}

function RecordStatus({ value }: { value: unknown }) {
  const text = valueText(value) || 'Not set';
  return <Badge variant={statusTone(value)} data-testid={`status-record-${text}`}>{text.replaceAll('_', ' ')}</Badge>;
}

function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await signInAdmin(email, password); toast({ title: 'Signed in', description: 'Welcome to the Ayush Medico operations desk.' }); navigate('/admin'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to sign in. Check the account details.'); }
    finally { setBusy(false); }
  };
  return (
    <main className="admin-shell flex min-h-[100dvh] items-center justify-center px-5 py-10">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_80px_hsl(var(--foreground)/.12)] md:grid-cols-[.9fr_1.1fr]">
        <section className="paper-grid bg-primary p-8 text-primary-foreground md:p-12">
          <Link to="/" className="mb-20 inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground/85" data-testid="link-public-store"><ArrowLeft className="size-4" /> Ayush Medico</Link>
          <div className="admin-login-mark mb-8 grid size-16 place-items-center rounded-xl bg-accent text-foreground"><Stethoscope className="size-8" /></div>
          <p className="admin-kicker !text-accent">Private operations desk</p>
          <h1 className="mt-4 max-w-sm font-display text-4xl leading-tight md:text-5xl">The calm behind the counter.</h1>
          <p className="mt-5 max-w-sm text-sm leading-6 text-primary-foreground/75">One clear place to keep the Kurla West catalogue, customer queues, and storefront details in order.</p>
        </section>
        <section className="p-7 md:p-12">
          <div className="mb-9"><p className="admin-kicker">Administrator access</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Sign in to continue</h2><p className="mt-2 text-sm text-muted-foreground">Use the authorised pharmacy account.</p></div>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2"><Label htmlFor="admin-email">Email address</Label><Input id="admin-email" data-testid="input-admin-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required /></div>
            <div className="space-y-2"><Label htmlFor="admin-password">Password</Label><Input id="admin-password" data-testid="input-admin-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></div>
            {error && <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive" data-testid="error-admin-login">{error}</div>}
            <Button className="w-full" size="lg" disabled={busy} data-testid="button-admin-login">{busy ? 'Checking credentials…' : 'Sign in securely'}<ChevronRight className="size-4" /></Button>
          </form>
          <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Restricted to the Ayush Medico administrator</p>
        </section>
      </div>
    </main>
  );
}

function useRecords(collectionName: AdminCollection, search: string, status: string, refreshKey: number) {
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRecords(await listAdminRecords(collectionName, { search, status: status === 'all' ? undefined : status })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load these records.'); }
    finally { setLoading(false); }
  }, [collectionName, search, status, refreshKey]);
  useEffect(() => { void load(); }, [load]);
  return { records, loading, error, reload: load };
}

function ImageField({ field, value, onChange }: { field: Field; value: unknown; onChange: (value: unknown) => void }) {
  const [preview, setPreview] = useState(value && typeof value === 'object' ? valueText((value as StoredImage).url) : '');
  useEffect(() => {
    if (value && typeof value === 'object' && '__file' in value) return;
    setPreview(value && typeof value === 'object' ? valueText((value as StoredImage).url) : '');
  }, [value]);
  const choose = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setPreview(URL.createObjectURL(file)); onChange({ ...(typeof value === 'object' ? value : {}), __file: file });
  };
  return <div className="space-y-2 md:col-span-2"><Label>{field.label}</Label><div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/[.025] p-3">
    <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted text-muted-foreground">{preview ? <img src={preview} alt="" className="size-full object-cover" /> : <ImagePlus className="size-5" />}</div>
    <div className="flex-1"><p className="text-sm font-medium">{preview ? 'Image ready to upload' : 'Add an image'}</p><p className="mt-1 text-xs text-muted-foreground">Preview first; only the URL and storage path are saved.</p></div>
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs font-semibold hover:bg-muted"><UploadCloud className="size-4" /> Choose file<input type="file" accept="image/*" className="sr-only" onChange={choose} data-testid={`input-image-${field.key}`} /></label>
    {preview && <Button type="button" variant="ghost" size="icon" onClick={() => { setPreview(''); onChange(undefined); }} data-testid={`button-remove-image-${field.key}`}><X className="size-4" /></Button>}
  </div></div>;
}

function RecordForm({ collection, record, onDone, onCancel }: { collection: AdminCollection; record?: AdminRecord; onDone: () => void; onCancel: () => void }) {
  const meta = collectionMeta[collection]; const { toast } = useToast();
  const [form, setForm] = useState<Record<string, unknown>>(() => ({ ...record }));
  const [busy, setBusy] = useState(false);
  const set = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true);
    try {
      const payload = { ...form }; delete payload.id;
      for (const field of meta.fields) {
        if (field.type === 'image') {
          const image = payload[field.key] as (StoredImage & { __file?: File }) | undefined;
          if (image?.__file) {
            const uploaded = await uploadAdminImage(image.__file, collection, record?.[field.key] as StoredImage | undefined);
            payload[field.key] = uploaded;
          } else if (image?.url) { payload[field.key] = { url: image.url, storagePath: image.storagePath }; }
          else { if (record?.[field.key]) await removeAdminImage(record[field.key] as StoredImage); delete payload[field.key]; }
        }
      }
      if (typeof payload.items === 'string' && payload.items.trim()) {
        try { payload.items = JSON.parse(payload.items); } catch { /* Keep free-form item notes if they are not JSON. */ }
      }
      await saveAdminRecord(collection, payload, record?.id);
      toast({ title: record ? 'Record updated' : 'Record added', description: `${meta.singular} is now saved.` }); onDone();
    } catch (err) { toast({ title: 'Could not save record', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' }); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 md:grid-cols-2">
    {meta.fields.map((field) => {
      const value = form[field.key];
      if (field.type === 'image') return <ImageField key={field.key} field={field} value={value} onChange={(next) => set(field.key, next)} />;
      if (field.type === 'checkbox') return <label key={field.key} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border bg-muted/30 px-3 text-sm"><input type="checkbox" checked={Boolean(value)} onChange={(e) => set(field.key, e.target.checked)} data-testid={`input-${field.key}`} className="size-4 accent-[hsl(var(--primary))]" /><span>{field.label}</span></label>;
      if (field.type === 'textarea') return <div key={field.key} className={field.wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}><Label htmlFor={`field-${field.key}`}>{field.label}</Label><Textarea id={`field-${field.key}`} data-testid={`input-${field.key}`} value={formText(value)} placeholder={field.placeholder} onChange={(e) => set(field.key, e.target.value)} /></div>;
      if (field.type === 'select') return <div key={field.key} className="space-y-2"><Label htmlFor={`field-${field.key}`}>{field.label}</Label><select id={`field-${field.key}`} data-testid={`input-${field.key}`} value={valueText(value) || field.options?.[0] || ''} onChange={(e) => set(field.key, e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="" disabled>Select {field.label.toLowerCase()}</option>{field.options?.map((option) => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select></div>;
      return <div key={field.key} className={field.wide ? 'space-y-2 md:col-span-2' : 'space-y-2'}><Label htmlFor={`field-${field.key}`}>{field.label}</Label><Input id={`field-${field.key}`} data-testid={`input-${field.key}`} type={field.type === 'number' ? 'number' : 'text'} value={valueText(value)} placeholder={field.placeholder} onChange={(e) => set(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)} /></div>;
    })}
  </div><DialogFooter><Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-record">Cancel</Button><Button type="submit" disabled={busy} data-testid="button-save-record">{busy ? 'Saving…' : record ? 'Save changes' : `Add ${meta.singular}`}<Check className="size-4" /></Button></DialogFooter></form>;
}

function CollectionManager({ collection, compact = false }: { collection: AdminCollection; compact?: boolean }) {
  const meta = collectionMeta[collection]; const [search, setSearch] = useState(''); const [status, setStatus] = useState('all'); const [refreshKey, setRefreshKey] = useState(0);
  const { records, loading, error, reload } = useRecords(collection, search, status, refreshKey); const [editing, setEditing] = useState<AdminRecord | undefined>(); const [open, setOpen] = useState(false); const [deleting, setDeleting] = useState<AdminRecord | undefined>(); const { toast } = useToast();
  const refresh = () => { setRefreshKey((key) => key + 1); void reload(); };
  const remove = async () => {
    if (!deleting) return;
    try {
      for (const field of meta.fields.filter((item) => item.type === 'image')) {
        const image = deleting[field.key];
        if (image && typeof image === 'object') {
          await removeAdminImage(image as StoredImage);
        }
      }
      await deleteAdminRecord(collection, deleting.id);
      toast({ title: 'Record deleted' });
      setDeleting(undefined);
      refresh();
    } catch (err) {
      toast({ title: 'Could not delete record', description: err instanceof Error ? err.message : 'Try again.', variant: 'destructive' });
    }
  };
  return <section className="space-y-5">
    {!compact && <PageHeading title={meta.title} description={meta.description} action={<Button onClick={() => { setEditing(undefined); setOpen(true); }} data-testid={`button-add-${collection}`}><Plus className="size-4" /> Add {meta.singular}</Button>} />}
    <Card className="admin-panel overflow-hidden"><CardHeader className="border-b bg-card/60 pb-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><CardTitle className="text-base">{compact ? meta.title : 'Records'}</CardTitle><CardDescription>{records.length} loaded</CardDescription></div><div className="flex flex-wrap gap-2"><div className="relative min-w-[190px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder={`Search ${meta.title.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} data-testid={`input-search-${collection}`} /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid={`select-status-${collection}`}><option value="all">All statuses</option><option value="active">Active</option><option value="enabled">Enabled</option><option value="published">Published</option><option value="pending">Pending</option><option value="new">New</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><Button variant="outline" size="icon" onClick={refresh} aria-label="Refresh records" data-testid={`button-refresh-${collection}`}><RefreshCw className="size-4" /></Button></div></div></CardHeader><CardContent className="p-0">
      {loading ? <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="admin-skeleton h-12 rounded-lg" />)}</div> : error ? <div className="p-10 text-center"><p className="font-medium">Records could not be loaded.</p><p className="mt-1 text-sm text-muted-foreground">{error}</p><Button onClick={refresh} variant="outline" className="mt-4" data-testid={`button-retry-${collection}`}>Try again</Button></div> : records.length === 0 ? <EmptyState title={`No ${meta.title.toLowerCase()} yet`} description="When records are added in Firestore, they will appear here." onAdd={() => { setEditing(undefined); setOpen(true); }} singular={meta.singular} /> :
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground"><th className="px-5 py-3">Record</th><th className="px-5 py-3">Details</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="admin-table-row border-b last:border-0"><td className="max-w-[280px] px-5 py-4"><div className="font-medium">{valueText(record.name || record.headline || record.title || record.customerName || record.question || record.productId) || 'Untitled record'}</div><div className="mt-1 font-mono text-[10px] text-muted-foreground">{record.id}</div></td><td className="max-w-[330px] px-5 py-4 text-muted-foreground"><div className="line-clamp-2">{valueText(record.description || record.message || record.body || record.genericName || record.phone || record.productType) || '—'}</div>{record.price !== undefined && <div className="admin-mono mt-1 text-foreground">₹{valueText(record.price)}</div>}</td><td className="px-5 py-4"><RecordStatus value={record.status || (record.active ? 'active' : record.enabled ? 'enabled' : record.published ? 'published' : '—')} /></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => { setEditing(record); setOpen(true); }} aria-label="Edit record" data-testid={`button-edit-${collection}-${record.id}`}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" onClick={() => setDeleting(record)} aria-label="Delete record" data-testid={`button-delete-${collection}-${record.id}`}><Trash2 className="size-4 text-destructive" /></Button></div></td></tr>)}</tbody></table></div>}
    </CardContent></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editing ? `Edit ${meta.singular}` : `Add ${meta.singular}`}</DialogTitle><DialogDescription>{meta.description}</DialogDescription></DialogHeader><RecordForm collection={collection} record={editing} onDone={() => { setOpen(false); refresh(); }} onCancel={() => setOpen(false)} /></DialogContent></Dialog>
    <Dialog open={Boolean(deleting)} onOpenChange={(next) => !next && setDeleting(undefined)}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Delete this record?</DialogTitle><DialogDescription>This action permanently removes the Firestore record. Images linked to it will also be removed where possible.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleting(undefined)} data-testid="button-cancel-delete">Keep record</Button><Button variant="destructive" onClick={() => void remove()} data-testid="button-confirm-delete">Delete record</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}

function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="admin-kicker">Ayush Medico / Admin</p><h1 className="mt-2 font-display text-3xl text-foreground md:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}

function EmptyState({ title, description, onAdd, singular }: { title: string; description: string; onAdd?: () => void; singular?: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-16 text-center"><div className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><ClipboardList className="size-6" /></div><h3 className="mt-5 text-base font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{onAdd && <Button className="mt-5" onClick={onAdd} data-testid="button-empty-add"><Plus className="size-4" /> Add {singular}</Button>}</div>;
}

function Overview() {
  const [counts, setCounts] = useState<Record<string, number>>({}); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [settings, setSettings] = useState<AdminRecord[]>([]); const [refreshKey, setRefreshKey] = useState(0);
  const load = useCallback(async () => { setLoading(true); setError(''); try { const values = await Promise.all(ADMIN_COLLECTIONS.map((name) => countAdminRecords(name).then((count) => [name, count] as const))); setCounts(Object.fromEntries(values)); setSettings(await listAdminRecords('settings', { limit: 1 })); } catch (err) { setError(err instanceof Error ? err.message : 'Could not reach Firestore.'); } finally { setLoading(false); } }, [refreshKey]);
  useEffect(() => { void load(); }, [load]);
  const store = settings[0]; const storeStatus = valueText(store?.storeStatus) || 'Not configured';
  const cards = [{ label: 'Human medicines', collection: 'medicines', value: counts.medicines, icon: Pill, path: '/admin/medicines' }, { label: 'Vet medicines', collection: 'vetMedicines', value: counts.vetMedicines, icon: Stethoscope, path: '/admin/vet-medicines' }, { label: 'General products', collection: 'generalProducts', value: counts.generalProducts, icon: Package, path: '/admin/products' }, { label: 'Open orders', collection: 'orders', value: counts.orders, icon: ShoppingBag, path: '/admin/orders' }];
  return <div className="space-y-7"><PageHeading title="Good morning, pharmacist." description="A quick read of what is stocked, waiting, and visible across the Ayush Medico storefront." action={<Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading} data-testid="button-refresh-overview"><RefreshCw className="size-4" /> Refresh view</Button>} />
    {error && <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive" data-testid="error-overview"><span>{error}</span><Button size="sm" variant="outline" onClick={() => setRefreshKey((key) => key + 1)} data-testid="button-retry-overview">Retry</Button></div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <Link to={card.path} key={card.collection} className="group rounded-xl border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5" data-testid={`card-count-${card.collection}`}><div className="flex items-start justify-between"><div className="grid size-10 place-items-center rounded-lg bg-secondary text-primary"><card.icon className="size-5" /></div><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div><p className="mt-6 text-sm text-muted-foreground">{card.label}</p><p className="admin-mono mt-1 text-3xl font-semibold">{loading ? '—' : card.value ?? 0}</p></Link>)}</div>
    <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><Card className="admin-panel"><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Activity className="size-4 text-primary" /> Store pulse</CardTitle><CardDescription>Live status from the settings collection.</CardDescription></CardHeader><CardContent><div className="flex items-center gap-4 rounded-xl border bg-muted/25 p-4"><span className={`size-3 rounded-full ${storeStatus === 'open' ? 'bg-primary' : 'bg-accent'}`} /><div><p className="font-medium">{valueText(store?.businessName) || 'Ayush Medico'}</p><p className="mt-1 text-sm text-muted-foreground">{valueText(store?.location) || 'Kurla West, Mumbai'} · {storeStatus.replaceAll('_', ' ')}</p></div><Badge className="ml-auto" variant={storeStatus === 'open' ? 'default' : 'secondary'} data-testid="status-store">{storeStatus.replaceAll('_', ' ')}</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><QuickLink path="/admin/orders" label="Review orders" icon={ShoppingBag} /><QuickLink path="/admin/requests" label="Check requests" icon={ClipboardList} /><QuickLink path="/admin/homepage" label="Edit homepage" icon={ImagePlus} /></div></CardContent></Card><Card className="admin-panel"><CardHeader><CardTitle className="text-base">At a glance</CardTitle><CardDescription>All collection counts, including empty shelves.</CardDescription></CardHeader><CardContent className="space-y-3">{['categories', 'brands', 'banners', 'inquiries'].map((name) => <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0" key={name}><span className="text-sm capitalize">{name}</span><span className="admin-mono font-semibold">{loading ? '—' : counts[name] ?? 0}</span></div>)}</CardContent></Card></div>
  </div>;
}
function QuickLink({ path, label, icon: Icon }: { path: string; label: string; icon: typeof Pill }) { return <Link to={path} className="flex items-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors hover:bg-secondary" data-testid={`link-quick-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon className="size-4 text-primary" />{label}<ChevronRight className="ml-auto size-4 text-muted-foreground" /></Link>; }

function InventorySync() { return <div className="space-y-7"><PageHeading title="Inventory sync" description="A professional setup space for connecting stock systems when the workflow is ready." /><Card className="admin-panel"><CardContent className="flex flex-col items-center px-6 py-20 text-center"><div className="grid size-16 place-items-center rounded-2xl bg-secondary text-primary"><Boxes className="size-8" /></div><h2 className="mt-6 text-xl font-semibold">No inventory connection yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Ayush Medico is currently managed directly through Firestore. An inventory connector can be configured here without changing the storefront catalogue.</p><Button variant="outline" className="mt-6" disabled data-testid="button-configure-inventory">Configuration coming later</Button></CardContent></Card></div>; }

function CatalogPage() { return <div className="space-y-7"><PageHeading title="Categories & brands" description="The labels customers use to find the right shelf, kept separate from product records." /><div className="grid gap-5 xl:grid-cols-2"><CollectionManager collection="categories" compact /><CollectionManager collection="brands" compact /></div></div>; }
function ContentPage() { return <div className="space-y-7"><PageHeading title="Content library" description="Review the words that shape trust: answers, customer voices, notices, and compliance pages." /><div className="grid gap-5 xl:grid-cols-2"><CollectionManager collection="faqs" compact /><CollectionManager collection="testimonials" compact /><CollectionManager collection="announcements" compact /><CollectionManager collection="legal" compact /></div></div>; }

function AdminSidebar({ pathname, onNavigate, onSignOut }: { pathname: string; onNavigate: () => void; onSignOut: () => void }) {
  return <aside className="admin-sidebar admin-sidebar-scroll fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col overflow-y-auto"><div className="flex h-20 items-center gap-3 border-b px-6"><div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Stethoscope className="size-5" /></div><div><p className="font-display text-lg leading-none">Ayush Medico</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Operations</p></div></div><nav className="flex-1 space-y-6 px-3 py-6">{navGroups.map((group) => <div key={group.label}><p className="admin-kicker px-3">{group.label}</p><div className="mt-2 space-y-1">{group.items.map((item) => { const active = pathname === item.path; const Icon = item.icon; return <Link to={item.path} key={item.path} onClick={onNavigate} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-primary font-semibold text-primary-foreground shadow-sm' : 'text-foreground/75 hover:bg-secondary hover:text-foreground'}`} data-testid={`link-admin-${item.label.toLowerCase().replaceAll(' ', '-')}`}><Icon className="size-[17px]" />{item.label}{active && <ChevronRight className="ml-auto size-4 opacity-70" />}</Link>; })}</div></div>)}</nav><div className="border-t p-4"><div className="mb-3 flex items-center gap-3 rounded-lg bg-background/55 p-3"><div className="grid size-8 place-items-center rounded-full bg-accent text-xs font-bold text-foreground">AM</div><div className="min-w-0"><p className="truncate text-xs font-semibold">Administrator</p><p className="truncate text-[10px] text-muted-foreground">{ADMIN_EMAIL}</p></div></div><button onClick={onSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive" data-testid="button-admin-signout"><LogOut className="size-4" /> Sign out</button></div></aside>;
}

function AdminShell() {
  const location = useLocation().pathname; const navigate = useNavigate(); const [mobileOpen, setMobileOpen] = useState(false); const collection = pathCollection[location];
  const title = titleForPath[location] || (collection ? collectionMeta[collection].title : 'Admin');
  const signOut = async () => { await signOutAdmin(); navigate('/admin/login'); };
  const content = location === '/admin' ? <Overview /> : location === '/admin/catalog' ? <CatalogPage /> : location === '/admin/content' ? <ContentPage /> : location === '/admin/inventory-sync' ? <InventorySync /> : collection ? <CollectionManager collection={collection} /> : <Overview />;
  return <div className="admin-shell min-h-[100dvh]"><div className={`fixed inset-0 z-30 bg-foreground/30 md:hidden ${mobileOpen ? 'block' : 'hidden'}`} onClick={() => setMobileOpen(false)} /><div className={`transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed z-40 md:block`}><AdminSidebar pathname={location} onNavigate={() => setMobileOpen(false)} onSignOut={() => void signOut()} /></div><div className="admin-main md:pl-[264px]"><header className="admin-topbar sticky top-0 z-20 flex h-20 items-center justify-between border-b px-5 md:px-8"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="button-open-admin-menu"><Menu className="size-5" /></Button><div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex"><Store className="size-4 text-primary" /> Ayush Medico <ChevronRight className="size-4" /> <span className="text-foreground">{title}</span></div><div className="sm:hidden"><p className="font-semibold">{title}</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Operations</p></div></div><div className="flex items-center gap-3"><div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><span className="size-2 rounded-full bg-primary" /> Firestore connected</div><Button variant="outline" size="icon" onClick={() => void signOut()} aria-label="Sign out" data-testid="button-topbar-signout"><LogOut className="size-4" /></Button></div></header><main className="mx-auto w-full max-w-[1440px] p-5 md:p-8">{content}</main></div></div>;
}

export default function AdminPage() {
  const location = useLocation().pathname; const [user, setUser] = useState<User | null>(null); const [checking, setChecking] = useState(true); const [authError, setAuthError] = useState('');
  useEffect(() => { const unsubscribe = subscribeToAdmin((nextUser) => { setUser(nextUser); setChecking(false); }, (error) => { setAuthError(error.message); setChecking(false); }); return unsubscribe; }, []);
  if (location === '/admin/login') return <AdminLogin />;
  if (checking) return <main className="admin-shell min-h-[100dvh] p-6"><div className="mx-auto max-w-6xl space-y-5 pt-20"><div className="admin-skeleton h-8 w-44 rounded" /><div className="admin-skeleton h-4 w-72 rounded" /><div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="admin-skeleton h-32 rounded-xl" />)}</div></div></main>;
  if (!user || !isAdminUser(user)) return <AdminRedirect error={authError} />;
  return <AdminShell />;
}

function AdminRedirect({ error }: { error: string }) {
  const navigate = useNavigate();
  useEffect(() => { navigate('/admin/login', { replace: true }); }, [navigate]);
  return <main className="admin-shell grid min-h-[100dvh] place-items-center p-6"><Card className="max-w-md"><CardHeader><CardTitle>Admin access required</CardTitle><CardDescription>{error || 'Redirecting to the secure sign-in.'}</CardDescription></CardHeader><CardContent><Button onClick={() => navigate('/admin/login')} data-testid="button-go-admin-login">Go to sign in</Button></CardContent></Card></main>;
}