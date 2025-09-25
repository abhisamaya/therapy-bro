// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Forward the request to your FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || 'Google authentication failed' },
        { status: response.status }
      )
    }

    // Optionally set HTTP-only cookies here instead of returning token
    const nextResponse = NextResponse.json(data)
    
    // If you want to use HTTP-only cookies:
    // nextResponse.cookies.set('access_token', data.access_token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'lax',
    //   maxAge: 24 * 60 * 60, // 24 hours
    // })

    return nextResponse
    
  } catch (error) {
    console.error('Google auth API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}