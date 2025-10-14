'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNav from '@/components/TopNav'

export default function CommunicationArticle() {
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
        <div className="bg-gradient-to-br from-teal-400 to-green-400 text-white">
          <div className="max-w-4xl mx-auto px-4 py-12">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              <span className="font-medium">Back to Resources</span>
            </Link>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <span className="text-white text-sm font-semibold uppercase tracking-wide">Communication</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Effective Communication: Speaking & Listening with Intent
            </h1>
            <div className="flex items-center gap-4 text-white/90">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">schedule</span>
                <span className="text-sm">6 min read</span>
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
                Communication is more than exchanging words—it's about understanding and being understood. Whether in relationships, at work, or with strangers, how we communicate shapes our connections, resolves conflicts, and defines our success.
              </p>
              <p className="text-text-muted text-lg leading-relaxed">
                In this article, we'll explore the art of clear, compassionate communication and the often-overlooked skill of active listening.
              </p>
            </div>

            {/* Section 1 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-teal-500">record_voice_over</span>
                The Foundations of Effective Speaking
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Be Clear and Specific
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Vague language creates misunderstandings. Instead of "We should meet soon," say "Can we meet Tuesday at 3pm?" Replace "I'm upset" with "I felt hurt when you interrupted me during the meeting."
                  </p>
                  <div className="bg-teal-50 rounded-lg p-3 text-sm text-text-muted">
                    <strong>Pro tip:</strong> Use specific examples and concrete details. This removes ambiguity and shows you've thought through your message.
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">🙋</span>
                    Use "I" Statements
                  </h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Take ownership of your feelings instead of blaming. This reduces defensiveness and opens dialogue.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <p className="text-red-600 font-semibold text-sm mb-1">❌ Accusatory</p>
                      <p className="text-text-muted text-sm">"You never listen to me!"</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-green-600 font-semibold text-sm mb-1">✅ Constructive</p>
                      <p className="text-text-muted text-sm">"I feel unheard when I share my ideas."</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="text-2xl">💬</span>
                    Match Your Tone and Body Language
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    93% of communication is non-verbal (55% body language, 38% tone). Saying "I'm fine" with crossed arms and a cold tone sends a very different message than your words suggest.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500">hearing</span>
                The Art of Active Listening
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Most people don't listen to understand—they listen to respond. Active listening means fully concentrating, understanding, responding, and remembering what's being said.
              </p>
              <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6 mb-4 border border-teal-200">
                <h3 className="text-lg font-semibold text-text mb-3">The L.I.S.T.E.N. Framework</h3>
                <ul className="space-y-3 text-text-muted">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-teal-500 mt-1">L</span>
                    <div>
                      <strong>Look:</strong> Make eye contact (culturally appropriate). Put away distractions.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-teal-500 mt-1">I</span>
                    <div>
                      <strong>Inquire:</strong> Ask clarifying questions. "What do you mean by...?" "Can you tell me more?"
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-teal-500 mt-1">S</span>
                    <div>
                      <strong>Suspend judgment:</strong> Don't interrupt or formulate your response while they're talking.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-teal-500 mt-1">T</span>
                    <div>
                      <strong>Take notes mentally:</strong> Remember key points and emotions expressed.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-teal-500 mt-1">E</span>
                    <div>
                      <strong>Empathize:</strong> Try to feel what they're feeling. "That must have been difficult."
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-teal-500 mt-1">N</span>
                    <div>
                      <strong>Nod and affirm:</strong> Show you're engaged with small acknowledgments. "I see," "Mm-hmm."
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-teal-500">psychology</span>
                Reading Between the Lines
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                People don't always say what they mean. Learn to pick up on unspoken cues:
              </p>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">visibility</span>
                  <div>
                    <strong className="text-text">Body language:</strong> Crossed arms (defensiveness), avoiding eye contact (discomfort), leaning in (interest)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">volume_up</span>
                  <div>
                    <strong className="text-text">Tone shifts:</strong> Sudden changes in volume or pitch often signal emotional reactions
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">pause</span>
                  <div>
                    <strong className="text-text">Pauses and hesitation:</strong> May indicate they're choosing words carefully or feeling uncertain
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-accent mt-1 text-sm">route</span>
                  <div>
                    <strong className="text-text">Topic avoidance:</strong> Repeatedly changing the subject might mean they're uncomfortable
                  </div>
                </li>
              </ul>
              <div className="mt-4 bg-teal-50 rounded-lg p-4 border border-teal-200">
                <p className="text-text-muted text-sm">
                  <strong>Note:</strong> When you notice these cues, gently address them: "I notice you seem hesitant. Is there something you'd like to talk about?" This shows attentiveness and care.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-green-500">support_agent</span>
                Difficult Conversations: A Roadmap
              </h2>
              <p className="text-text-muted leading-relaxed mb-4">
                Some conversations are unavoidably hard—giving feedback, setting boundaries, or addressing conflict. Here's how to handle them:
              </p>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-50 to-transparent rounded-lg p-4 border-l-4 border-teal-400">
                  <h4 className="font-semibold text-text mb-2">1. Prepare Mentally</h4>
                  <p className="text-text-muted text-sm">Clarify your goal. What outcome do you want? Stay calm before the conversation.</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-transparent rounded-lg p-4 border-l-4 border-green-400">
                  <h4 className="font-semibold text-text mb-2">2. Choose the Right Time & Place</h4>
                  <p className="text-text-muted text-sm">Private setting, when both parties are calm and have time to talk fully.</p>
                </div>
                <div className="bg-gradient-to-r from-teal-50 to-transparent rounded-lg p-4 border-l-4 border-teal-400">
                  <h4 className="font-semibold text-text mb-2">3. Start with Empathy</h4>
                  <p className="text-text-muted text-sm">"I know this might be hard to hear, but I care about our relationship..."</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-transparent rounded-lg p-4 border-l-4 border-green-400">
                  <h4 className="font-semibold text-text mb-2">4. State the Facts, Not Judgments</h4>
                  <p className="text-text-muted text-sm">"You were 30 minutes late" vs. "You're always irresponsible."</p>
                </div>
                <div className="bg-gradient-to-r from-teal-50 to-transparent rounded-lg p-4 border-l-4 border-teal-400">
                  <h4 className="font-semibold text-text mb-2">5. Listen to Their Perspective</h4>
                  <p className="text-text-muted text-sm">They might have valid reasons or different viewpoints. Hear them out.</p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-transparent rounded-lg p-4 border-l-4 border-green-400">
                  <h4 className="font-semibold text-text mb-2">6. Collaborate on Solutions</h4>
                  <p className="text-text-muted text-sm">"How can we prevent this in the future?" Make it a shared problem-solving effort.</p>
                </div>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-teal-500">build</span>
                Daily Communication Practices
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">question_answer</span>
                    Ask Better Questions
                  </h4>
                  <p className="text-text-muted text-sm">Replace "How are you?" with "What's been the highlight of your day?"</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">replay</span>
                    Paraphrase to Confirm
                  </h4>
                  <p className="text-text-muted text-sm">"So what you're saying is..." ensures understanding and shows you're listening.</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">videocam</span>
                    Reduce Digital Miscommunication
                  </h4>
                  <p className="text-text-muted text-sm">When tone matters, choose video call over text. Add context to messages.</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">sentiment_satisfied</span>
                    Express Appreciation
                  </h4>
                  <p className="text-text-muted text-sm">"I appreciate when you..." strengthens relationships and encourages positive behavior.</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">self_improvement</span>
                    Practice Mindful Pausing
                  </h4>
                  <p className="text-text-muted text-sm">Before reacting emotionally, take 3 deep breaths. Response beats reaction.</p>
                </div>
                <div className="bg-teal-50 rounded-xl p-4">
                  <h4 className="font-semibold text-text mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">feedback</span>
                    Ask for Feedback
                  </h4>
                  <p className="text-text-muted text-sm">"How did that come across?" shows humility and willingness to improve.</p>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl border border-teal-200 p-8">
              <h2 className="text-2xl font-bold text-text mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-teal-500">lightbulb</span>
                Key Takeaways
              </h2>
              <ul className="space-y-3 text-text-muted">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-500 mt-1">check_circle</span>
                  <span>Clear, specific language and "I" statements reduce misunderstandings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-500 mt-1">check_circle</span>
                  <span>Active listening means fully engaging, not just waiting to speak</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-500 mt-1">check_circle</span>
                  <span>Non-verbal cues (body language, tone) matter more than words</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-500 mt-1">check_circle</span>
                  <span>Difficult conversations require preparation, empathy, and collaboration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-500 mt-1">check_circle</span>
                  <span>Daily practice of mindful communication strengthens all relationships</span>
                </li>
              </ul>
            </div>
          </article>

          {/* CTA */}
          <div className="mt-12 bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
            <h3 className="text-2xl font-bold text-text mb-3">Practice Your Communication Skills</h3>
            <p className="text-text-muted mb-6">
              Talk through communication challenges with our AI therapist or schedule a session with a trained peer listener.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat?new=TherapyBro"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-400 to-green-400 text-white rounded-xl font-medium hover:shadow-lg transition-all"
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
