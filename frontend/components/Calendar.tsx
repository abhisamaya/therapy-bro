'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, MessageCircle, Trash2, Star } from 'lucide-react'

type Conv = {
  session_id: string;
  category: string;
  updated_at: string;
  notes?: string;
};

type CalendarProps = {
  chats: Conv[];
  onDateClick: (date: Date) => void;
  onDeleteChat?: (sessionId: string) => void;
};

export default function Calendar({ chats, onDeleteChat, onDateClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Format a Date object as local YYYY-MM-DD (no timezone shifts like toISOString)
  const formatLocalDate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { firstDay, lastDay, daysInMonth, startingDayOfWeek };
  };

  const getChatsForDate = (date: Date) => {
    const target = formatLocalDate(date);
    return chats.filter(chat => {
      const chatLocal = formatLocalDate(new Date(chat.updated_at));
      return chatLocal === target;
    });
  };

  const hasCompletedSession = (date: Date) => {
    const chatsForDate = getChatsForDate(date);
    return chatsForDate.length > 0;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-24"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const chatsForDay = getChatsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const hasCompleted = hasCompletedSession(date);
      
      days.push(
        <div
          key={day}
          className={`
            h-24 p-2 border border-border glass-card rounded-lg cursor-pointer
            hover:bg-card-hover transition-colors relative
            ${isToday ? 'ring-2 ring-accent' : ''}
            ${chatsForDay.length > 0 ? 'bg-accent/10' : ''}
          `}
          onClick={() => onDateClick(date)}
        >
          <div className={`text-sm font-medium ${isToday ? 'text-accent' : 'text-text'}`}>
            {day}
          </div>
          
          {/* Star for completed sessions */}
          {hasCompleted && (
            <div className="absolute top-1 right-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            </div>
          )}
          
          {chatsForDay.length > 0 && (
            <div className="mt-1 space-y-1">
              {chatsForDay.slice(0, 2).map((chat, index) => (
                <div
                  key={chat.session_id}
                  className="flex items-center gap-1 text-xs bg-white/20 rounded px-1 py-0.5 group"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span className="truncate flex-1">{chat.category}</span>
                  {/* Delete button for all chats */}
                  {onDeleteChat && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChat(chat.session_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded"
                      title="Delete chat"
                    >
                      <Trash2 className="w-2 h-2 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              {chatsForDay.length > 2 && (
                <div className="text-xs text-text-muted">
                  +{chatsForDay.length - 2} more
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  // Calculate analytics
  const totalSessions = chats.length;
  const currentStreak = calculateCurrentStreak(chats);
  const longestStreak = calculateLongestStreak(chats);
  const thisMonthSessions = chats.filter(chat => {
    const chatDate = new Date(chat.updated_at);
    return chatDate.getMonth() === currentDate.getMonth() && 
           chatDate.getFullYear() === currentDate.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{totalSessions}</div>
          <div className="text-xs text-text-muted">Total Sessions</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{currentStreak}</div>
          <div className="text-xs text-text-muted">Current Streak</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{longestStreak}</div>
          <div className="text-xs text-text-muted">Longest Streak</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">{thisMonthSessions}</div>
          <div className="text-xs text-text-muted">This Month</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="glass-card rounded-2xl p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 glass-card rounded-lg hover:bg-card-hover transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 glass-card rounded-lg hover:bg-card-hover transition-colors text-sm"
            >
              Today
            </button>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 glass-card rounded-lg hover:bg-card-hover transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-sm font-medium text-text-muted py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {renderCalendarDays()}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent/10 rounded"></div>
              <span>Days with chats</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 ring-2 ring-accent rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span>Completed session</span>
            </div>
            {onDeleteChat && (
              <div className="flex items-center gap-2">
                <Trash2 className="w-3 h-3 text-red-500" />
                <span>Hover to delete chats</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions for analytics
function calculateCurrentStreak(chats: Conv[]): number {
  if (chats.length === 0) return 0;
  
  const sortedChats = chats.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (const chat of sortedChats) {
    const chatDate = new Date(chat.updated_at);
    chatDate.setHours(0, 0, 0, 0);
    
    if (chatDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (chatDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
}

function calculateLongestStreak(chats: Conv[]): number {
  if (chats.length === 0) return 0;
  
  const sortedChats = chats.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
  let longestStreak = 0;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedChats.length; i++) {
    const prevDate = new Date(sortedChats[i - 1].updated_at);
    const currentDate = new Date(sortedChats[i].updated_at);
    
    prevDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (dayDiff === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  
  return Math.max(longestStreak, currentStreak);
}