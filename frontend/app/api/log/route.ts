// app/api/log/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const timestamp = new Date().toISOString()
    const logMessage = `${timestamp} - ${message}\n`

    // Write to dedicated frontend log file
    const logPath = path.join(process.cwd(), '..', 'frontend_debug.log')

    fs.appendFileSync(logPath, logMessage)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to write frontend log:', error)
    return NextResponse.json({ error: 'Failed to log message' }, { status: 500 })
  }
}
