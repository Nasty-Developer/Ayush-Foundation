import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Bell,
  Boxes,
  Check,
  ChevronRight,
  ClipboardList,
  FileText,
  FileWarning,
  HelpCircle,
  ImagePlus,
  LayoutDashboard,
  Leaf,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Tags,
  Trash2,
  Upload,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  ADMIN_EMAIL,
  useAuth,
} from '@/lib/auth';
import {
  createRecord,
  getRecord,
  listRecords,
  removeRecord,
  saveSingleton,
  updateRecord,
  uploadAdminImage,
  type AdminCollection,
  type AdminRecord,
} from '@/lib/admin-data';
import { contactDetails } from '@/lib/site-data';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'image';

type FieldSpec = {
  key: string;
  label: string;
  kind: FieldKind;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  help?: string;
};

type ResourceConfig = {
  collection: AdminCollection;
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  fields: FieldSpec[];
  columns: Array<{ key: string; label: string }>;
  readOnly?: boolean;
  allowCreate?: boolean;
};

const iconProps = { size: 16, strokeWidth: 1.8 };
const MAX_SDF_FILE_BYTES = 60 * 1024 * 1024;
const ALLOWED_SDF_FILE_NAMES = new Set([
  'PRODUCT.SDF',
  'STOCK.SDF',
  'DRUG.SDF',
  'COMPANY.SDF',
  'CATEGORY.SDF',
]);

