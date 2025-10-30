import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-accent">Therapy Bro</h1>
            </div>
            <div>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-accent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all shadow-glow"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-text sm:text-5xl md:text-6xl">
            Welcome to <span className="text-accent">Therapy Bro</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-text-muted sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Your AI-powered therapeutic companion featuring multiple listener personas, each with distinct approaches to help you navigate life's challenges.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards */}
            <div className="bg-white rounded-lg shadow-glass p-6 hover:shadow-glow transition-shadow">
              <div className="text-accent mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Multiple AI Listeners</h3>
              <p className="text-text-muted">Choose from five distinct therapeutic personas - Yama, Siddhartha, Shankara, Kama, and Narada - each offering unique perspectives.</p>
            </div>

            <div className="bg-white rounded-lg shadow-glass p-6 hover:shadow-glow transition-shadow">
              <div className="text-accent mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Private & Secure</h3>
              <p className="text-text-muted">Your conversations are confidential and securely stored. Login with your credentials or Google account.</p>
            </div>

            <div className="bg-white rounded-lg shadow-glass p-6 hover:shadow-glow transition-shadow">
              <div className="text-accent mb-4">
                <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Real-time Responses</h3>
              <p className="text-text-muted">Experience natural, flowing conversations with AI-powered streaming responses tailored to your needs.</p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/login"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-accent hover:opacity-90 md:py-4 md:text-lg md:px-10 transition-all shadow-glow"
          >
            Get Started
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-24 bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-text-dim">
            © 2025 Therapy Bro. Your journey to wellness starts here.
          </p>
        </div>
      </footer>
    </div>
  );
}
