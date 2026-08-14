export const ADMIN_EMAIL = 'adminayushmedical@gmail.com';

export const ADMIN_COLLECTIONS = [
  'medicines',
  'vetMedicines',
  'generalProducts',
  'categories',
  'brands',
  'banners',
  'newArrivals',
  'specialMedicines',
  'orders',
  'medicineRequests',
  'inquiries',
  'faqs',
  'testimonials',
  'announcements',
  'settings',
  'legal',
] as const;

export type AdminCollection = (typeof ADMIN_COLLECTIONS)[number];
export type AdminRecord = Record<string, unknown> & { id: string };

export type StoredImage = {
  url: string;
  storagePath: string;
};

export type AdminListOptions = {
  search?: string;
  status?: string;
  limit?: number;
};

export type AdminCollectionConfig = {
  label: string;
  singular: string;
  description: string;
  collection: AdminCollection;
  searchFields: string[];
  emptyTitle: string;
  emptyDescription: string;
};