const resourceConfigs: Record<string, ResourceConfig> = {
  medicines: {
    collection: 'medicines',
    title: 'Medicines',
    eyebrow: 'Catalog',
    description: 'Manage the human medicine catalogue without exposing admin-only fields publicly.',
    icon: Package,
    fields: [
      { key: 'name', label: 'Medicine name', kind: 'text', required: true },
      { key: 'brand', label: 'Brand / manufacturer', kind: 'text' },
      { key: 'genericName', label: 'Generic name', kind: 'text' },
      { key: 'category', label: 'Category', kind: 'text' },
      { key: 'drugGroup', label: 'Drug group', kind: 'text' },
      { key: 'medicineType', label: 'Medicine type', kind: 'select', options: ['Tablet', 'Capsule', 'Syrup', 'Cream', 'Drops', 'Other'] },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'image', label: 'Medicine image', kind: 'image', help: 'Images are stored in Firebase Storage.' },
      { key: 'prescriptionRequired', label: 'Prescription required', kind: 'checkbox' },
      { key: 'stockStatus', label: 'Stock status', kind: 'select', options: ['In stock', 'Low stock', 'Out of stock'] },
      { key: 'price', label: 'Price', kind: 'number' },
      { key: 'visible', label: 'Visible on website', kind: 'checkbox' },
      { key: 'featured', label: 'Featured medicine', kind: 'checkbox' },
      { key: 'newArrival', label: 'New arrival', kind: 'checkbox' },
      { key: 'specialMedicine', label: 'Special medicine', kind: 'checkbox' },
    ],
    columns: [
      { key: 'name', label: 'Medicine' },
      { key: 'brand', label: 'Brand' },
      { key: 'stockStatus', label: 'Stock' },
      { key: 'visible', label: 'Visibility' },
    ],
  },
  'vet-medicines': {
    collection: 'vetMedicines',
    title: 'Vet Medicines',
    eyebrow: 'Catalog',
    description: 'Keep veterinary products clearly separate from human medicines.',
    icon: Stethoscope,
    fields: [
      { key: 'name', label: 'Product name', kind: 'text', required: true },
      { key: 'brand', label: 'Brand / manufacturer', kind: 'text' },
      { key: 'category', label: 'Category', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'image', label: 'Product image', kind: 'image' },
      { key: 'stockStatus', label: 'Stock status', kind: 'select', options: ['In stock', 'Low stock', 'Out of stock'] },
      { key: 'price', label: 'Price', kind: 'number' },
      { key: 'visible', label: 'Visible on website', kind: 'checkbox' },
    ],
    columns: [
      { key: 'name', label: 'Product' },
      { key: 'brand', label: 'Brand' },
      { key: 'stockStatus', label: 'Stock' },
      { key: 'visible', label: 'Visibility' },
    ],
  },
  'general-products': {
    collection: 'generalProducts',
    title: 'General Products',
    eyebrow: 'Catalog',
    description: 'Manage non-medicine pharmacy and healthcare products.',
    icon: ShoppingBag,
    fields: [
      { key: 'name', label: 'Product name', kind: 'text', required: true },
      { key: 'productType', label: 'Product type', kind: 'select', options: ['Personal care', 'Baby care', 'Healthcare device', 'Surgical supply', 'Supplement', 'Other'] },
      { key: 'brand', label: 'Brand', kind: 'text' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'image', label: 'Product image', kind: 'image' },
      { key: 'stockStatus', label: 'Stock status', kind: 'select', options: ['In stock', 'Low stock', 'Out of stock'] },
      { key: 'price', label: 'Price', kind: 'number' },
      { key: 'visible', label: 'Visible on website', kind: 'checkbox' },
    ],
    columns: [
      { key: 'name', label: 'Product' },
      { key: 'productType', label: 'Type' },
      { key: 'stockStatus', label: 'Stock' },
      { key: 'visible', label: 'Visibility' },
    ],
  },
  categories: {
    collection: 'categories',
    title: 'Categories',
    eyebrow: 'Catalog',
    description: 'Create the category structure that customer-facing catalogue sections can use.',
    icon: Tags,
    fields: [
      { key: 'name', label: 'Category name', kind: 'text', required: true },
      { key: 'categoryType', label: 'Category type', kind: 'select', options: ['General medicines', 'Vet medicines', 'General products'] },
      { key: 'image', label: 'Category image', kind: 'image' },
      { key: 'displayOrder', label: 'Display order', kind: 'number' },
      { key: 'active', label: 'Active', kind: 'checkbox' },
    ],
    columns: [
      { key: 'name', label: 'Category' },
      { key: 'categoryType', label: 'Type' },
      { key: 'displayOrder', label: 'Order' },
      { key: 'active', label: 'Status' },
    ],
  },
  brands: {
    collection: 'brands',
    title: 'Brands',
    eyebrow: 'Catalog',
    description: 'Manage pharmaceutical manufacturers and healthcare product companies.',
    icon: Boxes,
    fields: [
      { key: 'name', label: 'Brand / company name', kind: 'text', required: true },
      { key: 'image', label: 'Logo / image', kind: 'image' },
      { key: 'description', label: 'Description', kind: 'textarea' },
      { key: 'active', label: 'Active', kind: 'checkbox' },
    ],
    columns: [
      { key: 'name', label: 'Brand' },
      { key: 'description', label: 'Description' },
      { key: 'active', label: 'Status' },
    ],
  },
  'homepage': {
    collection: 'banners',
    title: 'Homepage',
    eyebrow: 'Homepage',
    description: 'Manage the homepage campaign content and banner carousel.',
    icon: ImagePlus,
    fields: [
      { key: 'headline', label: 'Headline', kind: 'text', required: true },
      { key: 'supportingText', label: 'Supporting text', kind: 'textarea' },
      { key: 'ctaText', label: 'CTA text', kind: 'text' },
      { key: 'ctaDestination', label: 'CTA destination', kind: 'text', placeholder: '/medicines' },
      { key: 'campaign', label: 'Campaign / category', kind: 'text' },
      { key: 'image', label: 'Banner image', kind: 'image' },
      { key: 'displayOrder', label: 'Display order', kind: 'number' },
      { key: 'enabled', label: 'Enabled', kind: 'checkbox' },
    ],
    columns: [
      { key: 'headline', label: 'Headline' },
      { key: 'campaign', label: 'Campaign' },
      { key: 'enabled', label: 'Status' },
      { key: 'displayOrder', label: 'Order' },
    ],
  },
  'new-arrivals': {
    collection: 'newArrivals',
    title: 'New Arrivals',
    eyebrow: 'Homepage',
    description: 'Feature only admin-added products. This collection starts empty.',
    icon: ArrowUpRight,
    fields: [
      { key: 'productId', label: 'Product / medicine ID', kind: 'text', required: true, help: 'Use the document ID from the relevant catalogue.' },
      { key: 'productName', label: 'Product name for display', kind: 'text', required: true },
      { key: 'displayOrder', label: 'Display order', kind: 'number' },
      { key: 'enabled', label: 'Enabled', kind: 'checkbox' },
    ],
    columns: [
      { key: 'productName', label: 'Product' },
      { key: 'productId', label: 'Catalogue ID' },
      { key: 'enabled', label: 'Status' },
      { key: 'displayOrder', label: 'Order' },
    ],
  },
  'special-medicines': {
    collection: 'specialMedicines',
    title: 'Special Medicines',
    eyebrow: 'Homepage',
    description: 'Feature special medicines added by the admin. This collection starts empty.',
    icon: ShieldCheck,
    fields: [
      { key: 'productId', label: 'Product / medicine ID', kind: 'text', required: true },
      { key: 'productName', label: 'Product name for display', kind: 'text', required: true },
      { key: 'displayOrder', label: 'Display order', kind: 'number' },
      { key: 'enabled', label: 'Enabled', kind: 'checkbox' },
    ],
    columns: [
      { key: 'productName', label: 'Product' },
      { key: 'productId', label: 'Catalogue ID' },
      { key: 'enabled', label: 'Status' },
      { key: 'displayOrder', label: 'Order' },
    ],
  },
  'medicine-requests': {
    collection: 'medicineRequests',
    title: 'Medicine Requests',
    eyebrow: 'Customer',
    description: 'Customer medicine availability requests will appear here when submitted.',
    icon: ClipboardList,
    allowCreate: false,
    fields: [
      { key: 'status', label: 'Status', kind: 'select', options: ['New', 'Reviewing', 'Available', 'Not Available', 'Contacted', 'Completed'] },
    ],
    columns: [
      { key: 'customerName', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'medicineRequested', label: 'Medicine' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Received' },
    ],
  },
  inquiries: {
    collection: 'inquiries',
    title: 'Inquiries',
    eyebrow: 'Customer',
    description: 'Review customer messages, update their status, and keep the queue clear.',
    icon: MessageSquare,
    allowCreate: false,
    fields: [
      { key: 'status', label: 'Status', kind: 'select', options: ['New', 'In Progress', 'Resolved'] },
      { key: 'read', label: 'Marked as read', kind: 'checkbox' },
    ],
    columns: [
      { key: 'name', label: 'Customer' },
      { key: 'phone', label: 'Phone' },
      { key: 'message', label: 'Message' },
      { key: 'status', label: 'Status' },
      { key: 'read', label: 'Read' },
    ],
  },
  orders: {
    collection: 'orders',
    title: 'Orders',
    eyebrow: 'Customer',
    description: 'Order architecture is ready for the future customer order flow. No sample orders are created.',
    icon: ShoppingBag,
    allowCreate: false,
    fields: [
      { key: 'status', label: 'Order status', kind: 'select', options: ['New', 'Accepted', 'Rejected', 'Preparing', 'Out for delivery', 'Delivered'] },
      { key: 'paymentStatus', label: 'Payment status', kind: 'select', options: ['Pending', 'Verified', 'Failed'] },
      { key: 'prescriptionStatus', label: 'Prescription status', kind: 'select', options: ['Not required', 'Pending', 'Verified', 'Rejected'] },
    ],
    columns: [
      { key: 'customerName', label: 'Customer' },
      { key: 'total', label: 'Total' },
      { key: 'status', label: 'Order status' },
      { key: 'paymentStatus', label: 'Payment' },
    ],
  },
  faq: {
    collection: 'faqs',
    title: 'FAQ',
    eyebrow: 'Content',
    description: 'Maintain helpful answers for the customer website.',
    icon: HelpCircle,
    fields: [
      { key: 'question', label: 'Question', kind: 'text', required: true },
      { key: 'answer', label: 'Answer', kind: 'textarea', required: true },
      { key: 'published', label: 'Published', kind: 'checkbox' },
      { key: 'displayOrder', label: 'Display order', kind: 'number' },
    ],
    columns: [
      { key: 'question', label: 'Question' },
      { key: 'published', label: 'Published' },
      { key: 'displayOrder', label: 'Order' },
    ],
  },
  testimonials: {
    collection: 'testimonials',
    title: 'Testimonials',
    eyebrow: 'Content',
    description: 'Publish real customer testimonials when they are available. No sample reviews are created.',
    icon: Users,
    fields: [
      { key: 'customerName', label: 'Customer name', kind: 'text', required: true },
      { key: 'text', label: 'Testimonial', kind: 'textarea', required: true },
      { key: 'rating', label: 'Rating', kind: 'number' },
      { key: 'image', label: 'Optional image', kind: 'image' },
      { key: 'published', label: 'Published', kind: 'checkbox' },
    ],
    columns: [
      { key: 'customerName', label: 'Customer' },
      { key: 'text', label: 'Testimonial' },
      { key: 'published', label: 'Published' },
    ],
  },
  announcements: {
    collection: 'announcements',
    title: 'Announcements',
    eyebrow: 'Content',
    description: 'Prepare announcements for the customer website without inventing content.',
    icon: Bell,
    fields: [
      { key: 'title', label: 'Announcement title', kind: 'text', required: true },
      { key: 'message', label: 'Message', kind: 'textarea', required: true },
      { key: 'priority', label: 'Priority', kind: 'select', options: ['Normal', 'Important', 'Urgent'] },
      { key: 'displayOrder', label: 'Display order', kind: 'number' },
      { key: 'enabled', label: 'Enabled', kind: 'checkbox' },
    ],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'priority', label: 'Priority' },
      { key: 'enabled', label: 'Status' },
      { key: 'displayOrder', label: 'Order' },
    ],
  },
  legal: {
    collection: 'legal',
    title: 'Legal & Compliance',
    eyebrow: 'Content',
    description: 'Store legal content in editable fields. No final legal wording is invented here.',
    icon: FileWarning,
    fields: [
      { key: 'title', label: 'Document', kind: 'select', options: ['Privacy Policy', 'Terms & Conditions', 'Refund & Cancellation Policy', 'Shipping & Delivery Policy', 'Prescription Policy', 'Disclaimer'], required: true },
      { key: 'content', label: 'Content', kind: 'textarea', required: true, help: 'Add approved legal copy before publishing.' },
      { key: 'published', label: 'Published', kind: 'checkbox' },
    ],
    columns: [
      { key: 'title', label: 'Document' },
      { key: 'published', label: 'Published' },
    ],
  },
};

