"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BannerSlide = {
  title: string;
  subtitle: string;
  image: string;
  href?: string;
  cta?: string;
};

type BannerCarouselProps = {
  slides: BannerSlide[];
};

export default function BannerCarousel({ slides }: BannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <section className="rounded-3xl bg-white shadow-sm">
      <div className="p-4 sm:p-6">
        <div className="overflow-hidden rounded-3xl">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide) => {
              const slideContent = (
                <>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                  <div className="relative z-10 flex h-full flex-col justify-between p-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                        Featured
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
                        {slide.title}
                      </h2>
                      <p className="mt-2 text-sm text-white/80">{slide.subtitle}</p>
                    </div>
                    <span className="mt-6 w-fit rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900">
                      {slide.cta ?? "Shop now"}
                    </span>
                  </div>
                </>
              );

              const slideClasses =
                "relative h-[240px] w-full shrink-0 overflow-hidden rounded-3xl bg-gray-900 text-white sm:h-[260px]";

              return slide.href ? (
                <Link key={slide.title} href={slide.href} className={slideClasses}>
                  {slideContent}
                </Link>
              ) : (
                <div key={slide.title} className={slideClasses}>
                  {slideContent}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <button
              key={`${slide.title}-dot`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 w-2 rounded-full transition ${
                index === activeIndex ? "bg-gray-900" : "bg-gray-300"
              }`}
              aria-label={`Go to ${slide.title}`}
              aria-current={index === activeIndex ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
