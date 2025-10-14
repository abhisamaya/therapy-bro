'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNav from '@/components/TopNav'

type Article = {
  id: string
  title: string
  description: string
  category: string
  readTime: string
  icon: string
  gradient: string
}

const articles: Article[] = [
  {
    id: 'mental-health',
    title: 'Understanding Mental Health: A Holistic Approach',
    description: 'Explore the fundamentals of mental wellness, self-care practices, and building emotional resilience in daily life.',
    category: 'Mental Health',
    readTime: '8 min read',
    icon: 'psychology',
    gradient: 'from-purple-400 to-pink-400'
  },
  {
    id: 'relationships',
    title: 'Building Healthy Relationships: Connection & Communication',
    description: 'Learn the keys to nurturing meaningful relationships through empathy, boundaries, and effective communication.',
    category: 'Relationships',
    readTime: '10 min read',
    icon: 'favorite',
    gradient: 'from-rose-400 to-red-400'
  },
  {
    id: 'time-management',
    title: 'Mastering Time Management: Productivity with Balance',
    description: 'Discover strategies to manage your time effectively while maintaining work-life balance and reducing stress.',
    category: 'Productivity',
    readTime: '7 min read',
    icon: 'schedule',
    gradient: 'from-blue-400 to-cyan-400'
  },
  {
    id: 'hard-work',
    title: 'The Power of Consistency: Motivation & Growth Mindset',
    description: 'Understand how consistent effort, resilience, and a growth mindset drive long-term success and fulfillment.',
    category: 'Motivation',
    readTime: '9 min read',
    icon: 'trending_up',
    gradient: 'from-amber-400 to-orange-400'
  },
  {
    id: 'communication',
    title: 'Effective Communication: Speaking & Listening with Intent',
    description: 'Master the art of clear, compassionate communication and active listening to strengthen all your connections.',
    category: 'Communication',
    readTime: '6 min read',
    icon: 'forum',
    gradient: 'from-teal-400 to-green-400'
  }
]

export default function ResourcesPage() {
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
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-accent to-blue-500 text-white">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Resources for Your Journey
              </h1>
              <p className="text-white/90 text-lg md:text-xl">
                Explore our curated collection of articles on mental wellness, relationships, productivity, and personal growth. Each resource is designed to support you in living a more balanced and fulfilling life.
              </p>
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="max-w-7xl mx-auto w-full px-4 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-text mb-2">Featured Articles</h2>
            <p className="text-text-muted">Evidence-based insights and practical tips for everyday life</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/resources/${article.id}`}
                className="group bg-white rounded-2xl border border-border shadow-sm hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Gradient Header */}
                <div className={`bg-gradient-to-br ${article.gradient} p-6 h-32 flex items-center justify-center relative overflow-hidden`}>
                  <span className="material-symbols-outlined text-white text-6xl opacity-90">
                    {article.icon}
                  </span>
                  <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-xs font-medium">{article.readTime}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full mb-3">
                    <span className="text-accent text-xs font-semibold uppercase tracking-wide">
                      {article.category}
                    </span>
                  </div>

                  <h3 className="text-text text-lg font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-text-muted text-sm mb-4 line-clamp-3">
                    {article.description}
                  </p>

                  <div className="flex items-center gap-2 text-accent font-medium text-sm">
                    <span>Read Article</span>
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 mb-4">
                <span className="material-symbols-outlined text-white text-3xl">support_agent</span>
              </div>
              <h3 className="text-2xl font-bold text-text mb-3">
                Need Someone to Talk To?
              </h3>
              <p className="text-text-muted mb-6">
                Our trained peer listeners are here for you. Connect with a Listening Bro or chat with our AI therapist for immediate support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/peers"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <span>Find a Listening Bro</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </Link>
                <Link
                  href="/chat?new=TherapyBro"
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-accent text-accent rounded-xl font-medium hover:bg-accent/5 transition-all"
                >
                  <span>Chat with AI Therapist</span>
                  <span className="material-symbols-outlined">psychology</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
