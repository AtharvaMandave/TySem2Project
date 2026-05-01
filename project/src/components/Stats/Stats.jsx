"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Stats.module.css";

const STATS = [
  { value: "50,000", suffix: "+", label: "Verified Alumni" },
  { value: "120", suffix: "+", label: "Global Chapters" },
  { value: "100", suffix: "%", label: "Vetted Membership" },
];

export default function Stats() {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.stats} ref={sectionRef} id="stats-section">
      <div className={styles.container}>
        {STATS.map((stat, index) => (
          <div
            key={stat.label}
            className={`${styles.statItem} ${isVisible ? styles.statVisible : ""}`}
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <div className={styles.statValue}>
              {stat.value}
              <span className={styles.statSuffix}>{stat.suffix}</span>
            </div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
