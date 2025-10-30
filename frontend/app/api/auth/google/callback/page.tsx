'use client'

import { useEffect } from 'react'

export default function GoogleCallbackPage() {
  useEffect(() => {
    // Parse the ID token from the URL hash
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const idToken = params.get('id_token')
    const error = params.get('error')

    if (window.opener) {
      if (error) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_ERROR',
            error: error,
          },
          window.location.origin
        )
      } else if (idToken) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_SUCCESS',
            credential: idToken,
          },
          window.location.origin
        )
      } else {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_ERROR',
            error: 'No ID token received',
          },
          window.location.origin
        )
      }

      // Close the popup after a short delay
      setTimeout(() => {
        window.close()
      }, 100)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4abbc9] mx-auto mb-4"></div>
        <p className="text-slate-700 dark:text-slate-300">Completing sign-in...</p>
      </div>
    </div>
  )
}
