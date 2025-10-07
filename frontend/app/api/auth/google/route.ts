// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000'

// Helper function to log to file
function logToFile(message: string) {
  const timestamp = new Date().toISOString()
  const logMessage = `${timestamp} - ${message}\n`
  const logPath = path.join(process.cwd(), '..', 'login_debug.log')

  try {
    fs.appendFileSync(logPath, logMessage)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

export async function POST(request: NextRequest) {
  const startMsg = '\n=== NEXT.JS API ROUTE: /api/auth/google ==='
  console.log(startMsg)
  logToFile(startMsg)

  const timestampMsg = `🔵 Timestamp: ${new Date().toISOString()}`
  console.log(timestampMsg)
  logToFile(timestampMsg)

  const fastapiMsg = `📍 FastAPI URL: ${FASTAPI_URL}`
  console.log(fastapiMsg)
  logToFile(fastapiMsg)

  try {
    const body = await request.json()
    const bodyMsg = `📦 Received body from frontend: has_id_token=${!!body.id_token}, length=${body.id_token?.length}`
    console.log(bodyMsg, {
      has_id_token: !!body.id_token,
      id_token_length: body.id_token?.length,
      id_token_preview: body.id_token?.substring(0, 50) + '...'
    })
    logToFile(bodyMsg)

    const forwardMsg = `🌐 Forwarding request to FastAPI backend: ${FASTAPI_URL}/auth/google`
    console.log(forwardMsg)
    logToFile(forwardMsg)

    // Forward the request to your FastAPI backend
    const response = await fetch(`${FASTAPI_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const statusMsg = `📡 FastAPI Response Status: ${response.status} ${response.statusText}`
    console.log(statusMsg)
    logToFile(statusMsg)

    const headersMsg = `📋 FastAPI Response Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`
    console.log(headersMsg)
    logToFile(headersMsg)

    const data = await response.json()
    const dataMsg = `📦 FastAPI Response Data: has_access_token=${!!data.access_token}, token_length=${data.access_token?.length}`
    console.log(dataMsg, {
      has_access_token: !!data.access_token,
      access_token_length: data.access_token?.length,
      access_token_preview: data.access_token?.substring(0, 30) + '...',
      other_fields: Object.keys(data).filter(k => k !== 'access_token')
    })
    logToFile(dataMsg)

    if (!response.ok) {
      const errorMsg = `❌ FastAPI returned error: ${JSON.stringify(data)}`
      console.error(errorMsg)
      logToFile(errorMsg)
      return NextResponse.json(
        { error: data.detail || 'Google authentication failed', detail: data.detail },
        { status: response.status }
      )
    }

    const successMsg = '✅ Creating successful response to send to frontend'
    console.log(successMsg)
    logToFile(successMsg)

    const nextResponse = NextResponse.json(data)

    const completeMsg = '✅ Next.js API route completed successfully'
    console.log(completeMsg)
    logToFile(completeMsg)
    logToFile('=== END NEXT.JS API ROUTE ===\n')

    return nextResponse

  } catch (error: any) {
    const errorMsg = `❌ CRITICAL ERROR in Next.js API route: ${error.name} - ${error.message}`
    console.error(errorMsg, error)
    logToFile(errorMsg)
    logToFile(`Error stack: ${error.stack}`)
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Error cause:', error.cause)
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)))

    // Check if it's a fetch error (network issue)
    let detailMessage = error.message
    if (error.cause) {
      detailMessage += ` (Cause: ${error.cause})`
    }
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      detailMessage = `Cannot connect to backend at ${FASTAPI_URL}/auth/google. Backend may be down or unreachable.`
    }

    logToFile(`Error detail: ${detailMessage}`)
    logToFile(`Backend URL: ${FASTAPI_URL}/auth/google`)

    return NextResponse.json(
      {
        error: 'Internal server error',
        detail: detailMessage,
        backend_url: `${FASTAPI_URL}/auth/google`,
        error_type: error.name
      },
      { status: 500 }
    )
  }
}