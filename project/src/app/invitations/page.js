"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "./Invitations.module.css";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    year: d.getFullYear(),
    full: d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };
}

export default function InvitationsPage() {
  const { data: session, status: authStatus } = useSession();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, upcoming, accepted, declined
  const [rsvpLoading, setRsvpLoading] = useState(null);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/invitations");
      const data = await res.json();
      if (res.ok) {
        setInvitations(data.invitations);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchInvitations();
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [authStatus, fetchInvitations]);

  const handleRsvp = async (eventId, status) => {
    setRsvpLoading(eventId);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });
      if (res.ok) {
        // Update local state
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === eventId
              ? {
                  ...inv,
                  rsvpStatus: status,
                  attendeeCount:
                    status === "accepted"
                      ? inv.attendeeCount + (inv.rsvpStatus === "accepted" ? 0 : 1)
                      : inv.attendeeCount - (inv.rsvpStatus === "accepted" ? 1 : 0),
                }
              : inv
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setRsvpLoading(null);
    }
  };

  const getInviteBadge = (target) => {
    switch (target) {
      case "students":
        return { label: "Students", cls: styles.inviteStudents };
      case "alumni":
        return { label: "Alumni", cls: styles.inviteAlumni };
      default:
        return { label: "Everyone", cls: styles.inviteAll };
    }
  };

  // Filter invitations
  const filtered = invitations.filter((inv) => {
    if (filter === "upcoming") return inv.isUpcoming;
    if (filter === "accepted") return inv.rsvpStatus === "accepted";
    if (filter === "declined") return inv.rsvpStatus === "declined";
    return true;
  });

  const upcomingCount = invitations.filter((i) => i.isUpcoming).length;
  const acceptedCount = invitations.filter((i) => i.rsvpStatus === "accepted").length;
  const declinedCount = invitations.filter((i) => i.rsvpStatus === "declined").length;

  // Not logged in
  if (authStatus === "unauthenticated") {
    return (
      <div className={styles.invitationsPage}>
        <section className={styles.heroBanner}>
          <h1 className={styles.heroTitle}>My <span className={styles.heroAccent}>Invitations</span></h1>
        </section>
        <div className={styles.loginPrompt}>
          <div className={styles.loginIcon}>🔒</div>
          <h2 className={styles.loginTitle}>Login Required</h2>
          <p className={styles.loginSubtitle}>Sign in to view your event invitations.</p>
          <Link href="/login" className={styles.loginBtn} id="inv-login">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.invitationsPage}>
      {/* Hero */}
      <section className={styles.heroBanner}>
        <span className={styles.heroTag}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Your Invitations
        </span>
        <h1 className={styles.heroTitle}>
          My <span className={styles.heroAccent}>Invitations</span>
        </h1>
        <p className={styles.heroSubtitle}>
          {session?.user?.role === "faculty"
            ? "Events you've created and their RSVP statuses."
            : "Events you've been invited to. Accept or decline to let organizers know."}
        </p>
      </section>

      {/* Filter Tabs */}
      <div className={styles.filterSection}>
        <div className={styles.filterTabs}>
          {[
            { key: "all", label: "All", count: invitations.length },
            { key: "upcoming", label: "Upcoming", count: upcomingCount },
            { key: "accepted", label: "Accepted", count: acceptedCount },
            { key: "declined", label: "Declined", count: declinedCount },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`${styles.filterTab} ${filter === tab.key ? styles.filterTabActive : ""}`}
              onClick={() => setFilter(tab.key)}
              id={`filter-${tab.key}`}
            >
              {tab.label}
              <span className={styles.tabCount}>{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <section className={styles.listSection}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading invitations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📬</div>
            <h2 className={styles.emptyTitle}>
              {filter === "all" ? "No Invitations Yet" : `No ${filter} invitations`}
            </h2>
            <p className={styles.emptySubtitle}>
              {filter === "all"
                ? "You don't have any event invitations yet. Check back soon!"
                : "Try switching to a different tab."}
            </p>
          </div>
        ) : (
          <div className={styles.invitationsList}>
            {filtered.map((inv) => {
              const d = formatDate(inv.date);
              const badge = getInviteBadge(inv.inviteTarget);
              return (
                <div
                  className={`${styles.invitationCard} ${!inv.isUpcoming ? styles.cardPastOverlay : ""}`}
                  key={inv.id}
                >
                  {/* Date Column */}
                  <div className={styles.dateColumn}>
                    <span className={styles.dateDay}>{d.day}</span>
                    <span className={styles.dateMonth}>{d.month}</span>
                    <span className={styles.dateYear}>{d.year}</span>
                  </div>

                  {/* Content */}
                  <div className={styles.cardContent}>
                    <div className={styles.cardTop}>
                      <div>
                        <div className={styles.cardCategory}>{inv.category}</div>
                        <h3 className={styles.cardTitle}>{inv.title}</h3>
                      </div>
                      <span className={`${styles.inviteBadge} ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className={styles.cardDescription}>{inv.description}</p>

                    <div className={styles.cardMeta}>
                      <div className={styles.metaItem}>
                        <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {inv.time}
                      </div>
                      <div className={styles.metaItem}>
                        <svg className={styles.metaIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        {inv.venue}
                      </div>
                      <span className={styles.createdBy}>
                        by <span className={styles.createdByName}>{inv.createdBy.name}</span>
                      </span>
                    </div>

                    {/* RSVP Section */}
                    <div className={styles.rsvpActions}>
                      {!inv.isUpcoming ? (
                        <span className={styles.pastLabel}>Event Passed</span>
                      ) : inv.rsvpStatus ? (
                        <>
                          <span
                            className={`${styles.rsvpStatus} ${
                              inv.rsvpStatus === "accepted"
                                ? styles.rsvpAccepted
                                : styles.rsvpDeclined
                            }`}
                          >
                            <span className={styles.statusDot} />
                            {inv.rsvpStatus === "accepted" ? "Accepted" : "Declined"}
                          </span>
                          {/* Allow changing response */}
                          {inv.rsvpStatus === "accepted" ? (
                            <button
                              className={`${styles.rsvpBtn} ${styles.declineBtn}`}
                              onClick={() => handleRsvp(inv.id, "declined")}
                              disabled={rsvpLoading === inv.id}
                            >
                              Change to Decline
                            </button>
                          ) : (
                            <button
                              className={`${styles.rsvpBtn} ${styles.acceptBtn}`}
                              onClick={() => handleRsvp(inv.id, "accepted")}
                              disabled={rsvpLoading === inv.id}
                            >
                              Change to Accept
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <button
                            className={`${styles.rsvpBtn} ${styles.acceptBtn}`}
                            onClick={() => handleRsvp(inv.id, "accepted")}
                            disabled={rsvpLoading === inv.id}
                            id={`rsvp-accept-${inv.id}`}
                          >
                            ✓ Accept
                          </button>
                          <button
                            className={`${styles.rsvpBtn} ${styles.declineBtn}`}
                            onClick={() => handleRsvp(inv.id, "declined")}
                            disabled={rsvpLoading === inv.id}
                            id={`rsvp-decline-${inv.id}`}
                          >
                            ✕ Decline
                          </button>
                        </>
                      )}

                      <span className={styles.attendeeCount}>
                        <span className={styles.attendeeNumber}>{inv.attendeeCount}</span> attending
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
