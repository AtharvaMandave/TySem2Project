"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import styles from "./Profile.module.css";

const SUBJECTS = [
  "Mathematics", "Science", "English", "Hindi",
  "Social Studies", "Computer Science", "Physical Education",
  "Arts", "Commerce", "Other",
];

const DESIGNATIONS = ["Teacher", "Coordinator", "Principal"];

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();
  const [userData, setUserData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Editable form state
  const [formName, setFormName] = useState("");
  const [formProfile, setFormProfile] = useState({});

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        setUserData(data.user);
        setProfileData(data.profile);
        setFormName(data.user.name);
        initFormProfile(data.user.role, data.profile);
      }
    } catch {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  function initFormProfile(role, profile) {
    if (role === "student") {
      setFormProfile({
        class: profile?.class || "",
        division: profile?.division || "",
        rollNumber: profile?.rollNumber || "",
      });
    } else if (role === "faculty") {
      setFormProfile({
        subject: profile?.subject || "",
        designation: profile?.designation || "",
      });
    } else if (role === "alumni") {
      setFormProfile({
        passingYear: profile?.passingYear || "",
        currentStatus: profile?.currentStatus || "",
        company: profile?.company || "",
        college: profile?.college || "",
        privacy: profile?.privacy || false,
      });
    }
  }

  useEffect(() => {
    if (authStatus === "authenticated") {
      fetchProfile();
    } else if (authStatus === "unauthenticated") {
      setLoading(false);
    }
  }, [authStatus, fetchProfile]);

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setSuccess("");
    setFormName(userData.name);
    initFormProfile(userData.role, profileData);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          profileData: formProfile,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }
      setSuccess("Profile updated successfully!");
      setEditing(false);
      // Re-fetch to get the updated data
      await fetchProfile();
      // Update the session to reflect the new name in navbar
      await updateSession({ name: formName });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setFormProfile((prev) => ({ ...prev, [field]: value }));
  };

  // --- Not logged in ---
  if (authStatus === "unauthenticated") {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loginPrompt}>
          <div className={styles.loginIcon}>🔒</div>
          <h2 className={styles.loginTitle}>Login Required</h2>
          <p className={styles.loginSubtitle}>
            Sign in to view and edit your profile.
          </p>
          <Link href="/login" className={styles.loginBtn} id="profile-login">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // --- Loading ---
  if (loading || !userData) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      {/* Profile Header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>
          {getInitials(userData.name)}
        </div>
        <div className={styles.profileHeaderInfo}>
          <h1 className={styles.profileName}>{userData.name}</h1>
          <div className={styles.profileMeta}>
            <span className={styles.roleBadge}>{userData.role}</span>
            <span className={styles.joinDate}>
              Joined {new Date(userData.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
        {!editing ? (
          <button
            className={`${styles.editToggleBtn} ${styles.editBtn}`}
            onClick={() => { setEditing(true); setSuccess(""); }}
            id="profile-edit-btn"
          >
            ✏️ Edit
          </button>
        ) : (
          <button
            className={`${styles.editToggleBtn} ${styles.cancelBtn}`}
            onClick={handleCancel}
            id="profile-cancel-btn"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Messages */}
      {success && <div className={styles.successMessage}>{success}</div>}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.card}>
          {/* Account Info */}
          <div className={styles.cardSection}>
            <h3 className={styles.sectionTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Account Information
            </h3>
            {editing ? (
              <div className={styles.fieldGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Your full name"
                    id="profile-name-input"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={userData.email}
                    disabled
                    style={{ opacity: 0.5, cursor: "not-allowed" }}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.fieldGrid}>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldLabel}>Full Name</span>
                  <span className={styles.fieldValue}>{userData.name}</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldLabel}>Email</span>
                  <span className={styles.fieldValue}>{userData.email}</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldLabel}>Role</span>
                  <span className={styles.fieldValue} style={{ textTransform: "capitalize" }}>{userData.role}</span>
                </div>
                <div className={styles.fieldItem}>
                  <span className={styles.fieldLabel}>Member Since</span>
                  <span className={styles.fieldValue}>
                    {new Date(userData.createdAt).toLocaleDateString("en-US", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Role-Specific Fields */}
          <div className={styles.cardSection}>
            <h3 className={styles.sectionTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              {userData.role === "student" && "Student Details"}
              {userData.role === "faculty" && "Faculty Details"}
              {userData.role === "alumni" && "Alumni Details"}
            </h3>

            {/* === STUDENT === */}
            {userData.role === "student" && (
              editing ? (
                <div className={styles.fieldGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Class</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formProfile.class}
                      onChange={(e) => handleProfileChange("class", e.target.value)}
                      placeholder="e.g. 10th"
                      id="profile-class"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Division</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formProfile.division}
                      onChange={(e) => handleProfileChange("division", e.target.value)}
                      placeholder="e.g. A"
                      id="profile-division"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Roll Number</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={formProfile.rollNumber}
                      onChange={(e) => handleProfileChange("rollNumber", e.target.value)}
                      placeholder="e.g. 25"
                      id="profile-roll"
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Class</span>
                    <span className={profileData?.class ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.class || "Not set"}
                    </span>
                  </div>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Division</span>
                    <span className={profileData?.division ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.division || "Not set"}
                    </span>
                  </div>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Roll Number</span>
                    <span className={profileData?.rollNumber ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.rollNumber || "Not set"}
                    </span>
                  </div>
                </div>
              )
            )}

            {/* === FACULTY === */}
            {userData.role === "faculty" && (
              editing ? (
                <div className={styles.fieldGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Subject</label>
                    <select
                      className={styles.formSelect}
                      value={formProfile.subject}
                      onChange={(e) => handleProfileChange("subject", e.target.value)}
                      id="profile-subject"
                    >
                      <option value="">Select a subject</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Designation</label>
                    <select
                      className={styles.formSelect}
                      value={formProfile.designation}
                      onChange={(e) => handleProfileChange("designation", e.target.value)}
                      id="profile-designation"
                    >
                      <option value="">Select designation</option>
                      {DESIGNATIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Subject</span>
                    <span className={profileData?.subject ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.subject || "Not set"}
                    </span>
                  </div>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Designation</span>
                    <span className={profileData?.designation ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.designation || "Not set"}
                    </span>
                  </div>
                </div>
              )
            )}

            {/* === ALUMNI === */}
            {userData.role === "alumni" && (
              editing ? (
                <>
                  <div className={styles.fieldGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Passing Year</label>
                      <input
                        type="number"
                        className={styles.formInput}
                        value={formProfile.passingYear}
                        onChange={(e) => handleProfileChange("passingYear", e.target.value)}
                        placeholder="e.g. 2020"
                        min="1950"
                        max="2099"
                        id="profile-passing-year"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Current Status</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={formProfile.currentStatus}
                        onChange={(e) => handleProfileChange("currentStatus", e.target.value)}
                        placeholder="e.g. Working, Studying"
                        id="profile-status"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Company</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={formProfile.company}
                        onChange={(e) => handleProfileChange("company", e.target.value)}
                        placeholder="e.g. Google"
                        id="profile-company"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>College</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={formProfile.college}
                        onChange={(e) => handleProfileChange("college", e.target.value)}
                        placeholder="e.g. IIT Bombay"
                        id="profile-college"
                      />
                    </div>
                  </div>
                  <div className={styles.checkboxRow} style={{ marginTop: "1rem" }}>
                    <input
                      type="checkbox"
                      className={styles.formCheckbox}
                      checked={formProfile.privacy}
                      onChange={(e) => handleProfileChange("privacy", e.target.checked)}
                      id="profile-privacy"
                    />
                    <label htmlFor="profile-privacy" className={styles.checkboxLabel}>
                      Keep my profile private (hidden from Alumni directory)
                    </label>
                  </div>
                </>
              ) : (
                <div className={styles.fieldGrid}>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Passing Year</span>
                    <span className={profileData?.passingYear ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.passingYear || "Not set"}
                    </span>
                  </div>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Current Status</span>
                    <span className={profileData?.currentStatus ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.currentStatus || "Not set"}
                    </span>
                  </div>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Company</span>
                    <span className={profileData?.company ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.company || "Not set"}
                    </span>
                  </div>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>College</span>
                    <span className={profileData?.college ? styles.fieldValue : styles.fieldValueMuted}>
                      {profileData?.college || "Not set"}
                    </span>
                  </div>
                  <div className={styles.fieldItem}>
                    <span className={styles.fieldLabel}>Profile Visibility</span>
                    <span className={styles.fieldValue}>
                      {profileData?.privacy ? "🔒 Private" : "🌐 Public"}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Save Button */}
          {editing && (
            <div className={styles.saveSection}>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving}
                id="profile-save-btn"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
