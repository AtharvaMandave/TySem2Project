"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import styles from "./Hero.module.css";

/**
 * Add new images to this array to include them in the slideshow.
 * Images must be placed in the /public folder.
 */
const HERO_IMAGES = [
  { src: "/i1.jpg", alt: "Campus view 1" },
  { src: "/img1.jpg", alt: "Campus view 4" },
  { src: "/img2.jpg", alt: "Campus view 5" },
];

const SLIDE_INTERVAL = 5000; // ms between slides

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length
    );
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  // Auto‑advance timer — resets whenever currentIndex changes
  useEffect(() => {
    const timer = setInterval(goToNext, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [currentIndex, goToNext]);

  return (
    <section className={styles.hero} id="hero-section">
      {/* ── Background image slides ── */}
      <div className={styles.slideshowWrapper} aria-hidden="true">
        {HERO_IMAGES.map((image, index) => (
          <div
            key={image.src}
            className={`${styles.slide} ${
              index === currentIndex ? styles.slideActive : ""
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              priority={index === 0}
              quality={85}
              className={styles.slideImage}
            />
          </div>
        ))}
      </div>

      {/* ── Dark gradient overlay ── */}
      <div className={styles.overlay} />

      {/* ── Content ── */}
      <div className={styles.content}>
        <h1 className={styles.heading}>
          <span className={styles.headingLine}>Elevating the</span>
          <span className={styles.headingAccent}>
            Legacy of
            <br />
            Connection.
          </span>
        </h1>

        <p className={styles.description}>
          A private community for distinguished graduates. Bridge the gap
          between your academic roots and your global aspirations through our
          exclusive alumni network.
        </p>

        <div className={styles.actions}>
          <a
            href="#apply"
            className="btn btn-primary"
            id="hero-request-invitation"
          >
            Request Invitation
          </a>
          <a
            href="#explore"
            className="btn btn-outline"
            id="hero-explore-circle"
          >
            Explore the Circle
          </a>
        </div>

        {/* ── Slide indicators ── */}
        <div className={styles.indicators}>
          {HERO_IMAGES.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                index === currentIndex ? styles.indicatorActive : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              id={`hero-indicator-${index}`}
              suppressHydrationWarning
            />
          ))}
        </div>
      </div>

      {/* ── Prev / Next arrows ── */}
      <button
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={goToPrev}
        aria-label="Previous slide"
        id="hero-prev"
        suppressHydrationWarning
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <button
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={goToNext}
        aria-label="Next slide"
        id="hero-next"
        suppressHydrationWarning
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </section>
  );
}
