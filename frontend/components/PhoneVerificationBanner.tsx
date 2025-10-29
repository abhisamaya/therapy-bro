"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPhoneVerificationStatus } from '@/lib/api';

export default function PhoneVerificationBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isTemporarilyDismissed, setIsTemporarilyDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check verification status on every mount (page load, tab switch, refresh)
    const checkVerificationStatus = async () => {
      try {
        const status = await getPhoneVerificationStatus();
        // Show banner if phone is not verified
        if (!status.is_verified) {
          setIsVisible(true);
          // Reset temporary dismissal on page refresh/navigation
          setIsTemporarilyDismissed(false);
        } else {
          // Hide banner if verified
          setIsVisible(false);
        }
      } catch (error) {
        // If error (e.g., user not logged in), don't show banner
        console.log('Could not check phone verification status');
        setIsVisible(false);
      }
    };

    checkVerificationStatus();
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only temporarily dismiss for this page view
    setIsTemporarilyDismissed(true);
  };

  const handleClick = () => {
    router.push('/account');
  };

  // Don't render if temporarily dismissed or not visible
  if (isTemporarilyDismissed || !isVisible) {
    return null;
  }

  return (
    <div
      onClick={handleClick}
      className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="flex items-center gap-2 flex-1">
        <svg
          className="w-4 h-4 text-amber-600 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm text-amber-800">
          Phone number not verified.{' '}
          <span className="font-medium underline">Click here to verify</span>
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-2 p-1 hover:bg-amber-200 rounded transition-colors flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4 text-amber-700" />
      </button>
    </div>
  );
}
