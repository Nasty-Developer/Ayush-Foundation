import { ArrowRight, BadgeCheck, HeartHandshake, MapPin, Phone, Search, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { SiWhatsapp } from 'react-icons/si';
import { Link, useNavigate } from 'react-router-dom';
import { CategoryPreview } from '@/components/category-preview';
import { FaqAccordion } from '@/components/faq-accordion';
import { DeliverySection, SpecialMedicines, WhyChooseSection } from '@/components/home-sections';
import { MedicineArrivals } from '@/components/medicine-arrivals';
import { MedicinePromoSlider } from '@/components/medicine-promo-slider';
import { SectionHeading } from '@/components/section-heading';
import { SiteLayout } from '@/components/site-layout';
import { contactDetails } from '@/lib/site-data';
import { homeServices } from '@/lib/home-data';

function HomeServiceIcon({ name }: { name: string }) {
  const iconProps = { size: 22, strokeWidth: 1.8 };
  if (name === 'prescription') return <BadgeCheck {...iconProps} />;
  if (name === 'delivery') return <Truck {...iconProps} />;
  if (name === 'products') return <ShoppingBag {...iconProps} />;
  if (name === 'otc') return <Sparkles {...iconProps} />;
  if (name === 'support') return <HeartHandshake {...iconProps} />;
  return <ShieldCheck {...iconProps} />;
}

function HeroSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/medicines?search=${encodeURIComponent(query)}` : '/medicines');
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl" role="search">
      <label htmlFor="medicine-search" className="sr-only">Search medicines</label>
      <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-card p-2 shadow-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Search size={20} className="ml-3 shrink-0 text-primary" aria-hidden="true" />
        <input
          id="medicine-search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search medicines, e.g. Paracetamol, Vitamin D3..."
          className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          data-testid="input-medicine-search"
        />
        <button type="submit" className="shrink-0 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:px-5" data-testid="button-search-medicines">
          Search
        </button>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={14} className="text-primary" /> Search is a starting point; availability is confirmed by our team.</p>
    </form>
  );
}

function TrustStrip() {
  const indicators = [
    { icon: ShieldCheck, label: 'Genuine medicines', note: 'Carefully sourced' },
    { icon: Truck, label: 'Local delivery', note: 'Support when needed' },
    { icon: HeartHandshake, label: 'Human support', note: 'A team close by' },
    { icon: BadgeCheck, label: 'Pharmacy care', note: 'Clear next steps' },
  ];

  return (
    <section className="border-b border-border/70 bg-card" aria-label="Ayush Medico trust indicators">
      <div className="site-container grid gap-px py-1 sm:grid-cols-2 lg:grid-cols-4">
        {indicators.map(({ icon: Icon, label, note }) => (
          <div key={label} className="flex items-center gap-3 px-1 py-4 sm:px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon size={17} /></span>
            <div><p className="text-xs font-bold text-foreground">{label}</p><p className="mt-0.5 text-xs text-muted-foreground">{note}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.title = 'Ayush Medico | Care, close to home';
    const description = 'Ayush Medico is a trusted neighbourhood pharmacy for genuine medicines, local delivery support, and thoughtful everyday healthcare help in Kurla West, Mumbai.';
    let descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.name = 'description';
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.content = description;
    const metaTags = [
      ['og:title', 'Ayush Medico | Care, close to home'],
      ['og:description', description],
      ['og:type', 'website'],
    ];
    metaTags.forEach(([property, content]) => {
      let tag = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    });
  }, []);

  return (
    <SiteLayout>
      <section className="paper-grid overflow-hidden border-b border-border/60">
        <div className="site-container grid min-h-[650px] items-center gap-12 py-14 md:grid-cols-[1.04fr_0.96fr] md:py-20 lg:min-h-[700px] lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-3.5 py-2 text-xs font-bold text-primary shadow-sm" data-testid="status-open-now">
              <span className="h-2 w-2 rounded-full bg-[hsl(156_46%_45%)]" /> Open today · 8:00 am – 9:00 pm
            </div>
            <h1 className="reveal reveal-delay-1 mt-7 max-w-xl font-display text-[3.25rem] leading-[0.98] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-[5.2rem]" data-testid="text-hero-heading">
              Good health,<br /><span className="text-primary">close to home.</span>
            </h1>
            <p className="reveal reveal-delay-2 mt-7 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              A neighbourhood pharmacy for genuine medicines, responsive help, and the comfort of knowing someone is looking out for you.
            </p>
            <HeroSearch />
            <div className="reveal reveal-delay-3 mt-6 flex flex-col gap-3 sm:flex-row">
              <Link to="/medicines" className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform hover:-translate-y-0.5" data-testid="link-hero-check-availability">
                Check Medicine Availability <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href={contactDetails.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 bg-card px-6 py-3.5 text-sm font-bold text-primary transition-colors hover:bg-secondary" data-testid="link-hero-whatsapp">
                <SiWhatsapp size={16} aria-hidden="true" /> WhatsApp Us
              </a>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2.5" aria-label="Quick contact actions">
              <a
                href={`tel:${contactDetails.phone.replaceAll(' ', '')}`}
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/15 bg-card px-3.5 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                aria-label="Call Ayush Medico at +91 98332 73838"
                data-testid="link-hero-call"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Phone size={15} />
                </span>
                <span className="whitespace-nowrap">Call Now</span>
              </a>
              <a
                href={contactDetails.directionsHref}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/15 bg-card px-3.5 py-2.5 text-sm font-bold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:ring-offset-2"
                aria-label="Get directions to Ayush Medico in Kurla West"
                data-testid="link-hero-directions"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <MapPin size={15} />
                </span>
                <span className="whitespace-nowrap">Get Directions</span>
              </a>
            </div>
          </div>

          <div className="relative mx-auto h-[340px] w-full max-w-[510px] sm:h-[430px] md:h-[490px]" aria-label="Illustration of Ayush Medico care">
            <div className="hero-orbit absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-[hsl(189_35%_91%)] sm:h-[390px] sm:w-[390px]" />
            <div className="absolute left-1/2 top-1/2 h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(176_42%_33%)] sm:h-[275px] sm:w-[275px]" />
            <div className="absolute left-1/2 top-1/2 flex h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[14px] border-[hsl(189_35%_91%)] bg-card shadow-lg sm:h-[205px] sm:w-[205px]">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-[20px] bg-primary text-primary-foreground sm:h-20 sm:w-20" aria-hidden="true">
                <span className="absolute h-10 w-3 rounded-full bg-primary-foreground sm:h-12 sm:w-3.5" />
                <span className="absolute h-3 w-10 rounded-full bg-primary-foreground sm:w-12" />
              </div>
            </div>
            <div className="hero-float absolute left-0 top-2 rounded-2xl border border-border bg-card p-4 shadow-md sm:left-5 sm:top-16" data-testid="card-hero-genuine">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(42_55%_88%)] text-[hsl(35_55%_38%)]"><ShieldCheck size={20} /></span><div><p className="text-xs font-bold text-muted-foreground">Every pack</p><p className="mt-0.5 text-sm font-bold text-foreground">Genuine & checked</p></div></div>
            </div>
            <div className="hero-float absolute bottom-1 right-0 rounded-2xl border border-border bg-card p-4 shadow-md sm:right-3 sm:bottom-12" style={{ animationDelay: '900ms' }} data-testid="card-hero-delivery">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(20_72%_91%)] text-[hsl(20_62%_45%)]"><Truck size={20} /></span><div><p className="text-xs font-bold text-muted-foreground">Local delivery</p><p className="mt-0.5 text-sm font-bold text-foreground">When you need it</p></div></div>
            </div>
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/10 bg-card/90 px-4 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur sm:bottom-7"><Sparkles size={14} /> Care with a human touch</div>
          </div>
        </div>
      </section>

      <TrustStrip />

      <MedicinePromoSlider />

      <section className="site-container py-16 md:py-24" aria-labelledby="services-heading">
        <SectionHeading eyebrow="Here when it matters" title="Six simple ways we can help." description="From a medicine check to a thoughtful conversation, our services are designed around the everyday needs of a local family." linkLabel="See all services" linkHref="/services" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {homeServices.map((service, index) => (
            <Link key={service.title} to={service.href} className={`group flex min-h-[190px] flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${index === 1 ? 'bg-[hsl(189_35%_94%)]' : ''}`} data-testid={`link-home-service-${index}`}>
              <div className="flex items-start justify-between"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><HomeServiceIcon name={service.icon} /></span><ArrowRight size={19} className="text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" /></div>
              <div className="mt-8"><h3 className="text-base font-bold text-foreground">{service.title}</h3><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{service.description}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <CategoryPreview />
      <MedicineArrivals />
      <SpecialMedicines />
      <DeliverySection />
      <WhyChooseSection />

      <section className="bg-[hsl(189_35%_94%)] py-16 md:py-24" aria-labelledby="faq-heading">
        <div className="site-container grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="eyebrow">A few clear answers</p>
            <h2 id="faq-heading" className="mt-3 max-w-sm font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">Questions are always welcome.</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">If your question is not here, call the pharmacy. A real person is close by.</p>
            <Link to="/contact" className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline" data-testid="link-faq-contact">Ask our team <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
          </div>
          <FaqAccordion />
        </div>
      </section>

      <section className="site-container py-16 md:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-[hsl(20_72%_69%)] px-6 py-12 sm:px-10 md:py-16">
          <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border-[20px] border-foreground/10" aria-hidden="true" />
          <div className="relative text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(20_62%_31%)]">A familiar pharmacy, close by</p>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-4xl leading-tight tracking-[-0.045em] text-foreground sm:text-5xl">Need a Medicine?</h2>
             <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[hsl(20_42%_33%)]">Check availability, call the pharmacy, or find your way to Ayush Medico in {contactDetails.locationLabel}.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/medicines" className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-sm font-bold text-background transition-transform hover:-translate-y-0.5" data-testid="link-final-availability">Check Medicine Availability <ArrowRight size={17} /></Link>
              <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 bg-card/60 px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-card" data-testid="link-final-call"><Phone size={16} /> Call Now</a>
              <a href={contactDetails.directionsHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 bg-transparent px-6 py-3.5 text-sm font-bold text-foreground transition-colors hover:bg-card/40" data-testid="link-final-directions"><MapPin size={16} /> Get Directions</a>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}