"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("listener_token");
    if (token) {
      router.push("/chat");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Therapy Listener Portal
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connect with people who need someone to listen
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                1
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Register as a Listener</h3>
                <p className="text-gray-600 text-sm">Create your account to get started</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                2
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Receive Messages</h3>
                <p className="text-gray-600 text-sm">Get notified when someone needs to talk</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                3
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Start Listening</h3>
                <p className="text-gray-600 text-sm">Chat in real-time and provide support</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Register Now
          </Link>
          <Link
            href="/login"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-md border-2 border-blue-600"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
