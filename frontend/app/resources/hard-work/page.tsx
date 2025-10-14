'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNav from '@/components/TopNav'

export default function HardWorkArticle() {
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
        <div className="bg-gradient-to-br from-amber-400 to-orange-400 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium">Back to Resources</span>
            </Link>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <span className="text-white text-sm font-semibold uppercase tracking-wide">Motivation</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              The Power of Consistency: Motivation & Growth Mindset
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="text-sm">9 min read</span>
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
                Success isn't about sporadic bursts of intense effort—it's about showing up consistently, even when you don't feel like it. The difference between dreamers and achievers isn't talent or luck; it's the daily commitment to small, incremental progress.
              </p>
              <p className="text-text-muted text-lg leading-relaxed">
                In this article, we'll explore how to cultivate a growth mindset, maintain motivation, and build the habits that lead to long-term success.
              </p>
            </div>

            {/* Section 1 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500">psychology_alt</span>
                Fixed vs. Growth Mindset
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Stanford psychologist Carol Dweck identified two fundamental mindsets that shape how we approach challenges:
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
                  <h3 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                    <span className="text-2xl">🚫</span>
                    Fixed Mindset
                  </h3>
                  <ul className="space-y-2 text-text-muted text-sm">
                    <li>• "I'm either good at it or I'm not"</li>
                    <li>• Avoids challenges</li>
                    <li>• Gives up easily</li>
                    <li>• Sees effort as fruitless</li>
                    <li>• Ignores feedback</li>
                    <li>• Feels threatened by others' success</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
                  <h3 className="text-lg font-bold text-text mb-3 flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    Growth Mindset
                  </h3>
                  <ul className="space-y-2 text-text-muted text-sm">
                    <li>• "I can learn and improve"</li>
                    <li>• Embraces challenges</li>
                    <li>• Persists through setbacks</li>
                    <li>• Sees effort as path to mastery</li>
                    <li>• Learns from criticism</li>
                    <li>• Gets inspired by others' success</li>
                  </ul>
                </div>
              </div>
              <p className="text-text-muted leading-relaxed">
                The good news? Mindset can be changed. You can train yourself to think differently about challenges and setbacks.
              </p>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-orange-500">trending_up</span>
                The Compound Effect of Consistency
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Imagine improving by just 1% every day. In a year, you'd be 37 times better. That's the power of consistent, incremental progress.
              </p>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-4 border border-amber-200">
                <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  The Math of Consistency
                </h3>
                <div className="space-y-2 text-text-muted text-sm">
                  <p className="font-mono bg-white rounded px-3 py-2">
                    1% better every day: 1.01<sup>365</sup> = 37.78
                  </p>
                  <p className="font-mono bg-white rounded px-3 py-2">
                    1% worse every day: 0.99<sup>365</sup> = 0.03
                  </p>
                </div>
                <p className="text-text-muted mt-4">
                  Small daily improvements compound into remarkable results. Small daily neglect compounds into major problems.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500">emoji_events</span>
                Building Unbreakable Habits
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Motivation gets you started. Habits keep you going. Here's how to build habits that stick:
              </p>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    1. Start Ridiculously Small
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Want to exercise daily? Start with 2 push-ups. Want to read more? Start with 1 page. Make it so easy you can't say no. Once the habit is established, you can scale up.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">🔗</span>
                    2. Stack Your Habits
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Attach new habits to existing ones: "After I pour my morning coffee, I will write 3 things I'm grateful for." The existing habit becomes a trigger for the new one.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">⏰</span>
                    3. Make It Automatic
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Design your environment to make good habits easier and bad habits harder. Lay out gym clothes the night before. Put your phone in another room while working.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    4. Track Your Progress
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Use a habit tracker. Mark an X on a calendar for every day you complete the habit. Don't break the chain. Visual progress is motivating.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-orange-500">battery_charging_full</span>
                Staying Motivated Long-Term
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Motivation naturally fluctuates. Here's how to stay on track even when enthusiasm wanes:
              </p>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1 text-sm">check_circle</span>
                  <div>
                    <strong className="text-text">Connect to your "why":</strong> Remind yourself why you started. Write it down and review it regularly.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1 text-sm">check_circle</span>
                  <div>
                    <strong className="text-text">Celebrate small wins:</strong> Acknowledge progress, no matter how minor. Each step forward deserves recognition.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1 text-sm">check_circle</span>
                  <div>
                    <strong className="text-text">Find accountability partners:</strong> Share your goals with someone who will check in on your progress.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1 text-sm">check_circle</span>
                  <div>
                    <strong className="text-text">Reframe setbacks:</strong> Missing one day doesn't mean failure. Get back on track the next day without guilt.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1 text-sm">check_circle</span>
                  <div>
                    <strong className="text-text">Visualize success:</strong> Spend 5 minutes daily imagining yourself achieving your goal and how it will feel.
                  </div>
                </li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500">refresh</span>
                Overcoming Plateaus and Burnout
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Progress isn't always linear. Here's how to handle stagnation:
              </p>
              <div className="bg-amber-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-text mb-3">When You Hit a Wall:</h3>
                <ul className="space-y-2 text-text-muted">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-500">•</span>
                    <span><strong>Rest strategically:</strong> Fatigue masquerades as lack of motivation. Take a real break.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-500">•</span>
                    <span><strong>Change your approach:</strong> If something isn't working, try a different method.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-500">•</span>
                    <span><strong>Seek learning:</strong> New knowledge can reignite enthusiasm and provide breakthroughs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-500">•</span>
                    <span><strong>Lower the bar temporarily:</strong> Maintain the habit in a reduced form rather than quitting entirely.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-orange-500">•</span>
                    <span><strong>Remember progress isn't always visible:</strong> Like bamboo growing underground for years before shooting up, your efforts are building foundations.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Inspiring Quote */}
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-8 mb-8 text-center border-2 border-amber-300">
              <span className="material-symbols-outlined text-amber-500 text-5xl mb-4 block">format_quote</span>
              <p className="text-text text-xl font-semibold italic mb-4">
                "Success is not final, failure is not fatal: it is the courage to continue that counts."
              </p>
              <p className="text-text-muted font-medium">— Winston Churchill</p>
            </div>

            {/* Key Takeaways */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-500">lightbulb</span>
                Key Takeaways
              </h2>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1">check_circle</span>
                  <span>Cultivate a growth mindset—abilities can be developed through dedication</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1">check_circle</span>
                  <span>Small daily improvements compound into extraordinary results over time</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1">check_circle</span>
                  <span>Build unbreakable habits by starting small and making them automatic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1">check_circle</span>
                  <span>Motivation fluctuates—systems and habits keep you moving forward</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 mt-1">check_circle</span>
                  <span>Plateaus are normal; rest, adapt, and trust the process</span>
                </li>
              </ul>
            </div>
          </article>

          {/* CTA */}
          <div className="mt-12 bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <h3 className="text-2xl font-bold text-text mb-3">Need Support on Your Journey?</h3>
            <p className="text-text-muted mb-6">
              Talk through your goals, challenges, and strategies with our AI therapist or a peer listener.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat?new=TherapyBro"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-amber-400 to-orange-400 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