type NavItem = [string, string, LucideIcon];

const navGroups: Array<{ label: string; items: NavItem[] }> = [
  {
    label: 'Catalog',
    items: [
      ['Medicines', '/admin/medicines', Package],
      ['Vet Medicines', '/admin/vet-medicines', Stethoscope],
      ['General Products', '/admin/general-products', ShoppingBag],
      ['Categories', '/admin/categories', Tags],
      ['Brands', '/admin/brands', Boxes],
    ],
  },
  {
    label: 'Homepage',
    items: [
      ['Homepage', '/admin/homepage', ImagePlus],
      ['New Arrivals', '/admin/new-arrivals', ArrowUpRight],
      ['Special Medicines', '/admin/special-medicines', ShieldCheck],
    ],
  },
  {
    label: 'Customer',
    items: [
      ['Orders', '/admin/orders', ShoppingBag],
      ['Medicine Requests', '/admin/medicine-requests', ClipboardList],
      ['Inquiries', '/admin/inquiries', MessageSquare],
    ],
  },
  {
    label: 'Content',
    items: [
      ['Legal & Compliance', '/admin/legal', FileWarning],
      ['Announcements', '/admin/announcements', Bell],
      ['FAQ', '/admin/faq', HelpCircle],
      ['Testimonials', '/admin/testimonials', Users],
      ['Settings', '/admin/settings', Settings],
    ],
  },
];

