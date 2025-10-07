'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { listChats, deleteSession } from '@/lib/api'
import Calendar from '@/components/Calendar'
import { MessageCircle, Calendar as CalendarIcon, LogOut } from 'lucide-react'

type Conv = {
  session_id: string;
  category: string;
  updated_at: string;
  notes?: string;
};

export default function CalendarPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Add state for confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, sessionId: string | null}>({
    show: false,
    sessionId: null
  });

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
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const handleDateClick = (date: Date) => {
    // Find chats for the selected date
    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const target = formatLocalDate(date);
    const chatsForDate = convs.filter(conv => {
      const chatLocal = formatLocalDate(new Date(conv.updated_at));
      return chatLocal === target;
    });
    
    if (chatsForDate.length > 0) {
      // Navigate to chat page with the most recent chat for that date
      const mostRecent = chatsForDate.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];
      router.push(`/chat?session=${mostRecent.session_id}`);
    }
  };

  const handleDeleteChat = async (sessionId: string) => {
    console.log('Calendar: Attempting to delete session:', sessionId);
    
    // Show confirmation modal instead of browser confirm
    setDeleteConfirm({ show: true, sessionId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.sessionId) return;
    
    const sessionId = deleteConfirm.sessionId;
    setDeleteConfirm({ show: false, sessionId: null });
    
    try {
      console.log('Calendar: Calling deleteSession API...');
      const result = await deleteSession(sessionId);
      console.log('Calendar: Delete API result:', result);
      
      console.log('Calendar: Delete successful, refreshing conversations...');
      
      // Refresh the conversations list
      const list = await listChats();
      console.log('Calendar: Updated conversations:', list);
      setConvs(list);
      
      console.log('Calendar: Delete completed successfully');
    } catch (error) {
      console.error('Calendar: Failed to delete chat:', error);
      console.error('Calendar: Error details:', error);
      alert(`Failed to delete chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, sessionId: null });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-muted">Loading your chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-accent rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-text">Progress Tracker</h1>
                <p className="text-sm text-text-muted">View your therapy sessions chronologically</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/chat?new=TherapyBro')}
                className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl hover:bg-card-hover transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Start New Chat</span>
              </button>
              
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 glass-card rounded-xl hover:bg-card-hover transition-colors text-text-muted"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <Calendar 
          chats={convs} 
          onDateClick={handleDateClick}
          onDeleteChat={handleDeleteChat}
        />
      </div>

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