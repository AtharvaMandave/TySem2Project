"use client";

import { useState } from "react";
import styles from "./Footer.module.css";

const EXPLORE_LINKS = [
  { label: "The Network", href: "#network" },
  { label: "Industry Groups", href: "#industry" },
  { label: "Career Hub", href: "#career" },
  { label: "Member Directory", href: "#directory" },
];

const SUPPORT_LINKS = [
  { label: "Giving Back", href: "#giving" },
  { label: "Volunteering", href: "#volunteering" },
  { label: "Contact Us", href: "#contact" },
  { label: "Help Center", href: "#help" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms" },
  { label: "Cookie Policy", href: "#cookies" },
];

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Handle subscribe logic
    setEmail("");
  };

  return (
    <footer className={styles.footer} id="footer">
      {/* Main Footer */}
      <div className={styles.mainFooter}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Brand Column */}
            <div className={styles.brandColumn}>
              <div className={styles.logo}>
                <div className={styles.logoIcon}>
                  <span className={styles.logoLetter}>A</span>
                </div>
                <span className={styles.logoTitle}>ALUMNI CONNECT</span>
              </div>
              <p className={styles.brandDescription}>
                Dedicated to the lifelong success and connectivity of our
                graduates. Empowering a global community of leaders.
              </p>
              <div className={styles.socialLinks}>
                {/* LinkedIn */}
                <a
                  href="#linkedin"
                  className={styles.socialLink}
                  aria-label="LinkedIn"
                  id="footer-linkedin"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                {/* Twitter / X */}
                <a
                  href="#twitter"
                  className={styles.socialLink}
                  aria-label="Twitter"
                  id="footer-twitter"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Explore Column */}
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Explore</h3>
              <ul className={styles.linkList}>
                {EXPLORE_LINKS.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={styles.footerLink}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Column */}
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Support</h3>
              <ul className={styles.linkList}>
                {SUPPORT_LINKS.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={styles.footerLink}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className={styles.linkColumn}>
              <h3 className={styles.columnTitle}>Newsletter</h3>
              <p className={styles.newsletterText}>
                Subscribe for quarterly alumni insights and event updates.
              </p>
              <form
                className={styles.newsletterForm}
                onSubmit={handleSubscribe}
              >
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.emailInput}
                  required
                  id="footer-email-input"
                  aria-label="Email address for newsletter"
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  className={styles.subscribeBtn}
                  id="footer-subscribe-btn"
                  suppressHydrationWarning
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.container}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} ALUMNI CONNECT. ALL RIGHTS
              RESERVED.
            </p>
            <nav className={styles.legalNav} aria-label="Legal links">
              {LEGAL_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={styles.legalLink}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
