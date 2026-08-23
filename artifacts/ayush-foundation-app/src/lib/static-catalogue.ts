export type CatalogueCategory = {
  id: 'tablet' | 'vet' | 'general';
  name: string;
  displayName: string;
  count: number;
};

export type CatalogueProduct = {
  id: number;
  sourceProductId: string;
  name: string;
  company: string | null;
  drug: string | null;
  sourceCategory: string | null;
  customerCategory: CatalogueCategory['id'];
  categoryDisplayName: string;
  dosageForm: string | null;
  packSize: string | null;
  imageUrl: string | null;
  salePrice: string | null;
  mrp: string | null;
  quantity: string | null;
  prescriptionRequired: boolean;
  productInfo: Record<string, unknown> | null;
};

export type CatalogueManifest = {
  version: number;
  total: number;
  pageSize: number;
  totalPages: number;
  categories: CatalogueCategory[];
  pages: Array<{ file: string; page: number; startId: number | null; endId: number | null; count: number }>;
};

type SearchRecord = Pick<CatalogueProduct, 'id' | 'sourceProductId' | 'name' | 'company' | 'drug' | 'sourceCategory' | 'customerCategory'>;

const base = import.meta.env.BASE_URL;
const catalogueUrl = (file: string) => `${base}catalogue/${file}`;

let manifestPromise: Promise<CatalogueManifest> | undefined;
let searchPromise: Promise<SearchRecord[]> | undefined;
const pageCache = new Map<number, Promise<CatalogueProduct[]>>();

async function getJson<T>(file: string): Promise<T> {
  const response = await fetch(catalogueUrl(file), { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Catalogue file unavailable: ${response.status}`);
  return response.json() as Promise<T>;
}

export function loadManifest() {
  manifestPromise ??= getJson<CatalogueManifest>('manifest.json');
  return manifestPromise;
}

export function loadPage(page: number) {
  const existing = pageCache.get(page);
  if (existing) return existing;
  const request = loadManifest().then((manifest) => {
    const pageInfo = manifest.pages[page - 1];
    if (!pageInfo) throw new Error('Catalogue page not found');
    return getJson<CatalogueProduct[]>(`pages/${pageInfo.file}`);
  });
  pageCache.set(page, request);
  return request;
}

export function loadSearchIndex() {
  searchPromise ??= getJson<SearchRecord[]>('search-index.json');
  return searchPromise;
}

export async function findProduct(id: number) {
  const manifest = await loadManifest();
  if (!Number.isInteger(id) || id < 1 || id > manifest.total) return null;
  const page = Math.ceil(id / manifest.pageSize);
  const products = await loadPage(page);
  return products.find((product) => product.id === id) ?? null;
}

export function searchProducts(records: SearchRecord[], query: string, category: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  return records.filter((product) => {
    const matchesCategory = category === 'vet'
      ? false
      : !category
        ? product.customerCategory !== 'vet'
        : product.customerCategory === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return [product.name, product.company, product.drug, product.sourceCategory, product.sourceProductId]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });
}