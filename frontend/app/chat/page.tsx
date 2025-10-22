"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { listChats, startSession, getHistory, streamMessage, deleteSession, extendSessionAPI, getWallet } from "@/lib/api";
import ChatInput from "@/components/ChatInput";
import ChatMessage from "@/components/ChatMessage";
import TopNav from "@/components/TopNav";
import { useRouter, useSearchParams } from "next/navigation";
import { LISTENER_META } from "@/lib/listeners";
import { Menu, X, Clock, MessageCircle, Brain, Calendar, Trash2 } from "lucide-react";

type Msg = { role: "user" | "assistant" | "system"; content: string };
type Conv = {
  session_id: string;
  category: string;
  updated_at: string;
  notes?: string;
  status: "active" | "ended";
  remaining_seconds: number;
};

function ChatPageInner() {
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

  // Server-side timer state
  const [serverTimerState, setServerTimerState] = useState<{
    status: "active" | "ended";
    remaining_seconds: number;
  } | null>(null);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [walletLoading, setWalletLoading] = useState(false);

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

  // Load wallet balance
  const loadWalletBalance = useCallback(async () => {
    try {
      setWalletLoading(true);
      const wallet = await getWallet();
      setWalletBalance(wallet.balance);
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  // Sync timer state with server
  const syncTimerWithServer = useCallback((conv: Conv) => {
    console.log('🔄 [SYNC] syncTimerWithServer called');
    console.log('🔄 [SYNC] Conv object:', JSON.stringify(conv, null, 2));
    console.log('🔄 [SYNC] status:', conv?.status);
    console.log('🔄 [SYNC] remaining_seconds:', conv?.remaining_seconds);
    console.log('🔄 [SYNC] Condition: status === "active"?', conv?.status === "active");
    console.log('🔄 [SYNC] Condition: remaining_seconds > 0?', conv?.remaining_seconds > 0);
    
    if (conv.status === "active" && conv.remaining_seconds > 0) {
      console.log('✅ [SYNC] SYNCING TIMER with', conv.remaining_seconds, 'seconds');
      setServerTimerState({
        status: conv.status,
        remaining_seconds: conv.remaining_seconds
      });
      setRemaining(conv.remaining_seconds);
      setRunning(true);
      
      // Start client-side countdown
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
    } else {
      setServerTimerState({
        status: conv.status,
        remaining_seconds: 0
      });
      setRemaining(0);
      setRunning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [appendSystem]);

  // Helper function to start timer from session response
  const startTimerFromSessionResponse = useCallback((sessionResponse: any) => {
    console.log('🔍 [TIMER] startTimerFromSessionResponse called');
    console.log('🔍 [TIMER] Full response:', JSON.stringify(sessionResponse, null, 2));
    console.log('🔍 [TIMER] status:', sessionResponse?.status);
    console.log('🔍 [TIMER] remaining_seconds:', sessionResponse?.remaining_seconds);
    console.log('🔍 [TIMER] Condition check: status === "active"?', sessionResponse?.status === "active");
    console.log('🔍 [TIMER] Condition check: remaining_seconds > 0?', sessionResponse?.remaining_seconds > 0);
    
    if (sessionResponse.status === "active" && sessionResponse.remaining_seconds > 0) {
      console.log('✅ [TIMER] STARTING TIMER with', sessionResponse.remaining_seconds, 'seconds');
      setRemaining(sessionResponse.remaining_seconds);
      setRunning(true);
      
      // Start client-side countdown
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
    }
  }, [appendSystem]);

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
        
        console.log('Effect running with:', { 
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
        
        // Load wallet balance
        await loadWalletBalance();
        
        // Handle specific session from URL
        if (sessionParam) {
          const sessionExists = list.find((c: Conv) => c.session_id === sessionParam);
          if (sessionExists) {
            await select(sessionParam);
            isProcessing.current = false;
            return;
          }
        }
        
        // Handle new session request from URL
        if (newSessionParam) {
          const today = new Date().toISOString().split('T')[0];
          const todaySession = list.find((c: Conv) => c.updated_at.startsWith(today));
          
          if (todaySession) {
            // If there's already a session for today, continue it
            await select(todaySession.session_id);
            isProcessing.current = false;
            return;
          } else {
            // Create a new session
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
          } else {
            await select(list[0].session_id);
          }
        } else {
          // create a default session and start it
          console.log('📝 [SESSION] Creating default session...');
          const s = await startSession("TherapyBro");
          console.log('📝 [SESSION] Session created, raw response:', s);
          console.log('📝 [SESSION] Session ID:', s?.session_id);
          console.log('📝 [SESSION] Has status:', 'status' in (s || {}));
          console.log('📝 [SESSION] Has remaining_seconds:', 'remaining_seconds' in (s || {}));
          setActive(s.session_id);
          await load(s.session_id);
          
          // Start timer from session response
          console.log('📝 [SESSION] Calling startTimerFromSessionResponse...');
          startTimerFromSessionResponse(s);
          
          // Update conversations list
          const updatedList = await listChats();
          setConvs(updatedList);
          
          appendSystem(LISTENER_META.TherapyBro.welcome);
        }
        
        isProcessing.current = false;
      } catch (error) {
        console.error('❌ [ERROR] Exception in useEffect:', error);
        console.error('❌ [ERROR] Error details:', error instanceof Error ? error.message : String(error));
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
    return h; // Return history with timer state
  };

  // select an existing conversation and sync timer with server state
  const select = async (id: string) => {
    setActive(id);
    const h = await load(id);

    // Compute UTC "today" using session_start_time from history (source of truth)
    const todayUTC = new Date().toISOString().slice(0, 10); // YYYY-MM-DD in UTC
    const startIso: string | null = h?.session_start_time ? String(h.session_start_time) : null;
    const isToday = startIso ? new Date(startIso).toISOString().slice(0, 10) === todayUTC : false;

    // If session ended and it started today (UTC), open expired modal to allow extension
    if (h?.status === "ended") {
      setRunning(false);
      setRemaining(0);
      if (isToday) {
        setExpiredModalOpen(true);
      }
      return;
    }

    // Start timer from history response (which includes timer state)
    console.log('🔄 [SELECT] Session history loaded:', h);
    console.log('🔄 [SELECT] Timer state - status:', h?.status, 'remaining_seconds:', h?.remaining_seconds);
    if (h && h.status && h.remaining_seconds !== undefined) {
      startTimerFromSessionResponse(h);
    } else {
      console.warn('⚠️ [SELECT] No timer state in history response');
    }
  };

  // create new category/session and sync timer with server state
  const newCategory = async (cat: string) => {
    console.log('Creating new category:', cat);
    const s = await startSession(cat);
    setActive(s.session_id);
    await load(s.session_id);
    
    // Start timer from session response
    startTimerFromSessionResponse(s);
    
    // Update conversations list after creating new session
    const updatedList = await listChats();
    setConvs(updatedList);
    
    // append listener-specific system welcome for the newly created chat
    const meta = LISTENER_META[cat] ?? LISTENER_META.TherapyBro;
    appendSystem(meta.welcome);
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

  // Extend session using server-side API
  const extendSessionHandler = async (durationSeconds: number) => {
    if (!active) return;
    
    try {
      setWalletLoading(true);
      const result = await extendSessionAPI(active, durationSeconds);
      
      // Update wallet balance
      setWalletBalance(result.wallet_balance);
      
      // Update timer state
      setRemaining(result.remaining_seconds);
      setRunning(true);
      
      // Start client-side countdown
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
      
      setExpiredModalOpen(false);
      appendSystem(`Session extended by ${Math.floor(durationSeconds / 60)} minutes.`);
      
      // Refresh conversations list
      const updatedList = await listChats();
      setConvs(updatedList);
      
    } catch (error) {
      console.error('Failed to extend session:', error);
      alert(`Failed to extend session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setWalletLoading(false);
    }
  };

  // "start new chat" from modal: pick a category, create new session
  const startNewChatFromModal = async (cat: string) => {
    setExpiredModalOpen(false);
    // create new session
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
      "w-full md:w-72 p-4 md:p-0",
      // mobile: off-canvas drawer
      sidebarOpen ? "fixed inset-y-0 left-0 z-30 w-72 bg-gradient-main backdrop-blur-xl" : "hidden",
      // desktop: sticky column (stays visually pinned as you scroll)
      "md:block md:relative md:z-auto md:bg-transparent md:backdrop-blur-0 md:sticky md:top-6 md:self-start",
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
            <span className="text-sm font-medium">View Progress</span>
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
    <div className="min-w-0 h-full flex flex-col space-y-4 md:space-y-6 overflow-hidden">
      {/* Mobile Session Header */}
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

      {/* Desktop Session Header */}
      <div className="hidden md:block glass-card rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-contain bg-center bg-no-repeat rounded-full"
            style={{ backgroundImage: 'url("/assets/icons/therapybro_logo.jpg")' }}
            >

            </div>
            <div>
              <div className="font-semibold text-lg text-text">{activeCategory ?? "TherapyBro"}</div>
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

      {/* Messages (only this scrolls) */}
      <div className="flex-1 overflow-y-auto space-y-4 md:space-y-5 pb-32">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-0 space-y-4 md:space-y-5">
          {messages.filter((m) => m.role !== "system").length === 0 ? (
            <div className="flex items-center justify-center h-40 text-center">
            </div>
          ) : (
            messages
              .filter((m) => m.role !== "system")
              .map((m, i) => <ChatMessage key={i} role={m.role as "user" | "assistant"} content={m.content} />)
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Fixed Input */}
      <div className="sticky bottom-0 z-10 supports-[backdrop-filter]:bg-transparent">
        <div className="mx-auto w-full px-0 md:px-0 py-4">
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
    <div className="h-screen overflow-hidden bg-bg flex flex-col">
      <TopNav />

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Page container */}
      <div className="mx-auto h-full max-w-7xl w-full px-4 md:px-6 xl:px-8 py-4 md:py-6 flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-1 md:grid-cols-[24rem_1fr] gap-6 xl:gap-8">
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

            {/* Wallet balance */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-600 mb-1">Wallet Balance</div>
              <div className="text-lg font-semibold text-gray-900">₹{walletBalance}</div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Choose duration</label>
              <select
                defaultValue={String(totalSeconds)}
                onChange={(e) => setTotalSeconds(Number(e.target.value))}
                className="w-full rounded-md border border-border bg-bg text-foreground
             px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring
             disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value={300}>5 minutes - ₹20</option>
                <option value={600}>10 minutes - ₹40</option>
                <option value={900}>15 minutes - ₹60</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => extendSessionHandler(totalSeconds)}
                disabled={walletLoading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {walletLoading ? "Processing..." : "Continue chat"}
              </button>

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

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg text-text flex items-center justify-center">Loading chat...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}