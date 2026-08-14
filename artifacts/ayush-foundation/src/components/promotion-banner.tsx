import { ArrowRight, ChevronLeft, ChevronRight, Search, ShieldCheck, Truck } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { promotionalBanners } from '@/lib/home-data';

const iconByType = {
  delivery: Truck,
  availability: Search,
  prescription: ShieldCheck,
} as const;

export function PromotionBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused || promotionalBanners.length < 2) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promotionalBanners.length);
    }, 6500);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  function showPrevious() {
    setActiveIndex((current) => (current - 1 + promotionalBanners.length) % promotionalBanners.length);
  }

  function showNext() {
    setActiveIndex((current) => (current + 1) % promotionalBanners.length);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showPrevious();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext();
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    setIsPaused(true);
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    setIsPaused(false);
    if (startX === null || endX === undefined || Math.abs(endX - startX) < 48) return;
    if (endX < startX) showNext();
    else showPrevious();
  }

  if (promotionalBanners.length === 0) return null;

  return (
    <section
      className="site-container py-8 md:py-12"
      role="region"
      aria-roledescription="carousel"
      aria-label="Ayush Medico promotions and services"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
    >
      <div className="relative min-h-[400px] overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-lg sm:min-h-[360px]">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border-[22px] border-primary-foreground/10" aria-hidden="true" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full border-[18px] border-[hsl(20_72%_69%)]/20" aria-hidden="true" />

        {promotionalBanners.map((banner, index) => {
          const Icon = iconByType[banner.icon];
          const isActive = index === activeIndex;

          return (
            <article
              key={banner.id}
              className={`absolute inset-0 grid items-center gap-8 px-6 py-10 transition-all duration-500 sm:px-10 md:grid-cols-[1.1fr_0.9fr] md:px-14 md:py-12 ${
                isActive ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-8 opacity-0'
              }`}
              aria-hidden={!isActive}
            >
              <div className="relative z-10 max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[hsl(189_35%_78%)]">{banner.eyebrow}</p>
                <h2 className="mt-4 max-w-xl font-display text-4xl leading-[1.02] tracking-[-0.045em] sm:text-5xl">{banner.title}</h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-[hsl(189_35%_86%)] sm:text-base">{banner.description}</p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={banner.primaryHref}
                    tabIndex={isActive ? 0 : -1}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(20_72%_69%)] px-5 py-3 text-sm font-bold text-foreground transition-transform hover:-translate-y-0.5"
                    data-testid={`link-promotion-primary-${banner.id}`}
                  >
                    {banner.primaryLabel} <ArrowRight size={16} />
                  </Link>
                  <Link
                    to={banner.secondaryHref}
                    tabIndex={isActive ? 0 : -1}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-foreground/25 px-5 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
                    data-testid={`link-promotion-secondary-${banner.id}`}
                  >
                    {banner.secondaryLabel}
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto hidden w-full max-w-[320px] md:block" aria-hidden="true">
                <div className="absolute -inset-5 rounded-[2.25rem] border border-primary-foreground/10" />
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-primary-foreground/20 bg-primary-foreground/10 shadow-2xl">
                  <img src={banner.imageUrl} alt={`${banner.title} — Ayush Medico`} loading={index === 0 ? 'eager' : 'lazy'} className="h-full w-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[hsl(202_38%_16%/0.76)] via-transparent to-transparent" />
                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[hsl(189_35%_86%)]">Your local pharmacy</p>
                      <p className="mt-1 font-display text-2xl">Ayush Medico</p>
                    </div>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(20_72%_69%)] text-foreground">
                      <Icon size={23} />
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between sm:left-10 sm:right-10 md:bottom-7 md:left-14 md:right-14">
          <div className="flex items-center gap-2" aria-label="Promotion slides">
            {promotionalBanners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-[hsl(20_72%_69%)]' : 'w-2 bg-primary-foreground/40 hover:bg-primary-foreground/70'}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show promotion ${index + 1}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/25 text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              onClick={showPrevious}
              aria-label="Previous promotion"
              data-testid="button-promotion-previous"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-foreground/25 text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              onClick={showNext}
              aria-label="Next promotion"
              data-testid="button-promotion-next"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}