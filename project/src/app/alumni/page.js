"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Alumni.module.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function AlumniPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [connecting, setConnecting] = useState(null);

  const handleConnect = async (alumniId) => {
    if (authStatus !== "authenticated") {
      router.push("/login");
      return;
    }
    setConnecting(alumniId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/chat/${data.conversationId}`);
      }
    } catch {
      // silently fail
    } finally {
      setConnecting(null);
    }
  };

  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (yearFilter) params.set("year", yearFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/alumni?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch alumni");
        return;
      }

      setAlumni(data.alumni);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, yearFilter, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchAlumni();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchAlumni]);

  // Get unique passing years for the dropdown
  const uniqueYears = [...new Set(alumni.map((a) => a.passingYear))]
    .filter(Boolean)
    .sort((a, b) => b - a);

  return (
    <div className={styles.alumniPage}>
      {/* Hero Banner */}
      <section className={styles.heroBanner}>
        <span className={styles.heroTag}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
          Alumni Network
        </span>
        <h1 className={styles.heroTitle}>
          Our Distinguished{" "}
          <span className={styles.heroTitleAccent}>Alumni</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Discover the brilliant individuals who have walked through our halls
          and gone on to shape the world.
        </p>
      </section>

      {/* Filters */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersBar}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="alumni-search"
            />
          </div>

          <select
            className={styles.filterSelect}
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            id="alumni-year-filter"
          >
            <option value="">All Years</option>
            {uniqueYears.map((y) => (
              <option key={y} value={y}>
                Batch of {y}
              </option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="alumni-status-filter"
          >
            <option value="">All Statuses</option>
            <option value="Working">Working</option>
            <option value="Studying">Studying</option>
            <option value="Freelancing">Freelancing</option>
            <option value="Entrepreneur">Entrepreneur</option>
          </select>

          {!loading && (
            <span className={styles.resultCount}>
              <span className={styles.resultCountNumber}>{alumni.length}</span>{" "}
              alumni found
            </span>
          )}
        </div>
      </section>

      {/* Grid */}
      <section className={styles.gridSection}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading alumni directory...</p>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p className={styles.errorText}>{error}</p>
            <button
              className={styles.retryBtn}
              onClick={fetchAlumni}
              id="alumni-retry"
            >
              Try Again
            </button>
          </div>
        ) : alumni.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎓</div>
            <h2 className={styles.emptyTitle}>No Alumni Found</h2>
            <p className={styles.emptySubtitle}>
              {search || yearFilter || statusFilter
                ? "Try adjusting your search or filters."
                : "No alumni have registered yet. Be the first!"}
            </p>
          </div>
        ) : (
          <div className={styles.alumniGrid}>
            {alumni.map((person) => (
              <div className={styles.alumniCard} key={person.id}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatar}>
                    {getInitials(person.name)}
                  </div>
                  <div>
                    <div className={styles.cardName}>{person.name}</div>
                    <div className={styles.cardYear}>
                      Batch of {person.passingYear}
                    </div>
                  </div>
                </div>

                <div className={styles.cardDetails}>
                  {person.currentStatus && (
                    <div className={styles.detailRow}>
                      <svg
                        className={styles.detailIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <span className={styles.detailLabel}>Status</span>
                      <span>{person.currentStatus}</span>
                    </div>
                  )}

                  {person.company && (
                    <div className={styles.detailRow}>
                      <svg
                        className={styles.detailIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="2" y="7" width="20" height="14" rx="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span className={styles.detailLabel}>Company</span>
                      <span>{person.company}</span>
                    </div>
                  )}

                  {person.college && (
                    <div className={styles.detailRow}>
                      <svg
                        className={styles.detailIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      <span className={styles.detailLabel}>College</span>
                      <span>{person.college}</span>
                    </div>
                  )}
                </div>

                {person.currentStatus && (
                  <div className={styles.statusBadge}>
                    <span className={styles.statusDot} />
                    {person.currentStatus}
                  </div>
                )}

                <button
                  className={styles.connectBtn}
                  onClick={() => handleConnect(person.id)}
                  disabled={connecting === person.id || (session?.user?.id === person.id)}
                  id={`connect-${person.id}`}
                >
                  {connecting === person.id ? (
                    "Connecting..."
                  ) : session?.user?.id === person.id ? (
                    "You"
                  ) : (
                    <>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      Connect
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
