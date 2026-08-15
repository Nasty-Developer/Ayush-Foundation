import { ArrowLeft, ArrowRight, HeartPulse, MapPinned, Pause, Pill, Play, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import { medicinePromoSlides, type MedicinePromoSlide } from '@/lib/home-data';

function VisualPlaceholder({ slide }: { slide: MedicinePromoSlide }) {
  const Icon = slide.visual === 'prescription' ? Pill : slide.visual === 'neighbourhood' ? MapPinned : HeartPulse;

  return (
    <div className={`promo-art promo-art-${slide.visual} relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-[1.65rem] p-8 sm:min-h-[360px]`} role="img" aria-label={`Neutral visual placeholder for ${slide.productName}`}>
      <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full border-[24px] border-white/20" aria-hidden="true" />
      <div className="absolute -bottom-16 -left-12 h-48 w-48 rounded-full border-[18px] border-white/15" aria-hidden="true" />
      {slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt={`${slide.productName} promotional visual`}
          className="relative z-10 h-[300px] w-full max-w-[330px] rotate-[-3deg] rounded-[1.75rem] object-cover shadow-2xl transition-transform duration-500 group-hover:rotate-0 group-hover:scale-[1.02] sm:h-[360px]"
        />
      ) : (
        <div className="relative z-10 w-full max-w-[280px] rotate-[-3deg] rounded-[1.75rem] border border-white/60 bg-card/95 p-5 shadow-2xl backdrop-blur-sm transition-transform duration-500 group-hover:rotate-0 group-hover:scale-[1.02]">
          <div className="flex items-start justify-between gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Icon size={24} strokeWidth={1.8} />
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-primary">
              Product visual
            </span>
          </div>
          <div className="mt-16">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-primary">{slide.brand}</p>
            <p className="mt-2 font-display text-2xl leading-none tracking-[-0.04em] text-foreground">{slide.productName}</p>
            <div className="mt-5 h-1.5 w-24 rounded-full bg-primary/20" aria-hidden="true" />
            <div className="mt-2 h-1.5 w-36 rounded-full bg-primary/10" aria-hidden="true" />
          </div>
        </div>
      )}
    </div>
  );
}

function SlideCta({ slide }: { slide: MedicinePromoSlide }) {
  const isExternal = slide.ctaHref.startsWith('http');
  const className = 'inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(20_72%_69%)] px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-transform hover:-translate-y-0.5';

  if (isExternal) {
    return (
      <a href={slide.ctaHref} target="_blank" rel="noreferrer" className={className} data-testid={`link-promo-cta-${slide.id}`}>
        {slide.ctaLabel} <ArrowRight size={16} />
      </a>
    );
  }

  return (
    <Link to={slide.ctaHref} className={className} data-testid={`link-promo-cta-${slide.id}`}>
      {slide.ctaLabel} <ArrowRight size={16} />
    </Link>
  );
}

export function MedicinePromoSlider() {
  const slides = useMemo(
    () => medicinePromoSlides.filter((slide) => slide.active).sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);

  function goTo(index: number) {
    setActiveIndex((index + slides.length) % slides.length);
  }

  function goNext() {
    goTo(activeIndex + 1);
  }

  function goPrevious() {
    goTo(activeIndex - 1);
  }

  useEffect(() => {
    if (slides.length < 2 || isPaused) return;
    const timer = window.setInterval(goNext, 6500);
    return () => window.clearInterval(timer);
  }, [activeIndex, isPaused, slides.length]);

  if (slides.length === 0) return null;

  const slide = slides[activeIndex];

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setIsPaused(true);
      goNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setIsPaused(true);
      goPrevious();
    } else if (event.key === 'Home') {
      event.preventDefault();
      setIsPaused(true);
      goTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setIsPaused(true);
      goTo(slides.length - 1);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    pointerStart.current = event.clientX;
    setIsPaused(true);
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerStart.current !== null) {
      const distance = event.clientX - pointerStart.current;
      if (Math.abs(distance) > 48) distance < 0 ? goNext() : goPrevious();
    }
    pointerStart.current = null;
    setIsPaused(false);
  }

  return (
    <section className="site-container py-14 md:py-20" aria-labelledby="medicine-promotions-heading">
      <div className="mb-6 flex items-end justify-between gap-5">
        <div>
          <p className="eyebrow">From Ayush Medico · Kurla West</p>
          <h2 id="medicine-promotions-heading" className="mt-3 max-w-xl font-display text-3xl leading-tight tracking-[-0.04em] sm:text-4xl">
            A little more care, beautifully presented.
          </h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex" aria-label="Carousel controls">
          <button type="button" onClick={goPrevious} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Previous promotion" data-testid="button-promo-previous">
            <ArrowLeft size={17} />
          </button>
          <button type="button" onClick={goNext} className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Next promotion" data-testid="button-promo-next">
            <ArrowRight size={17} />
          </button>
        </div>
      </div>

      <div
        className="group relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground shadow-lg"
        role="region"
        aria-roledescription="carousel"
        aria-label="Ayush Medico promotional banners"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          if (pointerStart.current === null) setIsPaused(false);
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStart.current = null;
          setIsPaused(false);
        }}
        style={{ touchAction: 'pan-y' }}
        data-testid="medicine-promo-carousel"
      >
        <div className="promo-slide-enter grid min-h-[430px] items-stretch gap-8 p-6 sm:p-9 lg:grid-cols-[0.92fr_1.08fr] lg:p-12" key={slide.id} aria-live={isPaused ? 'polite' : 'off'}>
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[hsl(189_35%_80%)]">
              <span>{slide.category}</span>
              <span className="h-1 w-1 rounded-full bg-[hsl(20_72%_69%)]" aria-hidden="true" />
              <span>{slide.brand}</span>
            </div>
            <h3 className="mt-5 max-w-xl font-display text-4xl leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-[4.4rem]">{slide.headline}</h3>
            <p className="mt-5 max-w-md text-sm leading-6 text-[hsl(189_35%_84%)] sm:text-base">{slide.description}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <SlideCta slide={slide} />
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-[hsl(189_35%_80%)]">
                <ShieldCheck size={15} /> Thoughtful local support
              </span>
            </div>
          </div>
          <VisualPlaceholder slide={slide} />
        </div>

        <div className="flex items-center justify-between gap-5 border-t border-primary-foreground/15 px-6 py-4 sm:px-9 lg:px-12">
          <div className="flex items-center gap-2" role="tablist" aria-label="Promotional slides">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsPaused(true);
                  goTo(index);
                }}
                className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-[hsl(20_72%_69%)]' : 'w-2 bg-primary-foreground/40 hover:bg-primary-foreground/70'}`}
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show promotion ${index + 1}: ${item.headline}`}
                data-testid={`button-promo-indicator-${index}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => setIsPaused((paused) => !paused)} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-[hsl(189_35%_84%)] transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground" aria-label={isPaused ? 'Play promotions' : 'Pause promotions'} aria-pressed={isPaused} data-testid="button-promo-pause">
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            <span className="hidden sm:inline">{isPaused ? 'Play' : 'Pause'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}