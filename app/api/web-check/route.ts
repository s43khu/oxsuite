import { NextRequest, NextResponse } from 'next/server';
import { isValidApiKey } from '@/lib/api-keys';
import { performWebCheckJobs } from '@/lib/web-check-jobs';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    
    if (!isValidApiKey(apiKey)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing API key' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    let validUrl: string;
    try {
      const urlObj = new URL(url);
      validUrl = urlObj.href;
    } catch {
      try {
        validUrl = new URL(`https://${url}`).href;
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    const result = await performWebCheckJobs(validUrl);

    const successfulJobs = result.jobs.filter(j => j.status === 'success').length;
    const failedJobs = result.jobs.filter(j => j.status === 'error').length;
    const skippedJobs = result.jobs.filter(j => j.status === 'skipped').length;
    const totalTime = result.jobs.reduce((sum, j) => sum + j.duration, 0);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        summary: {
          successful: successfulJobs,
          failed: failedJobs,
          skipped: skippedJobs,
          totalTime
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

