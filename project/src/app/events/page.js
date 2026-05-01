"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import styles from "./Events.module.css";

const CATEGORIES = [
  "General",
  "Workshop",
  "Seminar",
  "Cultural",
  "Sports",
  "Reunion",
  "Guest Lecture",
  "Career Fair",
];

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

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    inviteTarget: "all",
    category: "General",
  });

  const isFaculty = session?.user?.role === "faculty";

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setModalError("");
  };

  const handleCreate = async () => {
    if (!form.title || !form.description || !form.date || !form.time || !form.venue) {
      setModalError("Please fill in all required fields.");
      return;
    }

    setCreating(true);
    setModalError("");
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "Failed to create event");
        return;
      }
      // Reset and close
      setForm({
        title: "",
        description: "",
        date: "",
        time: "",
        venue: "",
        inviteTarget: "all",
        category: "General",
      });
      setShowModal(false);
      fetchEvents();
    } catch {
      setModalError("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const getInviteBadge = (target) => {
    switch (target) {
      case "students":
        return { label: "Students Only", cls: styles.inviteStudents };
      case "alumni":
        return { label: "Alumni Only", cls: styles.inviteAlumni };
      default:
        return { label: "Everyone", cls: styles.inviteAll };
    }
  };

  return (
    <div className={styles.eventsPage}>
      {/* Hero */}
      <section className={styles.heroBanner}>
        <span className={styles.heroTag}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Events & Happenings
        </span>
        <h1 className={styles.heroTitle}>
          Campus <span className={styles.heroAccent}>Events</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Stay updated with workshops, seminars, reunions, and everything happening in our community.
        </p>
      </section>

      {/* Create button — faculty only */}
      {isFaculty && (
        <div className={styles.createSection}>
          <button
            className={styles.createBtn}
            onClick={() => setShowModal(true)}
            id="create-event-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create Event
          </button>
        </div>
      )}

      {/* Events Grid */}
      <section className={styles.eventsSection}>
        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p className={styles.loadingText}>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📅</div>
            <h2 className={styles.emptyTitle}>No Events Yet</h2>
            <p className={styles.emptySubtitle}>
              {isFaculty
                ? "Create the first event for the community!"
                : "Check back soon for upcoming events."}
            </p>
          </div>
        ) : (
          <div className={styles.eventsGrid}>
            {events.map((event) => {
              const d = formatDate(event.date);
              const badge = getInviteBadge(event.inviteTarget);
              return (
                <div className={styles.eventCard} key={event.id}>
                  {/* Date Strip */}
                  <div className={styles.cardDateStrip}>
                    <div className={styles.dateBlock}>
                      <span className={styles.dateDay}>{d.day}</span>
                      <div className={styles.dateMonthYear}>
                        <span className={styles.dateMonth}>{d.month}</span>
                        <span className={styles.dateYear}>{d.year}</span>
                      </div>
                    </div>
                    <span className={`${styles.inviteBadge} ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div className={styles.cardBody}>
                    <span className={styles.cardCategory}>{event.category}</span>
                    <h3 className={styles.cardTitle}>{event.title}</h3>
                    <p className={styles.cardDescription}>{event.description}</p>
                  </div>

                  {/* Footer */}
                  <div className={styles.cardFooter}>
                    <div className={styles.footerItem}>
                      <svg className={styles.footerIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {event.time}
                    </div>
                    <div className={styles.footerItem}>
                      <svg className={styles.footerIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {event.venue}
                    </div>
                    <span className={styles.createdByTag}>
                      by <span className={styles.createdByName}>{event.createdBy.name}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Event Modal */}
      {showModal && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Event</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              {modalError && (
                <div className={styles.modalError}>{modalError}</div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Title *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Annual Alumni Reunion 2026"
                  value={form.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  id="event-title"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description *</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Describe the event, agenda, and what attendees can expect..."
                  value={form.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  rows={3}
                  id="event-description"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date *</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={form.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                    id="event-date"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Time *</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={form.time}
                    onChange={(e) => handleFormChange("time", e.target.value)}
                    id="event-time"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Venue *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Main Auditorium, Hall 3"
                  value={form.venue}
                  onChange={(e) => handleFormChange("venue", e.target.value)}
                  id="event-venue"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Invite</label>
                  <select
                    className={styles.formSelect}
                    value={form.inviteTarget}
                    onChange={(e) => handleFormChange("inviteTarget", e.target.value)}
                    id="event-invite"
                  >
                    <option value="all">Everyone (Students & Alumni)</option>
                    <option value="students">Students Only</option>
                    <option value="alumni">Alumni Only</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    className={styles.formSelect}
                    value={form.category}
                    onChange={(e) => handleFormChange("category", e.target.value)}
                    id="event-category"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalSubmitBtn}
                onClick={handleCreate}
                disabled={creating}
                id="event-submit"
              >
                {creating ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
