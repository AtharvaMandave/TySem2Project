"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import styles from "./ConversationView.module.css";

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateSeparator(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

// Group messages by date for separators
function groupMessagesByDate(messages) {
  const groups = [];
  let currentDate = null;

  messages.forEach((msg) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groups.push({ type: "date", date: msg.createdAt });
    }
    groups.push({ type: "message", ...msg });
  });

  return groups;
}

export default function ConversationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const conversationId = params.id;

  // Sidebar state
  const [conversations, setConversations] = useState([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Chat state
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState("");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesAreaRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  // ─── Fetch Conversations ───
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
    }
  }, [status, fetchConversations]);

  // ─── Fetch Messages ───
  const fetchMessages = useCallback(async (isInitial = false) => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        if (data.otherUser) {
          setOtherUser(data.otherUser);
        }
        setChatError("");
      } else if (res.status === 404) {
        setChatError("Conversation not found");
      } else if (res.status === 403) {
        setChatError("You don't have access to this conversation");
      }
    } catch {
      if (isInitial) setChatError("Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId && status === "authenticated") {
      setLoadingMessages(true);
      setChatError("");
      fetchMessages(true);

      // Poll every 3s
      pollRef.current = setInterval(() => fetchMessages(false), 3000);
      return () => clearInterval(pollRef.current);
    }
  }, [conversationId, status, fetchMessages]);

  // ─── Auto-scroll ───
  const isNearBottom = useCallback(() => {
    if (!messagesAreaRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesAreaRef.current;
    return scrollHeight - scrollTop - clientHeight < 120;
  }, []);

  useEffect(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isNearBottom]);

  // Focus input when conversation changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [conversationId]);

  // ─── Send Message ───
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !conversationId) return;

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      senderId: session.user.id,
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newMessage.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id
              ? { ...data.message, status: "sent" }
              : m
          )
        );
        fetchConversations();
      } else {
        // Mark as failed
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticMsg.id ? { ...m, status: "failed" } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMsg.id ? { ...m, status: "failed" } : m
        )
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Retry failed message
  const handleRetry = async (failedMsg) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === failedMsg.id ? { ...m, status: "sending" } : m
      )
    );
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: failedMsg.text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedMsg.id ? { ...data.message, status: "sent" } : m
          )
        );
        fetchConversations();
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === failedMsg.id ? { ...m, status: "failed" } : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === failedMsg.id ? { ...m, status: "failed" } : m
        )
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // ─── Auth guards ───
  if (status === "loading") {
    return (
      <div className={styles.chatPage}>
        <div className={styles.fullCenter}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Find current conversation from sidebar data
  const activeConversation = conversations.find((c) => c.id === conversationId);
  const displayUser = otherUser || activeConversation?.otherUser || null;

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatLayout}>
        {/* ─── Sidebar ─── */}
        <aside className={`${styles.sidebar} ${showMobileSidebar ? styles.sidebarMobileShow : ""}`}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>Messages</h1>
            <span className={styles.convCount}>{conversations.length}</span>
            <button
              className={styles.closeSidebarBtn}
              onClick={() => setShowMobileSidebar(false)}
              aria-label="Close sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
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

          <div className={styles.conversationList}>
            {loadingConvs ? (
              <div className={styles.listLoading}>
                <div className={styles.loadingSpinner} />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className={styles.emptyList}>
                <p className={styles.emptyListText}>
                  {searchQuery ? `No results for "${searchQuery}"` : "No conversations yet"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <Link
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={`${styles.conversationItem} ${conv.id === conversationId ? styles.conversationItemActive : ""}`}
                  onClick={() => setShowMobileSidebar(false)}
                  id={`conv-${conv.id}`}
                >
                  <div className={styles.convAvatar}>
                    {getInitials(conv.otherUser.name)}
                  </div>
                  <div className={styles.convInfo}>
                    <div className={styles.convTopRow}>
                      <span className={styles.convName}>{conv.otherUser.name}</span>
                      <span className={styles.convTime}>{timeAgo(conv.lastMessageAt)}</span>
                    </div>
                    <div className={styles.convBottomRow}>
                      <span className={styles.convPreview}>
                        {conv.lastMessage || "No messages yet"}
                      </span>
                      <span className={styles.convRole}>{conv.otherUser.role}</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </aside>

        {/* ─── Chat Main ─── */}
        <main className={styles.chatMain}>
          {chatError ? (
            <div className={styles.fullCenter}>
              <div className={styles.errorIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
                </svg>
              </div>
              <h2 className={styles.stateTitle}>{chatError}</h2>
              <Link href="/chat" className={styles.secondaryBtn}>
                Back to Messages
              </Link>
            </div>
          ) : (
            <>
              {/* ─── Chat Header ─── */}
              <header className={styles.chatHeader}>
                <button
                  className={styles.menuBtn}
                  onClick={() => setShowMobileSidebar(true)}
                  aria-label="Open conversations"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                  </svg>
                </button>
                <Link href="/chat" className={styles.backBtn} aria-label="Back to messages">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
                  </svg>
                </Link>
                {displayUser ? (
                  <>
                    <div className={styles.headerAvatar}>
                      {getInitials(displayUser.name)}
                    </div>
                    <div className={styles.headerInfo}>
                      <div className={styles.headerName}>{displayUser.name}</div>
                      <div className={styles.headerMeta}>
                        <span className={styles.headerRole}>{displayUser.role}</span>
                        {displayUser.email && (
                          <>
                            <span className={styles.headerDot}>·</span>
                            <span className={styles.headerEmail}>{displayUser.email}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.headerInfo}>
                    <div className={styles.headerNameSkeleton} />
                    <div className={styles.headerMetaSkeleton} />
                  </div>
                )}
                <div className={styles.headerActions}>
                  <span className={styles.conversationIdBadge} title={`ID: ${conversationId}`}>
                    #{conversationId.slice(-6).toUpperCase()}
                  </span>
                </div>
              </header>

              {/* ─── Messages Area ─── */}
              <div className={styles.messagesArea} ref={messagesAreaRef}>
                {loadingMessages ? (
                  <div className={styles.messagesLoading}>
                    <div className={styles.loadingSpinner} />
                    <p className={styles.loadingText}>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={styles.emptyMessages}>
                    <div className={styles.emptyMsgIcon}>
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        <path d="M8 10h.01" />
                        <path d="M12 10h.01" />
                        <path d="M16 10h.01" />
                      </svg>
                    </div>
                    <h3 className={styles.emptyMsgTitle}>Start the conversation</h3>
                    <p className={styles.emptyMsgSubtitle}>
                      Send a message to begin chatting{displayUser ? ` with ${displayUser.name}` : ""}.
                    </p>
                  </div>
                ) : (
                  groupedMessages.map((item, index) =>
                    item.type === "date" ? (
                      <div key={`date-${index}`} className={styles.dateSeparator}>
                        <span className={styles.dateSeparatorText}>
                          {formatDateSeparator(item.date)}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={item.id}
                        className={`${styles.messageRow} ${
                          item.senderId === session.user.id
                            ? styles.messageRowSent
                            : styles.messageRowReceived
                        }`}
                      >
                        {item.senderId !== session.user.id && (
                          <div className={styles.msgAvatar}>
                            {displayUser ? getInitials(displayUser.name) : "?"}
                          </div>
                        )}
                        <div
                          className={`${styles.messageBubble} ${
                            item.senderId === session.user.id
                              ? styles.bubbleSent
                              : styles.bubbleReceived
                          } ${item.status === "failed" ? styles.bubbleFailed : ""}`}
                        >
                          <p className={styles.messageText}>{item.text}</p>
                          <div className={styles.messageMeta}>
                            <span className={styles.messageTime}>
                              {formatTime(item.createdAt)}
                            </span>
                            {item.senderId === session.user.id && (
                              <span className={styles.messageStatus}>
                                {item.status === "sending" ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                ) : item.status === "failed" ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                )}
                              </span>
                            )}
                          </div>
                          {item.status === "failed" && (
                            <button
                              className={styles.retryBtn}
                              onClick={() => handleRetry(item)}
                            >
                              Tap to retry
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ─── Input Area ─── */}
              <form className={styles.inputArea} onSubmit={handleSend}>
                <div className={styles.inputWrapper}>
                  <textarea
                    ref={inputRef}
                    className={styles.messageInput}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    id="chat-message-input"
                  />
                  <span className={styles.charCount}>
                    {newMessage.length > 0 && `${newMessage.length}/2000`}
                  </span>
                </div>
                <button
                  type="submit"
                  className={`${styles.sendBtn} ${newMessage.trim() ? styles.sendBtnActive : ""}`}
                  disabled={!newMessage.trim() || sending}
                  id="chat-send-btn"
                  aria-label="Send message"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </>
          )}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className={styles.mobileOverlay} onClick={() => setShowMobileSidebar(false)} />
      )}
    </div>
  );
}
