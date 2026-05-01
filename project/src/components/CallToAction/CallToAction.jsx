import styles from "./CallToAction.module.css";

export default function CallToAction() {
  return (
    <section className={styles.cta} id="cta-section">
      <div className={styles.container}>
        <h2 className={styles.heading}>
          Secure Your Place in the Inner Circle.
        </h2>
        <p className={styles.description}>
          Membership is reserved for graduates who embody the spirit of
          excellence. Application requires verification of academic records.
        </p>
        <a
          href="#apply"
          className="btn btn-primary"
          id="cta-begin-application"
        >
          Begin Application
        </a>
        <p className={styles.note}>
          Standard review period: 5-7 business days.
        </p>
      </div>
    </section>
  );
}
