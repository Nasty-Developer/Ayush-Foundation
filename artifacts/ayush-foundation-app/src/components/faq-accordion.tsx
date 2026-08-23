import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { faqs } from '@/lib/home-data';

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card" data-testid="accordion-faq">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div key={faq.question} className="px-5 sm:px-7">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-bold text-foreground transition-colors hover:text-primary sm:py-6"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                data-testid={`button-faq-${index}`}
              >
                {faq.question}
                <ChevronDown size={18} className={`shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen} className="pb-5 pr-7 text-sm leading-6 text-muted-foreground sm:pb-6">
              {faq.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}