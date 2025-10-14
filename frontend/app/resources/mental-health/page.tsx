'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNav from '@/components/TopNav'

export default function MentalHealthArticle() {
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
        <div className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium">Back to Resources</span>
            </Link>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <span className="text-white text-sm font-semibold uppercase tracking-wide">Mental Health</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Understanding Mental Health: A Holistic Approach
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="text-sm">8 min read</span>
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
                Mental health is not just the absence of mental illness—it's a state of well-being where you can cope with life's stresses, work productively, and contribute to your community. Understanding mental health holistically means recognizing the interconnection between your mind, body, emotions, and environment.
              </p>
              <p className="text-text-muted text-lg leading-relaxed">
                In this article, we'll explore practical ways to nurture your mental wellness and build resilience in everyday life.
              </p>
            </div>

            {/* Section 1 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-500">spa</span>
                What Is Mental Wellness?
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Mental wellness encompasses emotional, psychological, and social well-being. It affects how we think, feel, and act. It also determines how we handle stress, relate to others, and make healthy choices.
              </p>
              <p className="text-text-muted leading-relaxed mb-4">
                Key components of mental wellness include:
              </p>
              <ul className="space-y-2 text-text-muted mb-4">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Emotional awareness:</strong> Recognizing and understanding your feelings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Resilience:</strong> Bouncing back from setbacks and adapting to change</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Healthy relationships:</strong> Building meaningful connections with others</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">check_circle</span>
                  <span><strong>Purpose and meaning:</strong> Finding fulfillment in daily activities</span>
                </li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-pink-500">self_improvement</span>
                Daily Practices for Mental Well-Being
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2">1. Mindfulness and Meditation</h3>
                  <p className="text-text-muted leading-relaxed">
                    Start with just 5 minutes a day. Sit quietly, focus on your breath, and observe your thoughts without judgment. Apps like Headspace or Calm can guide you through the process.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2">2. Physical Activity</h3>
                  <p className="text-text-muted leading-relaxed">
                    Exercise releases endorphins, natural mood elevators. You don't need to run marathons—a 20-minute walk, yoga session, or dance break can make a significant difference.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2">3. Quality Sleep</h3>
                  <p className="text-text-muted leading-relaxed">
                    Aim for 7-9 hours of sleep. Create a bedtime routine: dim lights, avoid screens an hour before bed, and keep your bedroom cool and comfortable.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2">4. Nutrition</h3>
                  <p className="text-text-muted leading-relaxed">
                    What you eat affects your mood and energy. Focus on whole foods, stay hydrated, and limit caffeine and sugar, which can cause energy crashes.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-500">psychology</span>
                Recognizing When You Need Support
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                It's important to recognize when you might benefit from professional support. Consider reaching out if you experience:
              </p>
              <ul className="space-y-2 text-text-muted mb-4">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">warning</span>
                  <span>Persistent sadness or hopelessness lasting more than two weeks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">warning</span>
                  <span>Difficulty concentrating or making decisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">warning</span>
                  <span>Changes in sleep or appetite</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">warning</span>
                  <span>Loss of interest in activities you once enjoyed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-warning mt-1 text-sm">warning</span>
                  <span>Thoughts of self-harm or suicide</span>
                </li>
              </ul>
              <p className="text-text-muted leading-relaxed">
                Remember: Seeking help is a sign of strength, not weakness. TherapyBro is here to support you with AI-guided conversations or connections to trained peer listeners.
              </p>
            </div>

            {/* Key Takeaways */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-500">lightbulb</span>
                Key Takeaways
              </h2>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-purple-500 mt-1">check_circle</span>
                  <span>Mental health is a holistic concept involving mind, body, and social connections</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-purple-500 mt-1">check_circle</span>
                  <span>Small daily practices like mindfulness, exercise, and good sleep make a big difference</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-purple-500 mt-1">check_circle</span>
                  <span>It's okay to ask for help—professional support can be transformative</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-purple-500 mt-1">check_circle</span>
                  <span>Mental wellness is an ongoing journey, not a destination</span>
                </li>
              </ul>
            </div>
          </article>

          {/* CTA */}
          <div className="mt-12 bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <h3 className="text-2xl font-bold text-text mb-3">Need to Talk?</h3>
            <p className="text-text-muted mb-6">
              Our AI therapist and trained peer listeners are here to support you on your mental wellness journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat?new=TherapyBro"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-400 to-pink-400 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
