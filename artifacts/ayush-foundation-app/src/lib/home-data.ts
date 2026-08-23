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
  { title: 'Baby Care', note: 'Gentle family care', icon: 'BC' },
  { title: 'Personal Care', note: 'Daily wellbeing', icon: 'PC' },
  { title: 'Vitamins & Supplements', note: 'Nutrition support', icon: 'VS' },
  { title: 'Diabetic Care', note: 'Helpful home supplies', icon: 'DC' },
  { title: 'Healthcare Devices', note: 'Tools for home care', icon: 'HD' },
  { title: 'Surgical Supplies', note: 'Practical care basics', icon: 'SS' },
  { title: 'Ayurvedic Products', note: 'Traditional wellness', icon: 'AP' },
];

export type MedicinePromoSlide = {
  id: string;
  productName: string;
  brand: string;
  category: string;
  description: string;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
  visual: 'wellness' | 'prescription' | 'neighbourhood';
  active: boolean;
  sortOrder: number;
};

/**
 * Presentation-ready slide records. The optional imageUrl, href, active, and
 * sortOrder fields intentionally mirror the future admin contract so this
 * static Phase 2 data can be replaced without changing the carousel.
 */
export const medicinePromoSlides: MedicinePromoSlide[] = [
  {
    id: 'promo-wellness',
    productName: 'Everyday care collection',
    brand: 'Ayush Foundation',
    category: 'Wellness & care',
    description:
      'A calm, considered place to ask about the healthcare essentials your routine needs.',
    headline: 'Care for the everyday moments.',
    ctaLabel: 'Explore our services',
    ctaHref: '/services',
    visual: 'wellness',
    active: true,
    sortOrder: 1,
  },
  {
    id: 'promo-prescription',
    productName: 'Prescription care support',
    brand: 'Ayush Foundation',
    category: 'Prescription care',
    description:
      'Bring the details that matter and speak with a local pharmacy team who can guide the next step.',
    headline: 'Clarity when details matter.',
    ctaLabel: 'Talk to our team',
    ctaHref: '/contact',
    visual: 'prescription',
    active: true,
    sortOrder: 2,
  },
  {
    id: 'promo-neighbourhood',
    productName: 'Pharmacy care close by',
    brand: 'Ayush Foundation · Kurla West',
    category: 'Neighbourhood care',
    description:
      'A familiar local pharmacy for thoughtful questions, clear next steps, and care that feels close.',
    headline: 'Good health, close to home.',
    ctaLabel: 'Get directions',
    ctaHref: 'https://www.google.com/maps/search/?api=1&query=Ayush+Medico+Kurla+West+Mumbai',
    visual: 'neighbourhood',
    active: true,
    sortOrder: 3,
  },
];

export const faqs = [
  {
    question: 'How can I check if a medicine is available?',
    answer:
      'Use the medicine search on this page to start, then call Ayush Foundation with the name, strength, or a clear prescription detail. A member of our team can confirm the next step with you.',
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