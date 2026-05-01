"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Register.module.css";

const ROLES = [
  {
    value: "student",
    label: "Student",
    icon: (
      <svg className={styles.roleIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  {
    value: "faculty",
    label: "Faculty",
    icon: (
      <svg className={styles.roleIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    value: "alumni",
    label: "Alumni",
    icon: (
      <svg className={styles.roleIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
];

const SUBJECTS = [
  "Mathematics",
  "Science",
  "English",
  "Hindi",
  "Social Studies",
  "Computer Science",
  "Physical Education",
  "Arts",
  "Commerce",
  "Other",
];

const DESIGNATIONS = ["Teacher", "Coordinator", "Principal"];

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    // Student fields
    class: "",
    division: "",
    rollNumber: "",
    // Faculty fields
    subject: "",
    designation: "",
    // Alumni fields
    passingYear: "",
    currentStatus: "",
    company: "",
    college: "",
    privacy: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    setError("");
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
  };

  const buildProfileData = () => {
    if (role === "student") {
      return {
        class: formData.class,
        division: formData.division,
        rollNumber: formData.rollNumber,
      };
    }
    if (role === "faculty") {
      return {
        subject: formData.subject,
        designation: formData.designation,
      };
    }
    if (role === "alumni") {
      return {
        passingYear: formData.passingYear,
        currentStatus: formData.currentStatus,
        company: formData.company,
        college: formData.college,
        privacy: formData.privacy,
      };
    }
    return {};
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role,
          profileData: buildProfileData(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Auto-login after successful registration
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push("/login");
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
      <Link href="/" className={styles.backLink} id="register-back-home">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="m12 19-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <div className={styles.authCard}>
        {/* Left Side: Branding & Info */}
        <div className={styles.authInfo}>
          <Link href="/" className={styles.authLogo} id="register-logo">
            <div className={styles.logoIcon}>A</div>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>ALUMNI CONNECT</span>
              <span className={styles.logoSubtitle}>Legacy & Excellence</span>
            </div>
          </Link>

          <h1 className={styles.authHeading}>Create Account</h1>
          <p className={styles.authSubheading}>
            Join our exclusively curated community of excellence
          </p>

          <ul className={styles.featureList}>
            <li>
              <span className={styles.featureIcon}>✨</span>
              Connect with leading alumni globally
            </li>
            <li>
              <span className={styles.featureIcon}>📚</span>
              Access exclusive top-tier mentorship
            </li>
            <li>
              <span className={styles.featureIcon}>🚀</span>
              Elevate your career trajectory
            </li>
          </ul>
        </div>

        {/* Right Side: Interactive Form */}
        <div className={styles.authFormWrapper}>
          {/* Role Selector */}
          <div className={styles.roleTabs} id="register-role-tabs">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`${styles.roleTab} ${
                  role === r.value ? styles.roleTabActive : ""
                }`}
                onClick={() => handleRoleChange(r.value)}
                id={`role-tab-${r.value}`}
              >
                {r.icon}
                {r.label}
              </button>
            ))}
          </div>

          {error && (
            <div className={styles.errorMessage} id="register-error">
              {error}
            </div>
          )}

          <form className={styles.authForm} onSubmit={handleSubmit}>
            {/* Common Fields */}
            <div className={styles.formGroup}>
              <label htmlFor="register-name" className={styles.formLabel}>
                Full Name
              </label>
              <input
                type="text"
                id="register-name"
                name="name"
                className={styles.formInput}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="register-email" className={styles.formLabel}>
                Email Address
              </label>
              <input
                type="email"
                id="register-email"
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
              <label htmlFor="register-password" className={styles.formLabel}>
                Password
              </label>
              <input
                type="password"
                id="register-password"
                name="password"
                className={styles.formInput}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            {/* Divider */}
            <div className={styles.sectionDivider}>
              <span className={styles.sectionLabel}>
                {role === "student" && "Student Details"}
                {role === "faculty" && "Faculty Details"}
                {role === "alumni" && "Alumni Details"}
              </span>
            </div>

            {/* === STUDENT FIELDS === */}
            {role === "student" && (
              <div className={styles.profileFields}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="register-class" className={styles.formLabel}>
                      Class
                    </label>
                    <input
                      type="text"
                      id="register-class"
                      name="class"
                      className={styles.formInput}
                      placeholder="e.g. 10th"
                      value={formData.class}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="register-division" className={styles.formLabel}>
                      Division
                    </label>
                    <input
                      type="text"
                      id="register-division"
                      name="division"
                      className={styles.formInput}
                      placeholder="e.g. A"
                      value={formData.division}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formGroup} style={{ marginTop: "1rem" }}>
                  <label htmlFor="register-rollNumber" className={styles.formLabel}>
                    Roll Number
                  </label>
                  <input
                    type="text"
                    id="register-rollNumber"
                    name="rollNumber"
                    className={styles.formInput}
                    placeholder="e.g. 25"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* === FACULTY FIELDS === */}
            {role === "faculty" && (
              <div className={styles.profileFields}>
                <div className={styles.formGroup}>
                  <label htmlFor="register-subject" className={styles.formLabel}>
                    Subject
                  </label>
                  <select
                    id="register-subject"
                    name="subject"
                    className={styles.formSelect}
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a subject</option>
                    {SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="register-designation" className={styles.formLabel}>
                    Designation
                  </label>
                  <select
                    id="register-designation"
                    name="designation"
                    className={styles.formSelect}
                    value={formData.designation}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select your designation</option>
                    {DESIGNATIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* === ALUMNI FIELDS === */}
            {role === "alumni" && (
              <div className={styles.profileFields}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="register-passingYear" className={styles.formLabel}>
                      Passing Year
                    </label>
                    <input
                      type="number"
                      id="register-passingYear"
                      name="passingYear"
                      className={styles.formInput}
                      placeholder="e.g. 2020"
                      value={formData.passingYear}
                      onChange={handleChange}
                      required
                      min="1950"
                      max="2099"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="register-currentStatus" className={styles.formLabel}>
                      Current Status
                    </label>
                    <input
                      type="text"
                      id="register-currentStatus"
                      name="currentStatus"
                      className={styles.formInput}
                      placeholder="e.g. Working, Studying"
                      value={formData.currentStatus}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className={styles.formRow} style={{ marginTop: "1rem" }}>
                  <div className={styles.formGroup}>
                    <label htmlFor="register-company" className={styles.formLabel}>
                      Company (optional)
                    </label>
                    <input
                      type="text"
                      id="register-company"
                      name="company"
                      className={styles.formInput}
                      placeholder="e.g. Google"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="register-college" className={styles.formLabel}>
                      College (optional)
                    </label>
                    <input
                      type="text"
                      id="register-college"
                      name="college"
                      className={styles.formInput}
                      placeholder="e.g. IIT Bombay"
                      value={formData.college}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className={styles.checkboxGroup} style={{ marginTop: "0.75rem" }}>
                  <input
                    type="checkbox"
                    id="register-privacy"
                    name="privacy"
                    className={styles.formCheckbox}
                    checked={formData.privacy}
                    onChange={handleChange}
                  />
                  <label htmlFor="register-privacy" className={styles.checkboxLabel}>
                    Keep my profile private
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
              id="register-submit"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className={styles.authFooter}>
            Already have an account?{" "}
            <Link href="/login" className={styles.authFooterLink} id="register-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
