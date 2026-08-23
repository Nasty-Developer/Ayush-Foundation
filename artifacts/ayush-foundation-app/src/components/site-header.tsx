import { ArrowRight, Menu, Phone, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { contactDetails, navItems } from '@/lib/site-data';
import { useCart } from '@/lib/cart';

function BrandMark() {
  return (
    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-primary text-primary-foreground shadow-sm">
      <span className="absolute h-5 w-1.5 rounded-full bg-primary-foreground" />
      <span className="absolute h-1.5 w-5 rounded-full bg-primary-foreground" />
    </span>
  );
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const { count } = useCart();
  const { pathname: location } = useLocation();

  return (
    <header className="relative z-50 border-b border-border/70 bg-background/95 backdrop-blur">
      <div className="site-container flex h-[76px] items-center justify-between">
        <Link to="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)} data-testid="link-brand-home">
          <BrandMark />
          <span className="leading-none">
            <span className="block font-display text-[1.32rem] font-semibold tracking-[-0.03em] text-foreground">Ayush Foundation</span>
            <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">Care, close to home</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`relative py-2 text-sm font-semibold transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
              >
                {item.label}
                {active && <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} className="flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary" data-testid="link-header-phone">
            <Phone size={15} strokeWidth={2.2} />
            <span>Call Now</span>
          </a>
          <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:bg-secondary hover:text-primary" aria-label={`Open cart, ${count} items`} data-testid="button-header-cart">
            <ShoppingBag size={18} />{count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-foreground">{count}</span>}
          </Link>
          <Link to="/contact" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:-translate-y-0.5" data-testid="link-header-contact">
            Contact us
          </Link>
          <Link to="/account" className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:bg-secondary hover:text-primary" aria-label="Open customer account" data-testid="link-header-account">
            <UserRound size={17} />
          </Link>
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary md:hidden"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          data-testid="button-mobile-menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`absolute inset-x-0 top-[76px] border-b border-border bg-background px-4 pb-5 pt-2 shadow-lg transition-all duration-200 md:hidden ${isOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}>
        <nav className="site-container flex flex-col gap-1" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold ${active ? 'bg-secondary text-primary' : 'text-foreground hover:bg-muted'}`}
                data-testid={`link-mobile-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`}
              >
                {item.label}
                <ArrowRight size={16} className="text-accent" />
              </Link>
            );
          })}
          <a href={`tel:${contactDetails.phone.replaceAll(' ', '')}`} onClick={() => setIsOpen(false)} className="mt-2 flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground" data-testid="link-mobile-call">
            <Phone size={16} /> Call Now
          </a>
          <Link to="/contact" onClick={() => setIsOpen(false)} className="flex items-center justify-center rounded-full border border-primary/25 px-5 py-3.5 text-sm font-bold text-primary" data-testid="link-mobile-contact">
            Contact us
          </Link>
          <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 rounded-full border border-primary/25 px-5 py-3.5 text-sm font-bold text-primary" data-testid="link-mobile-account">
            <UserRound size={16} /> Customer account
          </Link>
          <Link to="/cart" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 rounded-full border border-primary/25 px-5 py-3.5 text-sm font-bold text-primary"><ShoppingBag size={16} /> Cart {count > 0 ? `(${count})` : ''}</Link>
        </nav>
      </div>
    </header>
  );
}