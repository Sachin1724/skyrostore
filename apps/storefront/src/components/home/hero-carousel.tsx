"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HeroSlide } from "@/lib/data/site-content";

/** The banner. CSS scroll-snap does the sliding; autoplay stops on hover, focus and reduced motion. */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: ((i + slides.length) % slides.length) * el.clientWidth, behavior: "smooth" });
  };

  // Advance on its own. The pointer often rests on the banner, and pausing on hover
  // stopped it for good. Keyboard focus and a hidden
  // tab still hold it, and a reduced-motion preference turns it off.
  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!document.hidden) go(index + 1);
    }, 6000);
    return () => clearInterval(t);
  }, [paused, index, slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (slides.length === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="hero-in group relative overflow-hidden rounded-2xl bg-navy"
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <ul
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <li
            key={i}
            className="relative min-h-[260px] w-full shrink-0 snap-start md:min-h-[380px]"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover object-center md:object-[72%_center]" loading={i === 0 ? "eager" : "lazy"} />
            {s.title || s.text || s.cta ? (
              <>
                <span
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,26,47,0.92)_18%,rgba(10,26,47,0.55))] md:bg-[linear-gradient(to_right,rgba(10,26,47,0.88),rgba(10,26,47,0.6)_42%,rgba(10,26,47,0)_74%)]"
                />
                <div className="relative flex min-h-[260px] max-w-[680px] flex-col items-start justify-center gap-4 p-6 md:min-h-[380px] md:p-14">
                  {s.title ? (
                    <h1 className="text-[clamp(2rem,1rem+3.4vw,3.75rem)] font-semibold leading-[1] tracking-[-0.035em] text-white">{s.title}</h1>
                  ) : null}
                  {s.text ? <p className="max-w-[46ch] text-[16px] leading-relaxed text-on-dark md:text-[20px]">{s.text}</p> : null}
                  {s.cta && s.href ? (
                    <Link href={s.href} className="btn btn-light mt-1">
                      {s.cta}
                    </Link>
                  ) : null}
                </div>
              </>
            ) : null}
          </li>
        ))}
      </ul>

      {slides.length > 1 && (
        <>
          <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)} className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy md:flex">
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button type="button" aria-label="Next slide" onClick={() => go(index + 1)} className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy md:flex">
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
          <div className="absolute bottom-6 left-7 flex gap-2 md:left-16">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-10 bg-white" : "w-4 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
