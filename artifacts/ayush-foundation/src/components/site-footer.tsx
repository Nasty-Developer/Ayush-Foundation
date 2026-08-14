import { Clock3, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { contactDetails, directionsUrl, navItems, whatsappUrl } from '@/lib/site-data';

export function SiteFooter() {
  const legalLinks = ['Privacy Policy', 'Terms & Conditions', 'Refund & Cancellation Policy', 'Shipping & Delivery Policy', 'Prescription Policy', 'Disclaimer'];

  return (
    <footer className="border-t border-border bg-[hsl(184_29%_94%)]">
      <div className="site-container grid gap-10 py-14 md:grid-cols-[1.35fr_0.75fr_0.8fr_1fr] md:py-16">
        <div>
          <Link to="/" className="inline-flex items-center gap-3" data-testid="link-footer-brand">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-[13px] bg-primary text-primary-foreground">
              <span className="absolute h-5 w-1.5 rounded-full bg-primary-foreground" />
              <span className="absolute h-1.5 w-5 rounded-full bg-primary-foreground" />
            </span>
            <span className="font-display text-xl font-semibold tracking-[-0.03em] text-foreground">Ayush Medico</span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
            Your neighbourhood pharmacy for genuine medicines, thoughtful advice, and care that comes back to you.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">Quick Links</h2>
          <nav className="mt-4 flex flex-col items-start gap-3" aria-label="Footer navigation">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className="text-sm text-muted-foreground transition-colors hover:text-primary" data-testid={`link-footer-${item.label.toLowerCase().replaceAll(' ', '-')}`}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">Customer Help</h2>
          <nav className="mt-4 flex flex-col items-start gap-3" aria-label="Customer help navigation">
            <Link to="/medicines" className="text-sm text-muted-foreground transition-colors hover:text-primary" data-testid="link-footer-medicine-availability">Medicine Availability</Link>
            <Link to="/#faq-heading" className="text-sm text-muted-foreground transition-colors hover:text-primary" data-testid="link-footer-faq">FAQ</Link>
            <Link to="/contact" className="text-sm text-muted-foreground transition-colors hover:text-primary" data-testid="link-footer-contact">Contact</Link>
          </nav>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground">Find us here</h2>
          <div className="mt-4 space-y-3 text-sm leading-5 text-muted-foreground">
            <p className="flex gap-2.5"><MapPin size={17} className="mt-0.5 shrink-0 text-primary" /> {contactDetails.address}</p>
            <p className="flex gap-2.5"><Clock3 size={17} className="mt-0.5 shrink-0 text-primary" /> {contactDetails.hours}</p>
            <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="flex gap-2.5 transition-colors hover:text-primary" data-testid="link-footer-phone"><Phone size={17} className="mt-0.5 shrink-0 text-primary" /> {contactDetails.phone}</a>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground" data-testid="link-footer-whatsapp"><MessageCircle size={16} /> WhatsApp Us</a>
              <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-foreground" data-testid="link-footer-directions"><Navigation size={16} /> Directions</a>
            </div>
          </div>
        </div>
      </div>
      <div id="legal-placeholder" className="border-t border-border/70">
        <div className="site-container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p data-testid="text-copyright">© 2025 Ayush Medico. Care you can count on.</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Legal placeholder navigation">
            {legalLinks.map((label) => (
              <a key={label} href="#legal-placeholder" aria-disabled="true" className="transition-colors hover:text-primary" data-testid={`link-footer-legal-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} onClick={(event) => event.preventDefault()}>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}