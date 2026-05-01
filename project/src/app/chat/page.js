"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./Chat.module.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
      // Poll for new conversations every 5 seconds
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [status, fetchConversations]);

  if (status === "loading") {
    return (
      <div className={styles.chatPage}>
        <div className={styles.fullCenterState}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className={styles.chatPage}>
        <div className={styles.fullCenterState}>
          <div className={styles.lockIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className={styles.stateTitle}>Sign in to view messages</h2>
          <p className={styles.stateSubtitle}>
            Connect with alumni and start meaningful conversations.
          </p>
          <Link href="/login" className={styles.primaryBtn} id="chat-login-btn">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatLayout}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
            <span className={styles.convCount}>{conversations.length}</span>
          </div>

          {/* Search */}
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="chat-search-input"
            />
          </div>

          {/* Conversation List */}
          <div className={styles.conversationList}>
            {loadingConvs ? (
              <div className={styles.listLoading}>
                <div className={styles.loadingSpinner} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className={styles.emptyList}>
                {searchQuery ? (
                  <>
                    <p className={styles.emptyListText}>No results for &quot;{searchQuery}&quot;</p>
                  </>
                ) : (
                  <>
                    <div className={styles.emptyListIcon}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p className={styles.emptyListTitle}>No conversations yet</p>
                    <p className={styles.emptyListText}>
                      Visit the alumni directory to start connecting.
                    </p>
                    <Link href="/alumni" className={styles.secondaryBtn}>
                      Browse Alumni
                    </Link>
                  </>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={styles.conversationItem}
                  id={`conv-${conv.id}`}
                >
                  <div className={styles.convAvatar}>
                    {getInitials(conv.otherUser.name)}
                  </div>
                  <div className={styles.convInfo}>
                    <div className={styles.convTopRow}>
                      <span className={styles.convName}>
                        {conv.otherUser.name}
                      </span>
                      <span className={styles.convTime}>
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    </div>
                    <div className={styles.convBottomRow}>
                      <span className={styles.convPreview}>
                        {conv.lastMessage || "No messages yet"}
                      </span>
                      <span className={styles.convRole}>
                        {conv.otherUser.role}
                      </span>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className={styles.unreadBadge}>
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* No-conversation-selected state (desktop only) */}
        <main className={styles.chatMainEmpty}>
          <div className={styles.emptyMainContent}>
            <div className={styles.emptyMainIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className={styles.emptyMainTitle}>Select a conversation</h2>
            <p className={styles.emptyMainSubtitle}>
              Choose a conversation from the sidebar to start messaging,
              or visit the alumni directory to connect with someone new.
            </p>
            <Link href="/alumni" className={styles.primaryBtn}>
              Find Alumni
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
