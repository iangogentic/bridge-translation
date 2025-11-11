/**
 * Delete Document API
 * Deletes document, results, and blob file
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, results } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { del } from '@vercel/blob';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    // TODO: Get user ID from session
    const userId = '00000000-0000-0000-0000-000000000001';

    // Fetch document to verify ownership and get blob URL
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (document.ownerId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete blob file from storage
    try {
      await del(document.blobUrl);
    } catch (error) {
      console.error('Failed to delete blob file:', error);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete results first (foreign key constraint)
    await db.delete(results).where(eq(results.documentId, documentId));

    // Delete document
    await db.delete(documents).where(eq(documents.id, documentId));

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete document',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