function humanizeError(error: unknown) {
  if (error instanceof Error && error.message) {
    if (error.message.includes('auth/invalid-credential')) return 'The email or password is incorrect.';
    if (error.message.includes('permission-denied')) return 'Firebase denied this action. Check that the signed-in account is authorized.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

type ApiResponse = Record<string, unknown>;

async function readApiResponse<T extends ApiResponse>(
  response: Response,
  endpoint: string,
): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const responseText = await response.text();
  const isJson = contentType.toLowerCase().includes('application/json');

  if (!isJson) {
    console.error('[Inventory Sync] API returned a non-JSON response', {
      endpoint,
      status: response.status,
      contentType: contentType || '(missing)',
      responseBody: responseText.slice(0, 500),
    });
    throw new Error(
      `Inventory API returned ${response.status} ${response.statusText} as ${contentType || 'an unknown content type'}. Check that ${endpoint} is deployed as an API route.`,
    );
  }

  let payload: ApiResponse = {};
  if (responseText.trim()) {
    try {
      const parsed: unknown = JSON.parse(responseText);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('The API returned a non-object JSON response.');
      }
      payload = parsed as ApiResponse;
    } catch (error) {
      console.error('[Inventory Sync] API returned invalid JSON', {
        endpoint,
        status: response.status,
        contentType,
        responseBody: responseText.slice(0, 500),
        error,
      });
      throw new Error(`Inventory API returned invalid JSON (${response.status}).`);
    }
  }

  if (!response.ok) {
    throw new Error(
      typeof payload.error === 'string'
        ? payload.error
        : `Inventory API request failed with ${response.status} ${response.statusText}.`,
    );
  }

  return payload as T;
}

function LoadingPanel({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border border-border bg-card">
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
        <Loader2 className="animate-spin text-primary" size={18} />
        {label}
      </div>
    </div>
  );
}

