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

export const newMedicineArrivals = [
  {
    id: 'arrival-01',
    name: 'CalmRest Vitamin D3',
    detail: 'Daily wellness supplement · 60 tablets',
    tag: 'Wellness',
    tone: 'sun',
  },
  {
    id: 'arrival-02',
    name: 'ThermoEase Digital Thermometer',
    detail: 'Quick-read healthcare device',
    tag: 'Home care',
    tone: 'sky',
  },
  {
    id: 'arrival-03',
    name: 'Nourish Baby Gentle Wash',
    detail: 'Mild everyday baby care · 200 ml',
    tag: 'Baby care',
    tone: 'coral',
  },
  {
    id: 'arrival-04',
    name: 'FlexiGuard Crepe Bandage',
    detail: 'Soft support for home first aid',
    tag: 'First aid',
    tone: 'mint',
  },
];

export const localSpecials = [
  {
    id: 'special-01',
    name: 'Neighbourhood wellness picks',
    detail: 'A presentation-only collection of products our team can help identify or source.',
    label: 'Local selection',
  },
  {
    id: 'special-02',
    name: 'Hard-to-find care essentials',
    detail: 'Tell us what you are looking for; we will check with our pharmacy team.',
    label: 'Ask our team',
  },
  {
    id: 'special-03',
    name: 'Ayurvedic everyday care',
    detail: 'A small preview of traditional wellness products available to enquire about.',
    label: 'Preview collection',
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