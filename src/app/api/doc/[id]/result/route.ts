/**
 * Document result retrieval API
 * GET /api/doc/:id/result - Get translation and summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { results } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;

    // Fetch result by document ID
    const [result] = await db
      .select()
      .from(results)
      .where(eq(results.documentId, id))
      .limit(1);

    if (!result) {
      return NextResponse.json(
        { error: 'Result not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result.id,
      documentId: result.documentId,
      translation_html: result.translationHtml,
      summary: result.summaryJson,
      detected_language: result.detectedLanguage,
      target_language: result.targetLanguage,
      domain: result.domain,
      confidence: result.confidence,
      processing_time_ms: result.processingTimeMs,
      created_at: result.createdAt,
    });

  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
}
