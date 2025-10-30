'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { submitOnboarding } from '@/lib/api'

type Question = {
  id: string
  title: string
  subtitle: string
  options?: string[]
  multiSelect?: boolean
  isTextInput?: boolean
  field: 'name' | 'reasons' | 'mental_state' | 'previous_therapy' | 'goals' | 'referral_source' | 'preferred_time'
}

const QUESTIONS: Question[] = [
  {
    id: '1',
    title: 'What should we call you?',
    subtitle: 'Enter your name to personalize your experience',
    isTextInput: true,
    field: 'name'
  },
  {
    id: '2',
    title: 'What brings you here today?',
    subtitle: 'Select all that apply',
    multiSelect: true,
    field: 'reasons',
    options: [
      'Feeling anxious or stressed',
      'Relationship challenges',
      'Struggling with focus or motivation',
      'Just exploring & curious',
      'Something else'
    ]
  },
  {
    id: '3',
    title: 'How would you describe your current mental state?',
    subtitle: 'Choose the one that best describes you',
    multiSelect: false,
    field: 'mental_state',
    options: [
      'Doing great, just want to maintain balance',
      'Feeling a bit overwhelmed',
      'Going through a tough time',
      'In crisis and need support',
      'Prefer not to say'
    ]
  },
  {
    id: '4',
    title: 'Have you tried therapy or counseling before?',
    subtitle: 'This helps us understand your experience',
    multiSelect: false,
    field: 'previous_therapy',
    options: [
      'Yes, it was helpful',
      'Yes, but it didn\'t work for me',
      'No, this is my first time',
      'I\'m currently in therapy',
      'Prefer not to say'
    ]
  },
  {
    id: '5',
    title: 'What are your goals for using TherapyBro?',
    subtitle: 'Select all that apply',
    multiSelect: true,
    field: 'goals',
    options: [
      'Better manage stress and anxiety',
      'Improve relationships',
      'Build self-confidence',
      'Process difficult emotions',
      'Develop healthy coping strategies',
      'Just someone to talk to'
    ]
  },
  {
    id: '6',
    title: 'How did you hear about us?',
    subtitle: 'We\'d love to know!',
    multiSelect: false,
    field: 'referral_source',
    options: [
      'Social media',
      'Friend or family recommendation',
      'Search engine',
      'Online article or blog',
      'Mental health professional',
      'Other'
    ]
  },
  {
    id: '7',
    title: 'When do you prefer to have sessions?',
    subtitle: 'Optional - helps us personalize your experience',
    multiSelect: false,
    field: 'preferred_time',
    options: [
      'Morning (6am - 12pm)',
      'Afternoon (12pm - 6pm)',
      'Evening (6pm - 12am)',
      'Late night (12am - 6am)',
      'No preference'
    ]
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [responses, setResponses] = useState<Record<string, string | string[]>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currentQuestion = QUESTIONS[currentStep]
  const progress = currentStep + 1
  const total = QUESTIONS.length

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
    }
  }, [router])

  const handleOptionClick = (option: string) => {
    const field = currentQuestion.field

    if (currentQuestion.multiSelect) {
      // Multiple select logic
      const currentValues = (responses[field] as string[]) || []
      const isSelected = currentValues.includes(option)

      if (isSelected) {
        setResponses({
          ...responses,
          [field]: currentValues.filter((v) => v !== option)
        })
      } else {
        setResponses({
          ...responses,
          [field]: [...currentValues, option]
        })
      }
    } else {
      // Single select logic
      setResponses({
        ...responses,
        [field]: option
      })
    }
  }

  const isOptionSelected = (option: string): boolean => {
    const field = currentQuestion.field
    const value = responses[field]

    if (currentQuestion.multiSelect) {
      return Array.isArray(value) && value.includes(option)
    } else {
      return value === option
    }
  }

  const canContinue = (): boolean => {
    const field = currentQuestion.field
    const value = responses[field]

    // Last question is optional
    if (currentStep === QUESTIONS.length - 1) {
      return true
    }

    if (currentQuestion.multiSelect) {
      return Array.isArray(value) && value.length > 0
    } else {
      return typeof value === 'string' && value.length > 0
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleContinue = async () => {
    if (!canContinue() && currentStep < QUESTIONS.length - 1) {
      setError('Please select at least one option to continue')
      return
    }

    setError('')

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit responses
      await submitOnboardingData()
    }
  }

  const submitOnboardingData = async () => {
    console.log('='.repeat(80))
    console.log('🚀 ONBOARDING FORM SUBMISSION STARTED')
    console.log('='.repeat(80))

    setIsSubmitting(true)
    setError('')

    try {
      // Step 1: Check token
      console.log('📋 Step 1: Checking authentication token...')
      const token = localStorage.getItem('token')
      console.log('Token exists:', !!token)
      console.log('Token length:', token ? token.length : 0)
      console.log('Token preview:', token ? token.substring(0, 30) + '...' : 'NULL')

      if (!token) {
        console.error('❌ No token found in localStorage!')
        throw new Error('Not authenticated')
      }
      console.log('✅ Token found')

      // Step 2: Log form responses
      console.log('\n📋 Step 2: Form data to submit:')
      console.log(JSON.stringify(responses, null, 2))

      // Step 3: Submit onboarding data
      console.log('\n📋 Step 3: Calling submitOnboarding API...')
      const result = await submitOnboarding(responses)
      console.log('✅ API call successful!')
      console.log('Response:', result)

      // Step 4: Redirect
      console.log('\n📋 Step 4: Redirecting to dashboard...')
      router.push('/dashboard')
      console.log('✅ Redirect initiated')

    } catch (err: any) {
      console.error('='.repeat(80))
      console.error('❌ ONBOARDING SUBMISSION FAILED')
      console.error('='.repeat(80))
      console.error('Error type:', typeof err)
      console.error('Error name:', err?.name)
      console.error('Error message:', err?.message)
      console.error('Error stack:', err?.stack)
      console.error('Full error:', err)
      console.error('='.repeat(80))

      setError(err.message || 'Failed to submit. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f6f8f8] dark:bg-[#101d22]">
      {/* Header */}
      <header className="flex items-center p-4 justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className="text-[#101d22] dark:text-[#f6f8f8] flex size-12 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col px-4">
        <div className="flex flex-1 flex-col pt-6 pb-8 max-w-2xl mx-auto w-full">
          <h1 className="text-[#101d22] dark:text-[#f6f8f8] tracking-tight text-[32px] font-bold leading-tight text-center">
            {currentQuestion.title}
          </h1>
          <p className="text-center text-[#101d22]/70 dark:text-[#f6f8f8]/70 text-base font-normal leading-normal pt-2 pb-8">
            {currentQuestion.subtitle}
          </p>

          <div className="space-y-3">
            {currentQuestion.isTextInput ? (
              <input
                type="text"
                value={(responses[currentQuestion.field] as string) || ''}
                onChange={(e) => setResponses({ ...responses, [currentQuestion.field]: e.target.value })}
                placeholder="Enter your name"
                className="w-full p-4 border border-black/10 dark:border-white/10 rounded-xl bg-white/50 dark:bg-black/10 text-[#101d22] dark:text-[#f6f8f8] text-base font-normal focus:outline-none focus:ring-2 focus:ring-[#4abbc9] focus:ring-offset-2 focus:ring-offset-[#f6f8f8] dark:focus:ring-offset-[#101d22]"
              />
            ) : (
              currentQuestion.options?.map((option) => {
                const isSelected = isOptionSelected(option)
                return (
                  <button
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className={`w-full text-left p-4 border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#4abbc9] focus:ring-offset-2 focus:ring-offset-[#f6f8f8] dark:focus:ring-offset-[#101d22] ${
                      isSelected
                        ? 'bg-[#4abbc9]/10 dark:bg-[#4abbc9]/20 ring-2 ring-[#4abbc9] border-[#4abbc9]'
                        : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/10 hover:bg-white dark:hover:bg-black/20'
                    }`}
                  >
                    <p className="font-bold text-base text-[#101d22] dark:text-[#f6f8f8]">{option}</p>
                  </button>
                )
              })
            )}
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 pt-6 pb-8 space-y-4">
        <p className="text-center text-sm text-[#101d22]/50 dark:text-[#f6f8f8]/50">
          {progress} of {total}
        </p>
        <button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-full bg-[#4abbc9] py-4 px-6 text-base font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed max-w-2xl mx-auto"
        >
          {isSubmitting ? 'Submitting...' : currentStep === QUESTIONS.length - 1 ? 'Complete' : 'Continue'}
        </button>
      </footer>
    </div>
  )
}
