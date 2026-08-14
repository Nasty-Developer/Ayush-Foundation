export type HomeIconName =
  | 'availability'
  | 'prescription'
  | 'delivery'
  | 'products'
  | 'otc'
  | 'support';

export const homeServices: Array<{
  title: string;
  description: string;
  icon: HomeIconName;
  href: string;
}> = [
  {
    title: 'Medicine Availability',
    description: 'Share a name or strength and our local team can check it with you.',
    icon: 'availability',
    href: '/medicines',
  },
  {
    title: 'Prescription Medicines',
    description: 'A clear, careful process for medicines that need a valid prescription.',
    icon: 'prescription',
    href: '/medicines',
  },
  {
    title: 'Home Delivery',
    description: 'Local delivery support for medicines and everyday healthcare essentials.',
    icon: 'delivery',
    href: '/services',
  },
  {
    title: 'Healthcare Products',
    description: 'Useful care products for home, family routines, and first aid.',
    icon: 'products',
    href: '/services',
  },
  {
    title: 'OTC Medicines',
    description: 'Everyday over-the-counter options, with a team ready for questions.',
    icon: 'otc',
    href: '/medicines',
  },
  {
    title: 'Pharmacy Support',
    description: 'A familiar person to call when you need a little direction.',
    icon: 'support',
    href: '/contact',
  },
];

export const medicineCategories = [
  { title: 'Prescription Medicines', note: 'For prescribed routines', icon: 'Rx' },
  { title: 'OTC Medicines', note: 'Everyday essentials', icon: 'OTC' },
  { title: 'Baby Care', note: 'Gentle family care', icon: 'BC', imageUrl: '/images/ayush-baby-care.jpg' },
  { title: 'Personal Care', note: 'Daily wellbeing', icon: 'PC' },
  { title: 'Vitamins & Supplements', note: 'Nutrition support', icon: 'VS' },
  { title: 'Diabetic Care', note: 'Helpful home supplies', icon: 'DC' },
  { title: 'Healthcare Devices', note: 'Tools for home care', icon: 'HD' },
  { title: 'Surgical Supplies', note: 'Practical care basics', icon: 'SS', imageUrl: '/images/ayush-first-aid.jpg' },
  { title: 'Ayurvedic Products', note: 'Traditional wellness', icon: 'AP' },
];

/**
 * Phase 2 catalog contract.
 *
 * The customer UI intentionally starts with no medicine records. These fields
 * are the shape a future admin workflow can use for create, edit, delete,
 * image upload, visibility, and homepage placement without introducing the
 * medicine database in this phase.
 */
export type MedicineType = 'general' | 'veterinary';

export type MedicineRecord = {
  id: string;
  imageUrl: string | null;
  name: string;
  brand: string;
  manufacturer: string;
  category: string;
  description: string;
  medicineType: MedicineType;
  isNewArrival: boolean;
  isSpecial: boolean;
  isVisible: boolean;
};

// These arrays are intentionally empty until an approved catalog source exists.
export const newMedicineArrivals: MedicineRecord[] = [];
export const localSpecials: MedicineRecord[] = [];

export type PromotionalBanner = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: 'delivery' | 'availability' | 'prescription';
  imageUrl: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
};

/**
 * Ayush Medico-owned service promotions only.
 * This list is deliberately shaped so a future admin panel can manage it
 * without changing the slider component.
 */
export const promotionalBanners: PromotionalBanner[] = [
  {
    id: 'local-delivery-support',
    eyebrow: 'AYUSH MEDICO · KURLA WEST',
    title: 'Local care, brought closer.',
    description:
      'Talk to our team about dependable home delivery support for your medicines and healthcare essentials.',
    icon: 'delivery',
    imageUrl: '/images/ayush-local-delivery.jpg',
    primaryLabel: 'Talk about delivery',
    primaryHref: '/contact',
    secondaryLabel: 'Call the pharmacy',
    secondaryHref: '/contact',
  },
  {
    id: 'medicine-availability',
    eyebrow: 'MEDICINE AVAILABILITY',
    title: 'Need a medicine checked?',
    description:
      'Share a name, strength, or clear prescription detail and our team will guide you on the next step.',
    icon: 'availability',
    imageUrl: '/images/ayush-pharmacy-hero.jpg',
    primaryLabel: 'Check availability',
    primaryHref: '/medicines',
    secondaryLabel: 'Ask our team',
    secondaryHref: '/contact',
  },
  {
    id: 'prescription-support',
    eyebrow: 'PHARMACY SUPPORT',
    title: 'Prescription help, clearly explained.',
    description:
      'When a valid prescription is needed, Ayush Medico will explain what to bring before arranging anything.',
    icon: 'prescription',
    imageUrl: '/images/ayush-first-aid.jpg',
    primaryLabel: 'Contact Ayush Medico',
    primaryHref: '/contact',
    secondaryLabel: 'Learn about services',
    secondaryHref: '/services',
  },
];

export const faqs = [
  {
    question: 'How can I check if a medicine is available?',
    answer:
      'Use the medicine search on this page to start, then call Ayush Medico with the name, strength, or a clear prescription detail. A member of our team can confirm the next step with you.',
  },
  {
    question: 'Do you support prescription medicines?',
    answer:
      'Yes, we support prescription medicines where a valid prescription is required. Our team will explain what is needed before helping you proceed.',
  },
  {
    question: 'Can I request local home delivery?',
    answer:
      'Please call us to discuss local delivery support. We will confirm the practical details for your address and the medicines or healthcare products you need.',
  },
  {
    question: 'What should I do if I cannot find a product?',
    answer:
      'Call the pharmacy with the product name or a short description. Some products may be available by enquiry or may need a little more information to identify correctly.',
  },
];