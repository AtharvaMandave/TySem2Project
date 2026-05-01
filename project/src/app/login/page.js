"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <Link href="/" className={styles.backLink} id="login-back-home">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <div className={styles.authCard}>
        {/* Left Side: Branding & Info */}
        <div className={styles.authInfo}>
          <Link href="/" className={styles.authLogo} id="login-logo">
            <div className={styles.logoIcon}>A</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>ALUMNI CONNECT</span>
              <span className={styles.logoSubtitle}>Legacy & Excellence</span>
            </div>
          </Link>

          <h1 className={styles.authHeading}>Welcome Back</h1>
          <p className={styles.authSubheading}>
            Sign in to securely access your distinguished alumni dashboard
          </p>

          <ul className={styles.featureList}>
            <li>
              <span className={styles.featureIcon}>🌐</span>
              Engage with your global community
            </li>
            <li>
              <span className={styles.featureIcon}>💡</span>
              Discover exclusive insights
            </li>
          </ul>
        </div>

        {/* Right Side: Interactive Form */}
        <div className={styles.authFormWrapper}>
          {error && (
            <div className={styles.errorMessage} id="login-error">
              {error}
            </div>
          )}

          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="login-email" className={styles.formLabel}>
                Email Address
              </label>
              <input
                type="email"
                id="login-email"
                name="email"
                className={styles.formInput}
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="login-password" className={styles.formLabel}>
                Password
              </label>
              <input
                type="password"
                id="login-password"
                name="password"
                className={styles.formInput}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              id="login-submit"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className={styles.authFooter}>
            Don&apos;t have an account?{" "}
            <Link href="/register" className={styles.authFooterLink} id="login-register-link">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
