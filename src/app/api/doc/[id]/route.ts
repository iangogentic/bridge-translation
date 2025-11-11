/**
 * Document retrieval API
 * GET /api/doc/:id - Get document metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, results } from '@/db/schema';
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

    // Fetch document with result
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if result exists
    const [result] = await db
      .select()
      .from(results)
      .where(eq(results.documentId, id))
      .limit(1);

    return NextResponse.json({
      id: document.id,
      filename: document.filename,
      blobUrl: document.blobUrl,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      pageCount: document.pageCount,
      uploadedAt: document.uploadedAt,
      hasResult: !!result,
      resultId: result?.id,
    });

  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
