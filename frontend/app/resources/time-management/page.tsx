'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNav from '@/components/TopNav'

export default function TimeManagementArticle() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  return (
    <div className="bg-bg min-h-screen">
      <TopNav />
      <div className="relative flex h-auto min-h-screen w-full flex-col">
        {/* Header */}
        <div className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium">Back to Resources</span>
            </Link>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <span className="text-white text-sm font-semibold uppercase tracking-wide">Productivity</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Mastering Time Management: Productivity with Balance
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="text-sm">7 min read</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span className="text-sm">Updated Oct 2025</span>
              </span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <article className="prose prose-lg max-w-none">
            {/* Introduction */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <p className="text-text-muted text-lg leading-relaxed mb-4">
                Time management isn't about cramming more into your day—it's about making intentional choices about how you spend your hours. It's the art of balancing productivity with well-being, achievement with rest, and ambition with presence.
              </p>
              <p className="text-text-muted text-lg leading-relaxed">
                In this guide, we'll explore practical strategies to help you work smarter, not harder, while maintaining your mental and physical health.
              </p>
            </div>

            {/* Section 1 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500">target</span>
                Understanding Your Time
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Before you can manage your time effectively, you need to understand where it's currently going.
              </p>
              <div className="bg-blue-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-text mb-3">⏰ Time Audit Exercise</h3>
                <ol className="space-y-2 text-text-muted list-decimal list-inside">
                  <li>Track everything you do for 3 days in 30-minute blocks</li>
                  <li>Categorize activities (work, leisure, chores, social, rest)</li>
                  <li>Identify time drains (excessive social media, unproductive meetings)</li>
                  <li>Notice your peak energy hours—when are you most focused?</li>
                  <li>Recognize patterns and make informed decisions</li>
                </ol>
              </div>
              <p className="text-text-muted leading-relaxed">
                This awareness is the foundation of effective time management. You can't optimize what you don't measure.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-500">dashboard</span>
                The Eisenhower Matrix
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Prioritize tasks by urgency and importance. This helps you focus on what truly matters.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border-2 border-red-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-red-600">priority_high</span>
                    <h4 className="font-bold text-text">Urgent & Important</h4>
                  </div>
                  <p className="text-text-muted text-sm mb-2">Do these NOW</p>
                  <p className="text-text-muted text-sm">Crises, deadlines, emergencies</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-blue-600">star</span>
                    <h4 className="font-bold text-text">Not Urgent but Important</h4>
                  </div>
                  <p className="text-text-muted text-sm mb-2">Schedule these</p>
                  <p className="text-text-muted text-sm">Planning, learning, relationships, health</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-yellow-600">swap_horiz</span>
                    <h4 className="font-bold text-text">Urgent but Not Important</h4>
                  </div>
                  <p className="text-text-muted text-sm mb-2">Delegate if possible</p>
                  <p className="text-text-muted text-sm">Interruptions, some emails/calls</p>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border-2 border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-gray-600">block</span>
                    <h4 className="font-bold text-text">Neither Urgent nor Important</h4>
                  </div>
                  <p className="text-text-muted text-sm mb-2">Eliminate these</p>
                  <p className="text-text-muted text-sm">Time wasters, busywork, excessive scrolling</p>
                </div>
              </div>
              <p className="text-text-muted leading-relaxed">
                Most people spend too much time in quadrants 3 and 4. Shift your focus to quadrant 2—this is where growth happens.
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500">timer</span>
                Practical Time Management Techniques
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    🍅 The Pomodoro Technique
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Work in focused 25-minute intervals followed by 5-minute breaks. After 4 pomodoros, take a longer 15-30 minute break.
                  </p>
                  <p className="text-text-muted text-sm italic">
                    Perfect for: Deep work, studying, writing, coding
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    ⏰ Time Blocking
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Schedule specific blocks of time for different activities. Protect these blocks like you would a meeting with your boss.
                  </p>
                  <p className="text-text-muted text-sm italic">
                    Example: 9-11am Deep Work, 11-12pm Emails, 12-1pm Lunch, 1-3pm Meetings
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    🎯 The 2-Minute Rule
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    If a task takes less than 2 minutes, do it immediately. This prevents small tasks from piling up.
                  </p>
                  <p className="text-text-muted text-sm italic">
                    Great for: Replying to quick emails, filing documents, scheduling appointments
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    🐸 Eat the Frog
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Tackle your most challenging or dreaded task first thing in the morning when your willpower is highest.
                  </p>
                  <p className="text-text-muted text-sm italic">
                    "If it's your job to eat a frog, it's best to do it first thing in the morning" - Mark Twain
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-cyan-500">balance</span>
                Maintaining Work-Life Balance
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Productivity without balance leads to burnout. Here's how to stay productive while protecting your well-being:
              </p>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Set boundaries:</strong> Define work hours and stick to them. Don't check emails after 8pm</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Schedule breaks:</strong> Rest isn't laziness—it's essential for sustained performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Plan leisure time:</strong> Schedule fun activities with the same importance as work tasks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Learn to say no:</strong> Every "yes" to something is a "no" to something else</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Weekly review:</strong> Reflect on what worked and what didn't, then adjust</span>
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500">phone_iphone</span>
                Digital Distractions: Taking Control
              </h2>
              <div className="bg-blue-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-text mb-3">🚫 Taming the Notification Monster</h3>
                <ul className="space-y-2 text-text-muted list-disc list-inside">
                  <li>Turn off non-essential notifications</li>
                  <li>Use "Do Not Disturb" during focused work</li>
                  <li>Check social media at scheduled times only</li>
                  <li>Keep your phone out of sight during deep work</li>
                  <li>Use website blockers during work hours (Freedom, Cold Turkey)</li>
                </ul>
              </div>
              <p className="text-text-muted leading-relaxed">
                The average person checks their phone 96 times a day. Each interruption can take 23 minutes to fully recover from. Protect your attention like the valuable resource it is.
              </p>
            </div>

            {/* Key Takeaways */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-blue-500">lightbulb</span>
                Key Takeaways
              </h2>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-500 mt-1">check_circle</span>
                  <span>Track your time to understand where it's going before trying to optimize</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-500 mt-1">check_circle</span>
                  <span>Use the Eisenhower Matrix to prioritize what truly matters</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-500 mt-1">check_circle</span>
                  <span>Experiment with techniques like Pomodoro and time blocking to find what works for you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-500 mt-1">check_circle</span>
                  <span>Balance productivity with rest—burnout isn't a badge of honor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-500 mt-1">check_circle</span>
                  <span>Protect your attention from digital distractions</span>
                </li>
              </ul>
            </div>
          </article>

          {/* CTA */}
          <div className="mt-12 bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <h3 className="text-2xl font-bold text-text mb-3">Feeling Overwhelmed?</h3>
            <p className="text-text-muted mb-6">
              Talk through time management challenges and stress with our AI therapist or a peer listener.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat?new=TherapyBro"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-400 to-cyan-400 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <span>Start AI Chat</span>
                <span className="material-symbols-outlined">psychology</span>
              </Link>
              <Link
                href="/peers"
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-accent text-accent rounded-xl font-medium hover:bg-accent/5 transition-all"
              >
                <span>Find a Listening Bro</span>
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