export function ProtectedAdminRoute() {
  const { loading, user, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingPanel label="Checking admin access" />;
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function AdminLoginPage() {
  const { loading, isAdmin, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAdmin) return <Navigate to="/admin/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (nextError) {
      setError(humanizeError(nextError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[hsl(189_35%_94%)] px-5 py-8">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl lg:grid-cols-[1fr_0.85fr]">
          <div className="paper-grid flex min-h-[540px] flex-col justify-between p-8 sm:p-12">
            <div>
              <Link to="/" className="inline-flex items-center gap-3" aria-label="Back to Ayush Medico website">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Plus size={25} strokeWidth={3} />
                </span>
                <span>
                  <span className="block font-display text-2xl font-bold tracking-[-0.04em]">Ayush Medico</span>
                  <span className="block text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Care, close to home</span>
                </span>
              </Link>
              <div className="mt-20 max-w-md">
                <p className="eyebrow">Private workspace</p>
                <h1 className="mt-4 font-display text-5xl leading-[0.98] tracking-[-0.06em] sm:text-6xl">A calmer way to run the pharmacy.</h1>
                <p className="mt-6 text-base leading-7 text-muted-foreground">Manage your catalogue, customer requests, and website content from one secure place.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><ShieldCheck size={16} className="text-primary" /> Firebase-protected admin access</div>
          </div>
          <div className="flex items-center p-8 sm:p-12">
            <form onSubmit={handleSubmit} className="w-full max-w-md">
              <p className="eyebrow">Admin panel</p>
              <h2 className="mt-3 font-display text-3xl tracking-[-0.04em]">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Sign in with the authorized Ayush Medico admin account.</p>
              <div className="mt-8 space-y-5">
                <label className="block text-sm font-bold">Admin email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4" autoComplete="username" required /></label>
                <label className="block text-sm font-bold">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm outline-none ring-primary/20 transition focus:border-primary focus:ring-4" autoComplete="current-password" required /></label>
              </div>
              {error && <p className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm font-semibold text-destructive"><AlertCircle size={17} className="mt-0.5 shrink-0" />{error}</p>}
              <button type="submit" disabled={submitting} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60">
                {submitting ? <Loader2 size={17} className="animate-spin" /> : <ShieldCheck size={17} />}
                {submitting ? 'Signing in…' : 'Sign in securely'}
              </button>
              <Link to="/" className="mt-5 block text-center text-sm font-bold text-muted-foreground hover:text-primary">Back to website</Link>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { user, signOutAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOutAdmin();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="min-h-[100dvh] bg-[hsl(189_35%_96%)]">
      {mobileOpen && <button className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col border-r border-border bg-card px-4 py-5 shadow-xl transition-transform lg:translate-x-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <Link to="/admin/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Plus size={22} strokeWidth={3} /></span>
            <span><span className="block font-display text-xl font-bold tracking-[-0.04em]">Ayush Medico</span><span className="block text-[0.57rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">Admin panel</span></span>
          </Link>
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav className="mt-7 flex-1 space-y-6 overflow-y-auto px-1">
          <NavLink to="/admin/dashboard" onClick={() => setMobileOpen(false)} className={navClass}><LayoutDashboard {...iconProps} /> Dashboard</NavLink>
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(([label, href, Icon]) => (
                  <NavLink key={href} to={href} onClick={() => setMobileOpen(false)} className={navClass}>
                    <Icon {...iconProps} /> <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">Inventory</p>
            <NavLink to="/admin/inventory" onClick={() => setMobileOpen(false)} className={navClass}><RefreshCw {...iconProps} /> Inventory Sync</NavLink>
          </div>
        </nav>
        <div className="border-t border-border pt-4">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-primary"><ArrowUpRight {...iconProps} /> View website</Link>
          <button onClick={handleSignOut} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-destructive/5 hover:text-destructive"><LogOut {...iconProps} /> Sign out</button>
        </div>
      </aside>
      <div className="lg:pl-[278px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-border bg-[hsl(189_35%_96%_/_0.9)] px-5 backdrop-blur sm:px-8">
          <button className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={19} /></button>
          <div className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Ayush Medico</p><p className="text-sm font-bold">Admin workspace</p></div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-primary/15 bg-card px-3 py-2 text-xs font-bold text-muted-foreground sm:inline-flex"><span className="h-2 w-2 rounded-full bg-[hsl(156_46%_45%)]" /> Protected</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary">{user?.email?.slice(0, 1).toUpperCase()}</div>
            <span className="hidden max-w-[220px] truncate text-sm font-semibold sm:block">{user?.email}</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-5 sm:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const collections = ['medicines', 'categories', 'brands', 'inquiries', 'faqs', 'testimonials', 'medicineRequests', 'orders'] as AdminCollection[];
      const results = await Promise.all(collections.map((collection) => listRecords(collection)));
      setCounts(Object.fromEntries(collections.map((collection, index) => [collection, results[index].length])));
    } catch (error) {
      toast({ title: 'Dashboard could not refresh', description: humanizeError(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const inventoryStats: Array<[string, number, LucideIcon, string]> = [
    ['Medicines', counts.medicines ?? 0, Package, '/admin/medicines'],
    ['Categories', counts.categories ?? 0, Tags, '/admin/categories'],
    ['Brands', counts.brands ?? 0, Boxes, '/admin/brands'],
  ] as const;
  const engagementStats: Array<[string, number, LucideIcon, string]> = [
    ['Inquiries', counts.inquiries ?? 0, MessageSquare, '/admin/inquiries'],
    ['FAQs', counts.faqs ?? 0, HelpCircle, '/admin/faq'],
    ['Testimonials', counts.testimonials ?? 0, Users, '/admin/testimonials'],
  ] as const;

  return (
    <div className="space-y-8">
      <AdminPageHeading eyebrow="Dashboard" title="Welcome back" description="Here’s what’s happening at Ayush Medico." action={<button onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>} />
      {loading ? <LoadingPanel label="Loading live Firebase counts" /> : (
        <>
          <StatSection title="Inventory catalogue" description="Live totals from Firestore" stats={inventoryStats} />
          <StatSection title="Customer engagement" description="Empty collections stay at zero" stats={engagementStats} />
          <section>
            <div className="mb-4 flex items-end justify-between"><div><p className="eyebrow">Shortcuts</p><h2 className="mt-2 font-display text-2xl tracking-[-0.04em]">Quick actions</h2></div></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {([
                ['Add medicine', '/admin/medicines', Package],
                ['View inquiries', '/admin/inquiries', MessageSquare],
                ['Update announcement', '/admin/announcements', Bell],
                ['Manage settings', '/admin/settings', Settings],
              ] as NavItem[]).map(([label, href, Icon]) => <button key={href} onClick={() => navigate(href)} className="group flex items-center justify-between rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"><span className="flex items-center gap-3 text-sm font-bold"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon size={18} /></span>{label}</span><ChevronRight size={17} className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" /></button>)}
            </div>
          </section>
          <section className="rounded-[1.5rem] border border-dashed border-primary/25 bg-primary/[0.04] p-6"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Leaf size={20} /></span><div><h2 className="font-bold">A truthful starting point</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Your Firebase collections are empty until you add real catalogue, content, or customer records. The dashboard never fills itself with sample data.</p></div></div></section>
        </>
      )}
    </div>
  );
}

function StatSection({ title, description, stats }: { title: string; description: string; stats: readonly (readonly [string, number, LucideIcon, string])[] }) {
  return <section><div className="mb-4"><p className="eyebrow">{title}</p><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><div className="grid gap-3 md:grid-cols-3">{stats.map(([label, value, Icon, href]) => <Link key={label} to={href} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"><div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Icon size={18} /></span><ArrowUpRight size={17} className="text-muted-foreground" /></div><p className="mt-6 text-3xl font-bold tracking-[-0.04em]">{value}</p><p className="mt-1 text-sm font-semibold text-muted-foreground">{label}</p></Link>)}</div></section>;
}

function AdminPageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 font-display text-4xl tracking-[-0.055em] sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>;
}

export function AdminResourcePage({ resourceKey }: { resourceKey: string }) {
  const config = resourceConfigs[resourceKey];
  if (!config) return <Navigate to="/admin/dashboard" replace />;
  return <ResourceManager config={config} />;
}

function ResourceManager({ config }: { config: ResourceConfig }) {
  const { toast } = useToast();
  const [records, setRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  async function load() {
    setLoading(true);
    try {
      setRecords(await listRecords(config.collection));
    } catch (error) {
      toast({ title: `Could not load ${config.title.toLowerCase()}`, description: humanizeError(error), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [config.collection]);

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((record) => Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(needle)));
  }, [records, search]);

  function openCreate() {
    const defaults = Object.fromEntries(config.fields.map((field) => [field.key, field.kind === 'checkbox' ? false : field.kind === 'number' ? 0 : field.options?.[0] ?? '']));
    setEditing(null);
    setForm(defaults);
    setImageFile(null);
    setImagePreview('');
    setDialogOpen(true);
  }

  function openEdit(record: AdminRecord) {
    setEditing(record);
    setForm(Object.fromEntries(config.fields.map((field) => [field.key, record[field.key] ?? (field.kind === 'checkbox' ? false : '')])));
    setImageFile(null);
    setImagePreview(typeof record.image === 'string' ? record.image : '');
    setDialogOpen(true);
  }

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const field of config.fields) {
        if (field.kind === 'image') continue;
        const value = form[field.key];
        payload[field.key] = field.kind === 'number' ? (value === '' ? null : Number(value)) : value;
      }
      if (editing) {
        if (imageFile) payload.image = await uploadAdminImage(imageFile, config.collection, editing.id);
        else if (typeof editing.image === 'string') payload.image = editing.image;
        await updateRecord(config.collection, editing.id, payload);
        toast({ title: `${config.title} updated` });
      } else {
        const created = await createRecord(config.collection, payload);
        if (imageFile) await updateRecord(config.collection, created.id, { image: await uploadAdminImage(imageFile, config.collection, created.id) });
        toast({ title: `${config.title} added` });
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      toast({ title: 'Save failed', description: humanizeError(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record: AdminRecord) {
    const label = String(record.name ?? record.title ?? record.question ?? record.productName ?? 'this record');
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      await removeRecord(config.collection, record.id);
      toast({ title: 'Record deleted' });
      await load();
    } catch (error) {
      toast({ title: 'Delete failed', description: humanizeError(error), variant: 'destructive' });
    }
  }

  return (
    <div className="space-y-7">
      <AdminPageHeading eyebrow={config.eyebrow} title={config.title} description={config.description} action={<div className="flex gap-2"><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary"><RefreshCw size={16} /> Refresh</button>{config.allowCreate !== false && <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5"><Plus size={17} /> Add {config.title.replace(/s$/, '')}</button>}</div>} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-md"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}…`} className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4" /></div><p className="text-sm font-semibold text-muted-foreground">{records.length} {records.length === 1 ? 'record' : 'records'}</p></div>
      {loading ? <LoadingPanel label={`Loading ${config.title.toLowerCase()}`} /> : filteredRecords.length === 0 ? <EmptyCollection title={records.length === 0 ? `No ${config.title.toLowerCase()} yet.` : 'No matching records'} description={records.length === 0 ? 'Add a real record when you are ready. This workspace does not seed fake production data.' : 'Try a different search term.'} action={config.allowCreate !== false && records.length === 0 ? <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus size={16} /> Add first record</button> : undefined} /> : <div className="overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-border bg-[hsl(189_35%_97%)] text-xs uppercase tracking-[0.12em] text-muted-foreground"><tr>{config.columns.map((column) => <th key={column.key} className="px-5 py-4 font-bold">{column.label}</th>)}<th className="px-5 py-4 text-right font-bold">Actions</th></tr></thead><tbody className="divide-y divide-border">{filteredRecords.map((record) => <tr key={record.id} className="transition hover:bg-secondary/30">{config.columns.map((column) => <td key={column.key} className="max-w-[260px] truncate px-5 py-4 font-semibold text-foreground">{column.key === 'image' && typeof record[column.key] === 'string' ? <img src={String(record[column.key])} alt="" className="h-10 w-10 rounded-lg object-cover" /> : formatValue(record[column.key])}</td>)}<td className="px-5 py-4"><div className="flex justify-end gap-1"><button onClick={() => openEdit(record)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-primary" aria-label={`Edit ${config.title}`}><Pencil size={16} /></button><button onClick={() => void handleDelete(record)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${config.title}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div></div>}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editing ? `Edit ${config.title.replace(/s$/, '')}` : `Add ${config.title.replace(/s$/, '')}`}</DialogTitle><DialogDescription>Changes save directly to the protected Firebase collection.</DialogDescription></DialogHeader><form onSubmit={handleSubmit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">{config.fields.map((field) => <FormField key={field.key} field={field} value={form[field.key]} onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))} imagePreview={imagePreview} onImageChange={handleImage} />)}</div><DialogFooter><button type="button" onClick={() => setDialogOpen(false)} className="rounded-xl border border-border px-4 py-2.5 text-sm font-bold">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}{saving ? 'Saving…' : 'Save changes'}</button></DialogFooter></form></DialogContent></Dialog>
    </div>
  );
}

function FormField({ field, value, onChange, imagePreview, onImageChange }: { field: FieldSpec; value: unknown; onChange: (value: unknown) => void; imagePreview: string; onImageChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  if (field.kind === 'checkbox') return <label className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[hsl(176_42%_33%)]" />{field.label}</label>;
  if (field.kind === 'image') return <div className="sm:col-span-2"><label className="block text-sm font-bold">{field.label}<span className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] p-4 text-sm text-muted-foreground transition hover:border-primary"><Upload size={18} className="text-primary" /><span>{imagePreview ? 'Replace image' : 'Upload image'}</span><input type="file" accept="image/*" onChange={onImageChange} className="sr-only" /></span></label>{imagePreview && <img src={imagePreview} alt="Preview" className="mt-3 h-28 w-40 rounded-xl border border-border object-cover" />}</div>;
  const common = { value: String(value ?? ''), onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value), className: 'mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4', required: field.required, placeholder: field.placeholder };
  return <label className={`block text-sm font-bold ${field.kind === 'textarea' ? 'sm:col-span-2' : ''}`}>{field.label}{field.kind === 'textarea' ? <textarea {...common} rows={4} /> : field.kind === 'select' ? <select {...common}>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input {...common} type={field.kind === 'number' ? 'number' : 'text'} />}{field.help && <span className="mt-1 block text-xs font-medium text-muted-foreground">{field.help}</span>}</label>;
}

function formatValue(value: unknown) {
  if (typeof value === 'boolean') return value ? <span className="inline-flex items-center gap-1 text-[hsl(156_46%_35%)]"><Check size={15} /> Yes</span> : <span className="text-muted-foreground">No</span>;
  if (value && typeof value === 'object' && 'toDate' in value) return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  const text = String(value ?? '—');
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

function EmptyCollection({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-primary/25 bg-card p-8 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Package size={24} /></span><h2 className="mt-5 font-display text-2xl tracking-[-0.04em]">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function AdminSettingsPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({
    businessName: 'Ayush Medico',
    locationLabel: 'Kurla West',
    address: contactDetails.address,
    phone: '+91 98332 73838',
    whatsapp: '+91 98332 73838',
    hours: 'Mon – Sun: 8:00 AM – 10:00 PM',
    email: contactDetails.email,
    directionsHref: contactDetails.directionsHref,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getRecord('settings', 'store').then((record) => {
      if (record) setForm((current) => {
        const keys = Object.keys(current) as Array<keyof typeof current>;
        return { ...current, ...Object.fromEntries(keys.map((key) => [key, record[key] ?? current[key]])) };
      });
    }).catch((error) => toast({ title: 'Could not load settings', description: humanizeError(error), variant: 'destructive' })).finally(() => setLoading(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      await saveSingleton('settings', 'store', form);
      toast({ title: 'Store settings saved', description: 'The protected settings document was updated.' });
    } catch (error) {
      toast({ title: 'Could not save settings', description: humanizeError(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingPanel label="Loading store settings" />;
  return <div className="space-y-7"><AdminPageHeading eyebrow="Content" title="Store settings" description="Keep Ayush Medico’s public contact identity in one protected place." /><form onSubmit={submit} className="max-w-4xl space-y-6 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm sm:p-7"><div className="grid gap-5 sm:grid-cols-2">{Object.entries({ businessName: 'Business name', locationLabel: 'Location identity', phone: 'Phone', whatsapp: 'WhatsApp', hours: 'Store hours', email: 'Email', directionsHref: 'Google Maps destination' }).map(([key, label]) => <label key={key} className="block text-sm font-bold">{label}<input value={form[key as keyof typeof form]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4" /></label>)}<label className="block text-sm font-bold sm:col-span-2">Full address<textarea value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} rows={5} className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none ring-primary/20 focus:border-primary focus:ring-4" /></label></div><div className="flex items-center justify-between border-t border-border pt-5"><p className="text-xs leading-5 text-muted-foreground">Only authorized admin accounts can update this document.</p><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">{saving && <Loader2 size={16} className="animate-spin" />}Save settings</button></div></form></div>;
}

export function InventoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [jobId, setJobId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);

  function validateFiles(candidateFiles: File[]) {
    const seen = new Set<string>();
    for (const file of candidateFiles) {
      const normalizedName = file.name.trim().toUpperCase();
      if (!normalizedName.endsWith('.SDF') || !ALLOWED_SDF_FILE_NAMES.has(normalizedName)) {
        return `${file.name} is not an approved SDF source file. Select PRODUCT.SDF, STOCK.SDF, DRUG.SDF, COMPANY.SDF, or CATEGORY.SDF.`;
      }
      if (seen.has(normalizedName)) {
        return `${file.name} is selected more than once.`;
      }
      if (file.size > MAX_SDF_FILE_BYTES) {
        return `${file.name} is larger than the 60 MB per-file limit.`;
      }
      seen.add(normalizedName);
    }
    return null;
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const validationError = validateFiles(selectedFiles);
    if (validationError) {
      setFiles([]);
      setMessage(validationError);
      toast({ title: 'Invalid SDF selection', description: validationError, variant: 'destructive' });
      event.target.value = '';
      return;
    }
    setFiles(selectedFiles);
    setMessage('');
  }

  async function uploadFiles() {
    if (!user || !files.length) return;
    const validationError = validateFiles(files);
    if (validationError) {
      setMessage(validationError);
      toast({ title: 'Upload failed', description: validationError, variant: 'destructive' });
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const token = await user.getIdToken();
      let currentJobId = jobId;
      for (const file of files) {
        const endpoint = '/api/catalog/imports/upload';
        const formData = new FormData();
        formData.append('file', file, file.name);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'X-File-Name': file.name, ...(currentJobId ? { 'X-Import-Job-Id': String(currentJobId) } : {}) },
          body: formData,
        });
        const payload = await readApiResponse<{
          jobId: number;
          recordCount: number;
          errors?: unknown[];
        }>(response, endpoint);
        currentJobId = payload.jobId;
        setJobId(currentJobId);
        setMessage(`${file.name}: ${payload.recordCount} fixed-width records detected${payload.errors?.length ? `, ${payload.errors.length} validation errors retained` : ''}.`);
      }
      toast({ title: 'SDF files uploaded', description: 'Review the detected records, then run the safe PostgreSQL sync.' });
    } catch (error) {
      toast({ title: 'Upload failed', description: humanizeError(error), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function syncFiles() {
    if (!user || !jobId) return;
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const endpoint = `/api/catalog/imports/${jobId}/sync`;
      const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const payload = await readApiResponse<{
        imported?: number;
        updated?: number;
        unchanged?: number;
        skipped?: number;
      }>(response, endpoint);
      setSummary(payload);
      toast({ title: 'Catalogue sync completed', description: `${payload.imported ?? 0} new, ${payload.updated ?? 0} updated, ${payload.unchanged ?? 0} unchanged.` });
    } catch (error) {
      toast({ title: 'Sync failed', description: humanizeError(error), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-7"><AdminPageHeading eyebrow="Inventory" title="Inventory sync" description="Upload the approved fixed-width SDF exports and synchronize them into PostgreSQL without deleting existing catalogue data." /><section className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm sm:p-7"><div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary"><Upload size={22} /></span><div><h2 className="font-display text-2xl tracking-[-0.04em]">Upload source files</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">PRODUCT, STOCK, DRUG, COMPANY and CATEGORY files are parsed as fixed-width ASCII. Existing rows are upserted by source identifier; malformed rows remain visible in import history.</p></div></div><input type="file" multiple accept=".sdf,.SDF" onChange={handleFileSelection} className="mt-6 block w-full rounded-xl border border-dashed border-primary/30 bg-muted/40 p-4 text-sm" data-testid="input-sdf-files" /><div className="mt-4 flex flex-wrap gap-2">{files.map((file) => <span key={file.name} className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold">{file.name}</span>)}</div><div className="mt-6 flex flex-wrap gap-3"><button type="button" disabled={busy || !files.length} onClick={() => void uploadFiles()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}Upload and inspect</button><button type="button" disabled={busy || !jobId} onClick={() => void syncFiles()} className="inline-flex items-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm font-bold text-primary disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}Sync PostgreSQL catalogue</button></div>{message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}{summary && <div className="mt-6 grid gap-3 sm:grid-cols-4">{[['New', summary.imported], ['Updated', summary.updated], ['Unchanged', summary.unchanged], ['Errors', summary.skipped]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-muted/60 p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{String(label)}</p><p className="mt-1 text-2xl font-bold">{String(value ?? 0)}</p></div>)}</div>}</section><p className="text-xs leading-5 text-muted-foreground">New Medicine Arrivals and Special Medicines remain empty until an administrator explicitly marks products in the existing admin catalogue. Product images use the existing Cloudinary signature endpoints when server credentials are configured.</p></div>;
}
