"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { listChats, startSession, getHistory, streamMessage, deleteSession } from "@/lib/api";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import { useRouter, useSearchParams } from "next/navigation";
import { LISTENER_META } from "@/lib/listeners";
import { Menu, X, Clock, MessageCircle, Brain, Calendar, Trash2 } from "lucide-react";

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
  const searchParams = useSearchParams();

  // Add ref to track if we've already processed search params
  const processedSearchParams = useRef<string>('');
  const isProcessing = useRef<boolean>(false);

  // Add flag to prevent duplicate session creation
  const [isInitialized, setIsInitialized] = useState(false);

  // ----- Timer state -----
  const [totalSeconds, setTotalSeconds] = useState<number>(300); // default 5 min
  const [remaining, setRemaining] = useState<number>(300);
  const [running, setRunning] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);
  
  // Add ref to track timer state more reliably
  const isTimerRunning = useRef<boolean>(false);

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

  // Add state for confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, sessionId: string | null}>({
    show: false,
    sessionId: null
  });

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

  // Single effect to handle everything
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Get current search params
        const sessionParam = searchParams.get('session');
        const newSessionParam = searchParams.get('new');
        const currentSearchParams = `${sessionParam || ''}-${newSessionParam || ''}`;
        
        console.log('Chat page effect running with:', { 
          sessionParam, 
          newSessionParam, 
          currentSearchParams, 
          processedSearchParams: processedSearchParams.current, 
          convsLength: convs.length,
          isProcessing: isProcessing.current
        });
        
        // Skip if we're already processing or have already processed these search params
        if (isProcessing.current || processedSearchParams.current === currentSearchParams) {
          console.log('Skipping duplicate processing');
          return;
        }
        
        isProcessing.current = true;
        processedSearchParams.current = currentSearchParams;

        const list = await listChats();
        setConvs(list);
        
        // Handle specific session from URL
        if (sessionParam) {
          console.log('Processing sessionParam:', sessionParam);
          const sessionExists = list.find((c: Conv) => c.session_id === sessionParam);
          if (sessionExists) {
            console.log('Session exists, selecting it');
            await select(sessionParam);
            // Restore timer state after selecting session
            restoreTimerState();
            isProcessing.current = false;
            return;
          } else {
            console.log('Session not found in list');
          }
        }
        
        // Handle new session request from URL
        if (newSessionParam) {
          console.log('Processing newSessionParam:', newSessionParam);
          const today = new Date().toISOString().split('T')[0];
          const todaySession = list.find((c: Conv) => c.updated_at.startsWith(today));
          
          if (todaySession) {
            // If there's already a session for today, continue it
            console.log('Found today session, selecting it instead of creating new');
            await select(todaySession.session_id);
            // Restore timer state after selecting session
            restoreTimerState();
            isProcessing.current = false;
            return;
          } else {
            // Create a new session
            console.log('No today session, creating new one');
            await newCategory(newSessionParam);
            isProcessing.current = false;
            return;
          }
        }
        
        // Default behavior when no specific params
        if (list.length) {
          const today = new Date().toISOString().split('T')[0];
          const todaySession = list.find((c: Conv) => c.updated_at.startsWith(today));
          
          if (todaySession) {
            await select(todaySession.session_id);
            // Only start timer if no timer is running
            if (!running) {
              startTimerWithCurrentDuration();
            }
          } else {
            await select(list[0].session_id);
            // Only start timer if no timer is running
            if (!running) {
              startTimerWithCurrentDuration();
            }
          }
        } else {
          // create a default session and start it
          const s = await startSession("TherapyBro");
          setActive(s.session_id);
          await load(s.session_id);
          setConvs(await listChats());
          // Always start timer for the very first session
          startTimerWithCurrentDuration();
          appendSystem(LISTENER_META.TherapyBro.welcome);
        }
        
        isProcessing.current = false;
      } catch {
        isProcessing.current = false;
        router.push("/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
      const meta = LISTENER_META[cat] ?? LISTENER_META.TherapyBro;
      appendSystem(meta.welcome);
    }
  };

  // Helper function to check if timer is actually running
  const isTimerActuallyRunning = () => {
    return timerRef.current !== null && running;
  };

  // select an existing conversation and auto-start timer (continue)
  const select = async (id: string) => {
    console.log('select called with:', {
      id,
      running,
      timerRef: timerRef.current,
      active,
      remaining
    });
    
    setActive(id);
    await load(id);
    
    // NEVER start a timer in select - only switch sessions
    console.log('Switching to session, timer continues if running');
    if (running) {
      appendSystem("Switched to previous chat. Timer continues.");
    }
  };

  // create new category/session and auto-start timer
  const newCategory = async (cat: string) => {
    console.log('newCategory called with:', {
      cat,
      running,
      timerRef: timerRef.current,
      active,
      remaining
    });
    
    const s = await startSession(cat);
    setActive(s.session_id);
    await load(s.session_id);
    
    // Update conversations list after creating new session
    const updatedList = await listChats();
    setConvs(updatedList);
    
    // append listener-specific system welcome for the newly created chat
    const meta = LISTENER_META[cat] ?? LISTENER_META.TherapyBro;
    appendSystem(meta.welcome);
    
    // NEVER start a timer in newCategory - only switch sessions
    console.log('Switching to new session, timer continues if running');
    if (running) {
      appendSystem("Switched to new chat. Timer continues.");
    }
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
    console.log('startTimerWithCurrentDuration called, current timer state:', {
      running,
      isTimerRunning: isTimerRunning.current,
      timerRef: timerRef.current,
      remaining
    });
    
    // ensure we use the chosen duration
    setRemaining(totalSeconds);
    // clear any old timer
    if (timerRef.current) {
      console.log('Clearing existing timer');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Save timer state to localStorage
    const timerState = {
      remaining: totalSeconds,
      running: true,
      startTime: Date.now(),
      totalSeconds: totalSeconds
    };
    localStorage.setItem('therapyTimer', JSON.stringify(timerState));
    
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
          isTimerRunning.current = false;
          localStorage.removeItem('therapyTimer');
          setExpiredModalOpen(true); // show modal to ask continue or start new
          appendSystem("Time's up — session ended.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setRunning(true);
    isTimerRunning.current = true;
    console.log('Timer started successfully');
    appendSystem("Timer started.");
  };

  // Restore timer state from localStorage
  const restoreTimerState = () => {
    const savedTimer = localStorage.getItem('therapyTimer');
    if (savedTimer) {
      try {
        const timerState = JSON.parse(savedTimer);
        const now = Date.now();
        const elapsed = Math.floor((now - timerState.startTime) / 1000);
        const newRemaining = Math.max(0, timerState.remaining - elapsed);
        
        if (newRemaining > 0) {
          console.log('Restoring timer state:', { timerState, elapsed, newRemaining });
          setRemaining(newRemaining);
          setRunning(true);
          isTimerRunning.current = true;
          
          // Start the timer with the remaining time
          timerRef.current = window.setInterval(() => {
            setRemaining((prev) => {
              if (prev <= 1) {
                // stop timer
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
                setRunning(false);
                isTimerRunning.current = false;
                localStorage.removeItem('therapyTimer');
                setExpiredModalOpen(true);
                appendSystem("Time's up — session ended.");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          appendSystem("Timer restored and continuing.");
        } else {
          // Timer expired while away
          localStorage.removeItem('therapyTimer');
          setExpiredModalOpen(true);
          appendSystem("Session expired while away.");
        }
      } catch (error) {
        console.error('Error restoring timer state:', error);
        localStorage.removeItem('therapyTimer');
      }
    }
  };

  // Update timer state in localStorage every second
  useEffect(() => {
    if (running && timerRef.current) {
      const interval = setInterval(() => {
        const timerState = {
          remaining: remaining,
          running: true,
          startTime: Date.now() - (totalSeconds - remaining) * 1000,
          totalSeconds: totalSeconds
        };
        localStorage.setItem('therapyTimer', JSON.stringify(timerState));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [running, remaining, totalSeconds]);

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
          isTimerRunning.current = false;
          setExpiredModalOpen(true);
          appendSystem("Time's up — session ended.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setRunning(true);
    isTimerRunning.current = true;
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

  const deleteChat = async (sessionId: string) => {
    console.log('Attempting to delete session:', sessionId);
    
    // Show confirmation modal instead of browser confirm
    setDeleteConfirm({ show: true, sessionId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.sessionId) return;
    
    const sessionId = deleteConfirm.sessionId;
    setDeleteConfirm({ show: false, sessionId: null });
    
    try {
      console.log('Calling deleteSession API...');
      const result = await deleteSession(sessionId);
      console.log('Delete API result:', result);
      
      console.log('Delete successful, refreshing conversations...');
      
      // Refresh the conversations list
      const list = await listChats();
      console.log('Updated conversations:', list);
      setConvs(list);
      
      // If we deleted the active session, clear it
      if (active === sessionId) {
        setActive(null);
        setMessages([]);
        setRunning(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      
      console.log('Delete completed successfully');
    } catch (error) {
      console.error('Failed to delete chat:', error);
      console.error('Error details:', error);
      alert(`Failed to delete chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, sessionId: null });
  };

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

        {/* Calendar Button */}
        <div className="glass-card rounded-2xl p-4">
          <button
            onClick={() => router.push('/calendar')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl glass-card hover:bg-card-hover transition-colors text-text-muted hover:text-text"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">View Calendar</span>
          </button>
        </div>

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
                <div
                  key={c.session_id}
                  className={`block w-full rounded-xl px-3 py-3 text-left text-sm transition-all duration-200 relative ${
                    active === c.session_id
                      ? "bg-gradient-accent text-white shadow-md"
                      : "glass-card hover:bg-card-hover text-text-muted hover:text-text"
                  }`}
                >
                  <button
                    onClick={() => {
                      select(c.session_id);
                      setSidebarOpen(false);
                    }}
                    className="w-full text-left"
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
                  
                  {/* Delete button - show for all chats */}
                  {(() => {
                    return (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(c.session_id);
                        }}
                        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </button>
                    );
                  })()}
                </div>
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
                className="w-full rounded-md border border-border bg-bg text-text px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed"
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
                Continue chat
              </button>

              <button
                onClick={() => setExpiredModalOpen(false)}
                className="rounded-lg border border-border bg-bg text-text px-4 py-2 text-sm hover:bg-card-hover"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Delete Chat</h3>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white font-medium hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 text-sm hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}