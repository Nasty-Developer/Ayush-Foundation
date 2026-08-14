import { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { whatsappUrl } from '@/lib/site-data';
import { SiWhatsapp } from 'react-icons/si';

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Ayush Medico on WhatsApp"
        className="fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(145_63%_36%)] text-primary-foreground shadow-lg shadow-[0_12px_28px_hsl(145_63%_28%/0.24)] transition-transform hover:-translate-y-1 hover:bg-[hsl(145_63%_31%)] sm:bottom-6 sm:right-6"
        style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
        data-testid="link-floating-whatsapp"
      >
        <SiWhatsapp size={27} aria-hidden="true" />
      </a>
    </div>
  );
}