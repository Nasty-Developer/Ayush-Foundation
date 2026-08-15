import type { ReactNode } from 'react';
import { SiWhatsapp } from 'react-icons/si';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { contactDetails } from '@/lib/site-data';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <a
        href={contactDetails.whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(145_62%_42%)] text-white shadow-lg shadow-[hsl(145_62%_25%_/_0.25)] transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:bottom-7 sm:right-7"
        aria-label="Chat with Ayush Medico on WhatsApp"
        data-testid="link-floating-whatsapp"
      >
        <SiWhatsapp size={25} aria-hidden="true" />
      </a>
    </div>
  );
}