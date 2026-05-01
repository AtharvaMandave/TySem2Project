"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { label: "Alumni", href: "/alumni" },
  { label: "Events", href: "/events" },
  { label: "Invitations", href: "/invitations" },
  { label: "Messages", href: "/chat" },
];



export default function Navbar() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header
      className={`${styles.header} ${isScrolled ? styles.headerScrolled : ""}`}
    >
      {/* Utility Bar */}
      <div className={styles.utilityBar}>
        <div className={styles.utilityContainer}>
          <nav className={styles.utilityNav} aria-label="Utility navigation">

            {/* Auth section in utility bar */}
            {status === "authenticated" && session?.user ? (
              <>
                <span className={styles.utilityUser} id="utility-user-name">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {session.user.name}
                  <span className={styles.roleBadge}>
                    {session.user.role}
                  </span>
                </span>
                <Link
                  href="/profile"
                  className={styles.utilityLink}
                  id="utility-profile"
                >
                  PROFILE
                </Link>
                <button
                  onClick={handleSignOut}
                  className={styles.utilityLink}
                  id="utility-logout"
                  style={{ cursor: "pointer" }}
                >
                  LOGOUT
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className={styles.utilityLink}
                id="utility-login"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                LOGIN
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Main Navbar */}
      <div className={styles.mainNav}>
        <div className={styles.mainNavContainer}>
          {/* Logo */}
          <a href="/" className={styles.logo} id="navbar-logo">
            <div className={styles.logoIcon}>
              <img src="/logo.png" alt="Logo" />
            </div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Shri Balaji Vidyaprabodhini Mandal</span>
              <span className={styles.logoSubtitle}>LEGACY & EXCELLENCE</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav} aria-label="Main navigation">
            {NAV_LINKS.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className={styles.navLink}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className={styles.navLink}
                  id={`nav-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* CTA Button */}
          {/* <a
            href="#join"
            className={styles.ctaButton}
            id="navbar-join-circle"
          >
            Join the Circle
          </a> */}

          {/* Mobile Menu Toggle */}
          <button
            className={styles.mobileToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            id="mobile-menu-toggle"
          >
            <span
              className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerOpen1 : ""}`}
            />
            <span
              className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerOpen2 : ""}`}
            />
            <span
              className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.hamburgerOpen3 : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
        id="mobile-menu"
      >
        <nav aria-label="Mobile navigation">
          {NAV_LINKS.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.label}
                href={link.href}
                className={styles.mobileNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className={styles.mobileNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            )
          )}

          {status === "authenticated" && session?.user ? (
            <>
              <div className={styles.mobileUserInfo}>
                <span className={styles.mobileUserName}>{session.user.name}</span>
                <span className={styles.mobileUserRole}>{session.user.role}</span>
              </div>
              <Link
                href="/profile"
                className={styles.mobileNavLink}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Profile
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className={styles.mobileCta}
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={styles.mobileCta}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

