'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNav from '@/components/TopNav'

export default function RelationshipsArticle() {
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
        <div className="bg-gradient-to-br from-rose-400 to-red-400 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium">Back to Resources</span>
            </Link>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <span className="text-white text-sm font-semibold uppercase tracking-wide">Relationships</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Building Healthy Relationships: Connection & Communication
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="text-sm">10 min read</span>
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
                Healthy relationships—whether romantic, familial, or platonic—are built on a foundation of trust, respect, and open communication. They enrich our lives, provide support during difficult times, and contribute significantly to our overall well-being.
              </p>
              <p className="text-text-muted text-lg leading-relaxed">
                In this article, we'll explore the essential elements of nurturing meaningful connections and maintaining healthy boundaries.
              </p>
            </div>

            {/* Section 1 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-500">favorite</span>
                The Pillars of Healthy Relationships
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">🤝</span>
                    Trust and Honesty
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Trust is earned through consistent honesty and reliability. Be transparent about your feelings, keep your promises, and admit when you're wrong. Trust takes time to build but can be broken in an instant.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">🗣️</span>
                    Open Communication
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Express your thoughts, feelings, and needs clearly. Use "I" statements instead of "you" accusations: "I feel hurt when..." rather than "You always...". Create a safe space where both parties can speak without fear of judgment.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Healthy Boundaries
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Boundaries protect your emotional and physical well-being. It's okay to say no, take time for yourself, and maintain your individuality. Respect others' boundaries as you would want yours respected.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">💝</span>
                    Empathy and Support
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Try to understand things from the other person's perspective. Validate their feelings even when you disagree. Be present during difficult times and celebrate their successes.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">forum</span>
                Navigating Conflict Constructively
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Conflict is inevitable in any relationship. The goal isn't to avoid conflict but to handle it in a way that strengthens the relationship rather than damaging it.
              </p>
              <div className="bg-rose-50 rounded-xl p-6 mb-4">
                <h3 className="text-lg font-semibold text-text mb-3">The PAUSE Method</h3>
                <ul className="space-y-3 text-text-muted">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-rose-500 mt-1">P</span>
                    <div>
                      <strong>Pause:</strong> Take a moment to calm down before responding
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-rose-500 mt-1">A</span>
                    <div>
                      <strong>Acknowledge:</strong> Recognize the other person's feelings and perspective
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-rose-500 mt-1">U</span>
                    <div>
                      <strong>Understand:</strong> Ask questions to clarify their point of view
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-rose-500 mt-1">S</span>
                    <div>
                      <strong>Share:</strong> Express your own feelings calmly and respectfully
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-rose-500 mt-1">E</span>
                    <div>
                      <strong>Explore:</strong> Work together to find a solution that respects both parties
                    </div>
                  </li>
                </ul>
              </div>
              <p className="text-text-muted leading-relaxed">
                Remember: the goal of conflict resolution is not to "win" but to understand each other better and find common ground.
              </p>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-500">warning</span>
                Red Flags to Watch For
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                While all relationships have challenges, some behaviors are concerning and may indicate an unhealthy dynamic:
              </p>
              <ul className="space-y-2 text-text-muted mb-4">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">flag</span>
                  <span><strong>Controlling behavior:</strong> Monitoring your activities, isolating you from friends/family</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">flag</span>
                  <span><strong>Disrespect:</strong> Name-calling, belittling, or dismissing your feelings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">flag</span>
                  <span><strong>Lack of accountability:</strong> Never apologizing or always blaming you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">flag</span>
                  <span><strong>Emotional manipulation:</strong> Guilt-tripping, gaslighting, or playing the victim</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">flag</span>
                  <span><strong>Boundary violations:</strong> Ignoring your "no" or pressuring you</span>
                </li>
              </ul>
              <p className="text-text-muted leading-relaxed">
                If you recognize these patterns, consider talking to a trusted friend, family member, or professional counselor. You deserve relationships that uplift and support you.
              </p>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">self_improvement</span>
                Practical Tips for Daily Connection
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-rose-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2">💬 Daily Check-Ins</h4>
                  <p className="text-text-muted text-sm">Ask "How was your day?" and really listen to the answer</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2">🎁 Small Gestures</h4>
                  <p className="text-text-muted text-sm">Leave notes, surprise with their favorite snack, or offer help</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2">📱 Put Phones Away</h4>
                  <p className="text-text-muted text-sm">Give undivided attention during conversations</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2">🙏 Express Gratitude</h4>
                  <p className="text-text-muted text-sm">Say "thank you" for the little things they do</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2">🎉 Celebrate Together</h4>
                  <p className="text-text-muted text-sm">Acknowledge achievements, big and small</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2">🤗 Physical Touch</h4>
                  <p className="text-text-muted text-sm">Hugs, hand-holding, or a pat on the back (when appropriate)</p>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border border-rose-200 p-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-rose-500">lightbulb</span>
                Key Takeaways
              </h2>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-rose-500 mt-1">check_circle</span>
                  <span>Healthy relationships require trust, communication, boundaries, and empathy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-rose-500 mt-1">check_circle</span>
                  <span>Conflict is normal—handle it constructively using methods like PAUSE</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-rose-500 mt-1">check_circle</span>
                  <span>Watch for red flags and prioritize your emotional well-being</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-rose-500 mt-1">check_circle</span>
                  <span>Small daily gestures strengthen connections over time</span>
                </li>
              </ul>
            </div>
          </article>

          {/* CTA */}
          <div className="mt-12 bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <h3 className="text-2xl font-bold text-text mb-3">Need Relationship Support?</h3>
            <p className="text-text-muted mb-6">
              Talk through relationship challenges with our AI therapist or a trained peer listener.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat?new=TherapyBro"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-rose-400 to-red-400 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
