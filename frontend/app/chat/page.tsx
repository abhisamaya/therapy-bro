"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { listChats, startSession, getHistory, streamMessage } from "@/lib/api";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import { useRouter } from "next/navigation";
import { LISTENER_META } from "@/lib/listeners";
import { Menu, X, Clock, MessageCircle, Brain } from "lucide-react";

type Msg = { role: "user" | "assistant" | "system"; content: string };
type Conv = {
  session_id: string;
  category: string;
  updated_at: string;
  notes?: string;
};

export default function ChatPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // ----- Timer state -----
  const [totalSeconds, setTotalSeconds] = useState<number>(300); // default 5 min
  const [remaining, setRemaining] = useState<number>(300);
  const [running, setRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Expiry modal
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);

  // categories shown in left UI and modal
  const categories = ["TherapyBro"];

  // hover state for tooltip
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // collapsible conversations container in full-size mode
  const [convsOpen, setConvsOpen] = useState<boolean>(true);

  // -------------------------
  // helpers
  // -------------------------
  const appendSystem = useCallback((text: string) => {
    setMessages((prev) => [...prev, { role: "system", content: text }]);
  }, []);

  // get category name for active session id
  const getActiveCategory = (): string | null => {
    if (!active) return null;
    const conv = convs.find((c) => c.session_id === active);
    return conv?.category ?? null;
  };

  // helper to get welcome for active category
  const activeCategory = getActiveCategory();
  const activeWelcome = activeCategory
    ? (LISTENER_META[activeCategory]?.welcome ?? LISTENER_META.TherapyBro.welcome)
    : LISTENER_META.TherapyBro.welcome;

  // load conversations and initial session
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        const list = await listChats();
        setConvs(list);
        if (list.length) {
          await select(list[0].session_id); // will auto-start timer for "continue"
        } else {
          // create a default session and start it
          const s = await startSession("general");
          setActive(s.session_id);
          await load(s.session_id);
          setConvs(await listChats());
          // start timer automatically for new session
          startTimerWithCurrentDuration();
          // append generic system welcome
          appendSystem(LISTENER_META.general.welcome);
        }
      } catch {
        router.push("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async (id: string) => {
    const h = await getHistory(id);
    // keep system messages out of the main stream
    setMessages(h.messages.filter((m: Msg) => m.role !== "system"));
    // If this session has no user/assistant messages yet, append the listener-specific system welcome
    const conv = convs.find((c) => c.session_id === id);
    const cat = conv?.category ?? null;
    if (
      h.messages.filter((m: Msg) => m.role !== "system").length === 0 &&
      cat
    ) {
      const meta = LISTENER_META[cat] ?? LISTENER_META.general;
      appendSystem(meta.welcome);
    }
  };

  // select an existing conversation and auto-start timer (continue)
  const select = async (id: string) => {
    setActive(id);
    await load(id);
    // auto-start timer for continuing the session
    startTimerWithCurrentDuration();
  };

  // create new category/session and auto-start timer
  const newCategory = async (cat: string) => {
    const s = await startSession(cat);
    setActive(s.session_id);
    await load(s.session_id);
    setConvs(await listChats());
    // append listener-specific system welcome for the newly created chat
    const meta = LISTENER_META[cat] ?? LISTENER_META.general;
    appendSystem(meta.welcome);
    // auto-start timer for newly created session
    startTimerWithCurrentDuration();
  };

  // keep remaining in sync whenever duration changes and timer not running
  useEffect(() => {
    if (!running) {
      setRemaining(totalSeconds);
    }
  }, [totalSeconds, running]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // start timer using currently selected totalSeconds (used on select/new)
  const startTimerWithCurrentDuration = () => {
    // ensure we use the chosen duration
    setRemaining(totalSeconds);
    // clear any old timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // start ticking
    timerRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          // stop timer
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setRunning(false);
          setExpiredModalOpen(true); // show modal to ask continue or start new
          appendSystem("Time's up — session ended.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setRunning(true);
    appendSystem("Timer started.");
  };

  // manual "continue" from modal: restart same chat using a chosen duration
  const continueSameChat = (secs: number) => {
    setTotalSeconds(secs);
    setRemaining(secs);
    setExpiredModalOpen(false);
    // restart timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setRunning(false);
          setExpiredModalOpen(true);
          appendSystem("Time's up — session ended.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setRunning(true);
    appendSystem("Session continued.");
  };

  // "start new chat" from modal: pick a category, create new session and auto-start
  const startNewChatFromModal = async (cat: string, secs: number) => {
    setExpiredModalOpen(false);
    setTotalSeconds(secs);
    // create new session and auto-start inside newCategory
    await newCategory(cat);
  };

  const formatTime = (s: number) => {
    const sec = Math.max(0, Math.floor(s));
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const ss = String(sec % 60).padStart(2, "0");
    return `${m}:${ss}`;
  };

  // --- Message send logic ---
  const onSend = async (text: string) => {
    // Prevent sends if pending OR timer has expired OR timer not running
    if (!active || !text.trim() || pending) return;
    if (!running || remaining <= 0) {
      appendSystem("Cannot send message — session is not active.");
      return;
    }
    setPending(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    let idx: number = -1;
    setMessages((prev) => {
      idx = prev.length;
      return [...prev, { role: "assistant", content: "" }];
    });
    try {
      await streamMessage(active, text, {
        onToken: (tok) => {
          setMessages((prev) => {
            const next = [...prev];
            next[idx] = { ...next[idx], content: next[idx].content + tok };
            return next;
          });
        },
      });
    } finally {
      setPending(false);
      setConvs(await listChats());
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // -------------------------
  // UI pieces
  // -------------------------
  const left = (
    <div
      className={[
        // base spacing/width
        "w-full md:w-auto p-4 md:p-0",
        // mobile: off-canvas drawer
        sidebarOpen
          ? "fixed inset-y-0 left-0 z-30 w-72 bg-gradient-main backdrop-blur-xl"
          : "hidden",
        // desktop: normal static column
        "md:block md:relative md:z-auto md:bg-transparent md:backdrop-blur-0",
      ].join(" ")}
    >
      <div className="md:hidden flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-text">Therapy Bro</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-2 hover:bg-card-hover rounded-xl transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">

        {/* Conversations */}
        <div className="glass-card rounded-2xl p-4 min-h-0">
          <div className="mb-3 text-sm font-medium text-text-muted flex items-center gap-2 justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>Your Conversations</span>
            </div>

            {/* collapse toggle */}
            <button
              onClick={() => setConvsOpen((s) => !s)}
              aria-expanded={convsOpen}
              className="text-xs text-text-dim hover:text-text transition-colors px-2 py-1 rounded"
              title={convsOpen ? "Collapse conversations" : "Expand conversations"}
            >
              {convsOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Scrollable conversations container — collapsible */}
          <div
            className={[
              "space-y-2 pr-2 -mr-2 min-h-0",
              convsOpen ? "max-h-80 overflow-y-auto" : "max-h-0 overflow-hidden",
              "transition-[max-height] duration-300 ease-in-out",
            ].join(" ")}
          >
            {convs.length === 0 ? (
              <div className="text-xs text-text-dim py-8 text-center">
                No conversations yet.
                <br />
              </div>
            ) : (
              convs.map((c) => (
                <button
                  key={c.session_id}
                  onClick={() => {
                    select(c.session_id);
                    setSidebarOpen(false);
                  }}
                  className={`block w-full rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 ${
                    active === c.session_id
                      ? "bg-gradient-accent text-white shadow-md"
                      : "glass-card hover:bg-card-hover text-text-muted hover:text-text"
                  }`}
                >
                  <div className="font-medium">{c.category}</div>
                  <div className="text-xs opacity-80 mt-1 truncate">
                    {new Date(c.updated_at).toLocaleDateString()} at{" "}
                    {new Date(c.updated_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const main = (
    <div className="min-w-0 space-y-4 md:space-y-6">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between mb-2 glass-card rounded-2xl p-3">
        <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-card-hover rounded-xl transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{activeCategory ?? "Assistant"}</div>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-text-dim" />
          <div
            className={`text-sm font-mono ${
              remaining <= 30 && running ? "text-danger animate-pulse-soft" : "text-text-muted"
            }`}
          >
            {formatTime(remaining)}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:block glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-lg text-text">{activeCategory ?? "Assistant"}</div>
              <div className="text-sm text-text-muted">{activeWelcome}</div>
            </div>
          </div>

          {/* Timer UI */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-text-muted flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Time Remaining
            </div>
            <div
              className={`px-4 py-2 rounded-xl font-mono text-sm font-semibold border ${
                remaining <= 30 && running
                  ? "bg-danger/10 border-danger/20 text-danger animate-pulse-soft"
                  : "glass-card border-border text-text"
              }`}
            >
              {formatTime(remaining)}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4 md:space-y-5 pb-28 min-h-[50vh]">
        {messages.filter((m) => m.role !== "system").length === 0 ? (
          <div className="flex items-center justify-center h-40 text-center">
            <div className="glass-card rounded-2xl p-8 max-w-md">
              <Brain className="w-12 h-12 mx-auto mb-4 text-text-dim" />
              <p className="text-text-muted mb-2">No messages yet</p>
              <p className="text-sm text-text-dim">
                {activeCategory ? `Start chatting with ${activeCategory}` : "Pick a listener to begin"}
              </p>
            </div>
          </div>
        ) : (
          messages
            .filter((m) => m.role !== "system")
            .map((m, i) => <ChatMessage key={i} role={m.role as "user" | "assistant"} content={m.content} />)
        )}
        <div ref={endRef} />
      </div>

      {/* Fixed Input */}
      <div className="sticky bottom-0 z-10 border-t border-border bg-bg/95 supports-[backdrop-filter]:bg-bg/60 backdrop-blur">
        <div className="mx-auto w-full px-4 md:px-6 py-4 md:pr-8">
          <ChatInput
            disabled={pending || remaining <= 0 || !running}
            placeholder={!running ? "Start or continue a chat to send messages" : remaining <= 0 ? "Session ended. Continue or start a new chat." : "Share what's on your mind..."}
            onSend={onSend}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Page container */}
      <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
        <div className="grid grid-cols-1 md:grid-cols-[22rem_1fr] gap-4 md:gap-6">
          {left}
          {main}
        </div>
      </div>

      {/* Expired modal */}
      {expiredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Session ended</h3>
            <p className="text-sm text-gray-700">
              Your chat session has ended. Would you like to continue?
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Choose duration</label>
              <select
                defaultValue={String(totalSeconds)}
                onChange={(e) => setTotalSeconds(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => continueSameChat(totalSeconds)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
              >
                Continue same chat
              </button>

              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    title={LISTENER_META[cat]?.description}
                    onClick={() => startNewChatFromModal(cat, totalSeconds)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-gray-600 text-sm hover:bg-gray-100"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setExpiredModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
