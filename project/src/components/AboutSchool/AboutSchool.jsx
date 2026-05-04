import Image from "next/image";
import styles from "./AboutSchool.module.css";

export default function AboutSchool() {
  return (
    <section className={styles.aboutSection} id="about-school">
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.subtitle}>Our Legacy</span>
          <h2 className={styles.title}>A Tradition of Excellence</h2>
          <div className={styles.divider}></div>
        </div>

        <div className={styles.contentGrid}>
          {/* Left Column: Text Information */}
          <div className={styles.textContent}>
            <p className={styles.leadText}>
              For over a century, our institution has been at the forefront of academic 
              brilliance, shaping the minds that shape the future.
            </p>
            <p className={styles.paragraph}>
              Our campus is more than just a place of learning; it is a crucible where 
              innovation meets tradition. We pride ourselves on a rich history of 
              groundbreaking research, artistic achievement, and transformative social impact.
              Our distinguished faculty and state-of-the-art facilities provide an environment 
              where potential is recognized and nurtured.
            </p>

            <div className={styles.highlightsGrid}>
              <div className={styles.highlightCard}>
                <div className={styles.iconWrapper}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                  </svg>
                </div>
                <h3>Academic Rigor</h3>
                <p>Consistently ranked among the top global institutions for research and education.</p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.iconWrapper}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                    <path d="M2 12h20"/>
                  </svg>
                </div>
                <h3>Global Impact</h3>
                <p>Our alumni network spans over 150 countries, driving change worldwide.</p>
              </div>

              <div className={styles.highlightCard}>
                <div className={styles.iconWrapper}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3>Vibrant Community</h3>
                <p>A diverse, inclusive campus life that fosters lifelong friendships and networks.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Images */}
          <div className={styles.imageGrid}>
            <div className={`${styles.imageWrapper} ${styles.imageMain}`}>
              <Image 
                src="/img1.jpg" 
                alt="Main Campus Building" 
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={styles.image}
              />
            </div>
            <div className={`${styles.imageWrapper} ${styles.imageSecondary}`}>
              <Image 
                src="/img2.jpg" 
                alt="Students collaborating" 
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={styles.image}
              />
            </div>
            <div className={`${styles.imageWrapper} ${styles.imageTertiary}`}>
              <Image 
                src="/i1.jpg" 
                alt="Library" 
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className={styles.image}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
