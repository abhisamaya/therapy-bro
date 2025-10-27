'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TopNav from '@/components/TopNav'

type Peer = {
  id: number
  name: string
  avatar: string
  specialty: string
  experience: string
  bio: string
  availability: string
  rating: number
}

const peers: Peer[] = [
  {
    id: 1,
    name: "Rahul Sharma",
    avatar: "RS",
    specialty: "Anxiety & Stress",
    experience: "3 years",
    bio: "Specializes in helping students and young professionals manage anxiety and work-related stress through practical mindfulness techniques.",
    availability: "Mon-Fri, 9 AM - 12 PM",
    rating: 4.8
  },
  {
    id: 2,
    name: "Priya Patel",
    avatar: "PP",
    specialty: "Relationships",
    experience: "5 years",
    bio: "Expert in relationship counseling, family dynamics, and communication skills. Helps individuals navigate personal and professional relationships.",
    availability: "Tue-Sat, 4-8 PM",
    rating: 4.9
  },
  {
    id: 3,
    name: "Arjun Reddy",
    avatar: "AR",
    specialty: "Career & Growth",
    experience: "4 years",
    bio: "Focuses on career transitions, professional development, and personal growth. Former corporate professional turned peer counselor.",
    availability: "Mon-Wed, 7-10 PM",
    rating: 4.7
  },
  {
    id: 4,
    name: "Ananya Singh",
    avatar: "AS",
    specialty: "Mental Wellness",
    experience: "6 years",
    bio: "Passionate about holistic mental wellness, self-care routines, and building resilience. Creates a safe space for open conversations.",
    availability: "Wed-Sun, 5-9 PM",
    rating: 5.0
  },
  {
    id: 5,
    name: "Vikram Mehta",
    avatar: "VM",
    specialty: "Life Transitions",
    experience: "4 years",
    bio: "Helps individuals navigate major life changes - moving cities, career shifts, relationship changes, and finding purpose.",
    availability: "Thu-Sat, 6-9 PM",
    rating: 4.6
  },
  {
    id: 6,
    name: "Sneha Kapoor",
    avatar: "SK",
    specialty: "Self-Esteem & Confidence",
    experience: "3 years",
    bio: "Works with individuals struggling with self-doubt, imposter syndrome, and confidence issues. Empowering and supportive approach.",
    availability: "Mon-Fri, 5-8 PM",
    rating: 4.8
  }
]

export default function PeersPage() {
  const router = useRouter()
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
  }, [router])

  const specialties = ['all', 'Anxiety & Stress', 'Relationships', 'Career & Growth', 'Mental Wellness', 'Life Transitions', 'Self-Esteem & Confidence']

  const filteredPeers = selectedSpecialty === 'all'
    ? peers
    : peers.filter(peer => peer.specialty === selectedSpecialty)

  return (
    <div className="bg-bg min-h-screen">
      <TopNav />
      <div className="relative flex h-auto min-h-screen w-full flex-col">
        {/* Header */}
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-text text-3xl font-bold leading-tight tracking-[-0.015em]">
                Find Your Listening Bro
              </h1>
              <p className="text-text-muted text-base">
                Connect with trained peer listeners who understand and care. Schedule a session that works for you.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-text-muted text-sm font-medium whitespace-nowrap">Filter by:</span>
              {specialties.map((specialty) => (
                <button
                  key={specialty}
                  onClick={() => setSelectedSpecialty(specialty)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedSpecialty === specialty
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-bg-muted text-text-muted hover:bg-gray-200'
                  }`}
                >
                  {specialty === 'all' ? 'All Specialties' : specialty}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Peers Grid */}
        <div className="max-w-7xl mx-auto w-full px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeers.map((peer) => (
              <div
                key={peer.id}
                className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-6">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
                      {peer.avatar}
                    </div>
                    <h3 className="text-text text-xl font-bold mb-1">{peer.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-amber-400 text-lg">★</span>
                      <span className="text-text font-semibold">{peer.rating}</span>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full">
                      <span className="text-accent text-sm font-medium">{peer.specialty}</span>
                    </div>
                  </div>

                  {/* Experience */}
                  <div className="mb-4 pb-4 border-b border-border">
                    <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
                      <span className="material-symbols-outlined text-base">work_history</span>
                      <span>{peer.experience} experience</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-text-muted text-sm mb-4 line-clamp-3">
                    {peer.bio}
                  </p>

                  {/* Availability */}
                  <div className="flex items-center gap-2 text-text-muted text-sm mb-4">
                    <span className="material-symbols-outlined text-base">schedule</span>
                    <span>{peer.availability}</span>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/chat?new=${encodeURIComponent(peer.name.split(' ')[0])}`}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-br from-teal-400 to-cyan-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    <span>Start Session</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredPeers.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bg-muted mb-4">
                <span className="material-symbols-outlined text-text-muted text-3xl">search_off</span>
              </div>
              <h3 className="text-text text-lg font-semibold mb-2">No peers found</h3>
              <p className="text-text-muted">Try selecting a different specialty filter</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 flex-shrink-0">
                  <span className="material-symbols-outlined text-teal-600">verified_user</span>
                </div>
                <div>
                  <h4 className="text-text font-semibold mb-1">Trained & Verified</h4>
                  <p className="text-text-muted text-sm">All our listeners are trained in active listening and peer support techniques</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100 flex-shrink-0">
                  <span className="material-symbols-outlined text-cyan-600">lock</span>
                </div>
                <div>
                  <h4 className="text-text font-semibold mb-1">Confidential</h4>
                  <p className="text-text-muted text-sm">Your conversations are private and confidential</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-100 flex-shrink-0">
                  <span className="material-symbols-outlined text-teal-600">schedule</span>
                </div>
                <div>
                  <h4 className="text-text font-semibold mb-1">Flexible Scheduling</h4>
                  <p className="text-text-muted text-sm">Book sessions at times that work best for you</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
