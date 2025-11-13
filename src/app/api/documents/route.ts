/**
 * Documents List API
 * Fetches all documents for the current user
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, results } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from Clerk session
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to view documents' },
        { status: 401 }
      );
    }

    // Fetch all documents for user with their results
    const userDocuments = await db
      .select({
        id: documents.id,
        filename: documents.filename,
        mimeType: documents.mimeType,
        fileSize: documents.fileSize,
        uploadedAt: documents.uploadedAt,
        blobUrl: documents.blobUrl,
        detectedLanguage: results.detectedLanguage,
        confidence: results.confidence,
      })
      .from(documents)
      .leftJoin(results, eq(documents.id, results.documentId))
      .where(eq(documents.ownerId, userId))
      .orderBy(desc(documents.uploadedAt));

    return NextResponse.json({
      documents: userDocuments,
      total: userDocuments.length,
    });

  } catch (error) {
    console.error('Documents list error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch documents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
